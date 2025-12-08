const XLSX = require('xlsx');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database Setup
const dbPath = path.resolve(__dirname, 'timesheet.db');
const db = new sqlite3.Database(dbPath);

console.log('Starting fresh import...\n');

// First, clear existing data
function clearDatabase() {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run('DELETE FROM activities', (err) => {
                if (err) console.error('Error clearing activities:', err);
            });
            db.run('DELETE FROM employees', (err) => {
                if (err) console.error('Error clearing employees:', err);
                else {
                    console.log('Database cleared successfully');
                    resolve();
                }
            });
        });
    });
}

// Read the Excel file
const workbook = XLSX.readFile('Timesheet.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// Get the range
const range = XLSX.utils.decode_range(worksheet['!ref']);
console.log(`Excel file has ${range.e.r + 1} rows and ${range.e.c + 1} columns\n`);

// Convert to array of arrays for easier processing
const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false });

console.log('First few rows:');
data.slice(0, 5).forEach((row, i) => {
    console.log(`Row ${i}:`, row);
});
console.log('');

// Employee list
const allowedEmployees = [
    'Anitha', 'Asha', 'Aswini', 'Balaji', 'Dhivya', 'Dharma',
    'Jegan', 'Kamal', 'Kumaran', 'Loki', 'Mani', 'Nandhini', 'Sakthi',
    'Sandhiya', 'Sangeetha', 'Vivek', 'Yogesh'
];

// Name mapping for alternate spellings
const nameMapping = {
    'Lokesh': 'Loki',
    'Ashwini': 'Aswini'
};

// Function to normalize employee name
function normalizeEmployeeName(name) {
    if (!name) return null;
    const trimmedName = name.toString().trim();
    return nameMapping[trimmedName] || trimmedName;
}

// Create employee ID map
const employeeMap = {};
allowedEmployees.forEach((name, index) => {
    employeeMap[name] = `emp_${Date.now()}_${index}`;
});

// Function to insert employees
function insertEmployees() {
    return new Promise((resolve, reject) => {
        const stmt = db.prepare('INSERT INTO employees (id, name, createdAt) VALUES (?, ?, ?)');

        allowedEmployees.forEach(name => {
            stmt.run(employeeMap[name], name, new Date().toISOString());
        });

        stmt.finalize((err) => {
            if (err) reject(err);
            else {
                console.log(`${allowedEmployees.length} employees inserted successfully`);
                resolve();
            }
        });
    });
}

// Function to determine activity type
function determineActivityType(description) {
    if (!description || description.trim() === '') return null;

    const desc = description.toString().toLowerCase().trim();

    if (desc === 'break' || desc.includes('tea break') || desc.includes('break time')) {
        return { type: 'break', description: 'BREAK' };
    }

    if (desc === 'lunch' || desc.includes('lunch')) {
        return { type: 'lunch', description: 'LUNCH' };
    }

    if (desc.includes('meeting') || desc.includes('discussion')) {
        return { type: 'meeting', description: description };
    }

    return { type: 'work', description: description };
}

// Function to insert activities
async function insertActivities() {
    return new Promise((resolve, reject) => {
        const stmt = db.prepare(`
            INSERT INTO activities (dateKey, employeeId, timeSlot, type, description, timestamp)
            VALUES (?, ?, ?, ?, ?, ?)
        `);

        let insertCount = 0;
        let headerRowIndex = -1;

        // Find the header row (contains "Employee Name" or similar)
        for (let i = 0; i < Math.min(10, data.length); i++) {
            const row = data[i];
            if (row && row.some(cell => cell && cell.toString().toLowerCase().includes('employee'))) {
                headerRowIndex = i;
                console.log(`Found header at row ${i}:`, row);
                break;
            }
        }

        if (headerRowIndex === -1) {
            console.log('Could not find header row, using row 2 as default');
            headerRowIndex = 2;
        }

        const headers = data[headerRowIndex];
        console.log('\nProcessing data rows...\n');

        // Get today's date
        const today = new Date();
        const dateKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

        // Time slots start from column 2
        const timeSlots = [
            '9:00-10:00',    // Column 2
            '10:00-11:00',   // Column 3
            '11:00-11:10',   // Column 4
            '11:10-12:00',   // Column 5
            '12:00-01:00',   // Column 6
            '01:00-01:40',   // Column 7
            '01:40-03:00',   // Column 8
            '03:00-03:50',   // Column 9
            '03:50-04:00',   // Column 10
            '04:00-05:00',   // Column 11
            '05:00-06:00',   // Column 12
            '06:00-07:00',   // Column 13
            '07:00-08:00'    // Column 14
        ];

        // Process data rows (skip header and rows before it)
        for (let i = headerRowIndex + 1; i < data.length; i++) {
            const row = data[i];
            if (!row || row.length === 0) continue;

            // Column 0: S.No (skip)
            // Column 1: Employee Name
            const rawEmployeeName = row[1];
            const employeeName = normalizeEmployeeName(rawEmployeeName);

            // Skip employees not in the allowed list (except Venu, Nandhini, Yazhini - skip silently)
            if (!employeeName || !employeeMap[employeeName]) {
                if (rawEmployeeName && !['Venu', 'Nandhini', 'Yazhini'].includes(rawEmployeeName.toString().trim())) {
                    console.log(`Mapping ${rawEmployeeName} to ${employeeName || 'UNKNOWN'}`);
                }
                continue;
            }

            const employeeId = employeeMap[employeeName];

            timeSlots.forEach((timeSlot, index) => {
                const columnIndex = index + 2; // Time slots start at column 2
                const activityDesc = row[columnIndex];

                if (activityDesc && activityDesc.toString().trim() !== '') {
                    const activityInfo = determineActivityType(activityDesc);

                    if (activityInfo) {
                        stmt.run(
                            dateKey,
                            employeeId,
                            timeSlot,
                            activityInfo.type,
                            activityInfo.description,
                            new Date().toISOString()
                        );
                        insertCount++;
                    }
                }
            });
        }

        stmt.finalize((err) => {
            if (err) reject(err);
            else {
                console.log(`\n${insertCount} activities inserted successfully`);
                resolve();
            }
        });
    });
}

// Main execution
async function importData() {
    try {
        await clearDatabase();
        await insertEmployees();
        await insertActivities();
        console.log('\nData import completed successfully!');
        console.log('Please refresh your browser to see the updated data.');
        db.close();
    } catch (error) {
        console.error('Error importing data:', error);
        db.close();
    }
}

importData();
