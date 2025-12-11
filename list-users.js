const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'timesheet.db');
const db = new sqlite3.Database(dbPath);

db.all('SELECT id, name, username, role FROM users ORDER BY id', (err, rows) => {
    if (err) {
        console.error('Error:', err);
    } else {
        console.log('\n📋 Current Users in Database:\n');
        console.table(rows);
        console.log('\n✅ Total users:', rows.length);
    }
    db.close();
});
