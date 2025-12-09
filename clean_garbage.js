const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'timesheet.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    console.log('Cleaning activities table...');
    db.run(`DELETE FROM activities WHERE description LIKE '< div%' OR description LIKE '<div%'`, function (err) {
        if (err) console.error(err);
        else console.log(`Deleted ${this.changes} bad rows from activities`);
    });

    console.log('Cleaning activity_log table...');
    db.run(`DELETE FROM activity_log WHERE description LIKE '< div%' OR description LIKE '<div%'`, function (err) {
        if (err) console.error(err);
        else console.log(`Deleted ${this.changes} bad rows from activity_log`);
    });
});

db.close();
