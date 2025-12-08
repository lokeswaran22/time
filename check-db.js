const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'timesheet.db');
const db = new sqlite3.Database(dbPath);

console.log('Checking database contents...\n');

db.all('SELECT * FROM employees ORDER BY name', [], (err, rows) => {
    if (err) {
        console.error('Error fetching employees:', err);
        return;
    }
    console.log(`Found ${rows.length} employees:`);
    rows.forEach(emp => {
        console.log(`  - ${emp.name} (ID: ${emp.id})`);
    });
    console.log('');
});

db.all('SELECT * FROM activities LIMIT 10', [], (err, rows) => {
    if (err) {
        console.error('Error fetching activities:', err);
        return;
    }
    console.log(`Found activities (showing first 10 of total):`);
    rows.forEach(act => {
        console.log(`  - ${act.dateKey} | ${act.employeeId} | ${act.timeSlot} | ${act.type}: ${act.description}`);
    });
    console.log('');

    db.get('SELECT COUNT(*) as count FROM activities', [], (err, row) => {
        if (err) {
            console.error('Error counting activities:', err);
        } else {
            console.log(`Total activities in database: ${row.count}`);
        }
        db.close();
    });
});
