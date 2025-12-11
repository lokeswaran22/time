const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'timesheet.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        return;
    }
    console.log('Connected to SQLite database.');
});

db.all("SELECT id, username, password, role FROM users", [], (err, rows) => {
    if (err) {
        throw err;
    }
    console.log('Users found:', rows.length);
    rows.forEach(row => {
        console.log(`User: [${row.username}] (Length: ${row.username.length})`);
        console.log(`Pass: [${row.password}] (Length: ${row.password.length})`);

        // Check for hidden chars
        console.log('User codes:', row.username.split('').map(c => c.charCodeAt(0)));
        console.log('Pass codes:', row.password.split('').map(c => c.charCodeAt(0)));
    });
    db.close();
});
