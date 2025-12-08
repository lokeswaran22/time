const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database Setup
const dbPath = path.resolve(__dirname, 'timesheet.db');
const db = new sqlite3.Database(dbPath);

console.log('Starting sample data generation...\n');

// Employee list
const allowedEmployees = [
    'Anitha', 'Asha', 'Aswini', 'Balaji', 'Dhivya', 'Dharma',
    'Jegan', 'Kamal', 'Kumaran', 'Loki', 'Mani', 'Nandhini', 'Sakthi',
    'Sandhiya', 'Sangeetha', 'Vivek', 'Yogesh'
];

// Time slots
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

// Sample work descriptions
const workDescriptions = [
    'Production Line A',
    'Assembly Task',
    'Quality Check',
    'Packaging',
    'Machine Maintenance',
    'Inventory Count',
    'Safety Inspection',
    'Documentation',
    'Material Handling',
    'Process Monitoring'
];

function getRandomWorkDescription() {
    return workDescriptions[Math.floor(Math.random() * workDescriptions.length)];
}

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

function insertEmployees() {
    return new Promise((resolve, reject) => {
        const stmt = db.prepare('INSERT INTO employees (id, name, createdAt) VALUES (?, ?, ?)');
        const employeeMap = {};

        allowedEmployees.forEach((name, index) => {
            const id = `emp_${Date.now()}_${index}`;
            employeeMap[name] = id;
            stmt.run(id, name, new Date().toISOString());
        });

        stmt.finalize((err) => {
            if (err) reject(err);
            else {
                console.log(`${allowedEmployees.length} employees inserted successfully`);
                resolve(employeeMap);
            }
        });
    });
}

function generateActivities(employeeMap) {
    return new Promise((resolve, reject) => {
        const stmt = db.prepare(`
            INSERT INTO activities (dateKey, employeeId, timeSlot, type, description, timestamp)
            VALUES (?, ?, ?, ?, ?, ?)
        `);

        let insertCount = 0;
        const today = new Date();
        const dateKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

        Object.entries(employeeMap).forEach(([name, id]) => {
            timeSlots.forEach(slot => {
                let type = 'work';
                let description = getRandomWorkDescription();

                // Fixed breaks and lunch
                if (slot === '11:00-11:10' || slot === '03:50-04:00') {
                    type = 'break';
                    description = 'BREAK';
                } else if (slot === '01:00-01:40') {
                    type = 'lunch';
                    description = 'LUNCH';
                } else {
                    // Random meetings (10% chance)
                    if (Math.random() < 0.1) {
                        type = 'meeting';
                        description = 'Team Meeting';
                    }
                }

                stmt.run(
                    dateKey,
                    id,
                    slot,
                    type,
                    description,
                    new Date().toISOString()
                );
                insertCount++;
            });
        });

        stmt.finalize((err) => {
            if (err) reject(err);
            else {
                console.log(`${insertCount} activities generated successfully`);
                resolve();
            }
        });
    });
}

async function run() {
    try {
        await clearDatabase();
        const employeeMap = await insertEmployees();
        await generateActivities(employeeMap);
        console.log('\nSample data generation completed successfully!');
        db.close();
    } catch (error) {
        console.error('Error generating data:', error);
        db.close();
    }
}

run();
