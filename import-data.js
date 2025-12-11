const XLSX = require('xlsx');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');


const dbPath = path.resolve(__dirname, 'timesheet.db');
const db = new sqlite3.Database(dbPath);

console.log('Starting fresh import...\n');


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


const workbook = XLSX.readFile('Timesheet.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];


const range = XLSX.utils.decode_range(worksheet['!ref']);
console.log(`Excel file has ${range.e.r + 1} rows and ${range.e.c + 1} columns\n`);


const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false });

console.log('First few rows:');
data.slice(0, 5).forEach((row, i) => {
    console.log(`Row ${i}:`, row);
});
console.log('');


const allowedEmployees = [
    'Anitha', 'Asha', 'Aswini', 'Balaji', 'Dhivya', 'Dharma',
    'Jegan', 'Kamal', 'Kumaran', 'Loki', 'Mani', 'Nandhini', 'Sakthi',
    'Sandhiya', 'Sangeetha', 'Vivek', 'Yogesh'
];


const nameMapping = {
    'Lokesh': 'Loki',
    'Ashwini': 'Aswini'
};


function normalizeEmployeeName(name) {
    if (!name) return null;
    const trimmedName = name.toString().trim();
    return nameMapping[trimmedName] || trimmedName;
}


const employeeMap = {};
allowedEmployees.forEach((name, index) => {
    employeeMap[name] = `emp_${Date.now()}_${index}`;
});


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


async function insertActivities() {
    return new Promise((resolve, reject) => {
        const stmt = db.prepare(`
            INSERT INTO activities (dateKey, employeeId, timeSlot, type, description, timestamp)
            VALUES (?, ?, ?, ?, ?, ?)
        `);

        let insertCount = 0;
        let headerRowIndex = -1;


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


        const today = new Date();
        const dateKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;


        const timeSlots = [
            '9:00-10:00',
            '10:00-11:00',
            '11:00-11:10',
            '11:10-12:00',
            '12:00-01:00',
            '01:00-01:40',
            '01:40-03:00',
            '03:00-03:50',
            '03:50-04:00',
            '04:00-05:00',
            '05:00-06:00',
            '06:00-07:00',
            '07:00-08:00'
        ];


        for (let i = headerRowIndex + 1; i < data.length; i++) {
            const row = data[i];
            if (!row || row.length === 0) continue;



            const rawEmployeeName = row[1];
            const employeeName = normalizeEmployeeName(rawEmployeeName);


            if (!employeeName || !employeeMap[employeeName]) {
                if (rawEmployeeName && !['Venu', 'Nandhini', 'Yazhini'].includes(rawEmployeeName.toString().trim())) {
                    console.log(`Mapping ${rawEmployeeName} to ${employeeName || 'UNKNOWN'}`);
                }
                continue;
            }

            const employeeId = employeeMap[employeeName];

            timeSlots.forEach((timeSlot, index) => {
                const columnIndex = index + 2;
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
