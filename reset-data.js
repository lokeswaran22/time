const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'timesheet.db');
const db = new sqlite3.Database(dbPath);

console.log('Clearing all data from database...\n');

db.serialize(() => {
    db.run('DELETE FROM activities', (err) => {
        if (err) {
            console.error('Error clearing activities:', err);
        } else {
            console.log('✅ All activities deleted');
        }
    });

    db.run('DELETE FROM employees', (err) => {
        if (err) {
            console.error('Error clearing employees:', err);
        } else {
            console.log('✅ All employees deleted');
        }
    });

    // Add the 16 allowed employees back
    const allowedEmployees = [
        'Anitha', 'Asha', 'Aswini', 'Balaji', 'Dhivya', 'Dharma',
        'Jegan', 'Kamal', 'Kumaran', 'Loki', 'Mani', 'Nandhini', 'Sakthi',
        'Sandhiya', 'Sangeetha', 'Vivek', 'Yogesh'
    ];

    const stmt = db.prepare('INSERT INTO employees (id, name, createdAt) VALUES (?, ?, ?)');

    allowedEmployees.forEach((name, index) => {
        const id = `emp_${Date.now()}_${index}`;
        stmt.run(id, name, new Date().toISOString());
    });

    stmt.finalize((err) => {
        if (err) {
            console.error('Error adding employees:', err);
        } else {
            console.log(`✅ ${allowedEmployees.length} employees added (fresh start)`);
            console.log('\nDatabase is now fresh and ready!');
            console.log('Employees are in place, but no activities yet.');
            console.log('\nRefresh your browser at http://localhost:3000 to see the clean slate.');
        }
        db.close();
    });
});
