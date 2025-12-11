const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./timesheet.db');

db.serialize(() => {
    db.all("SELECT id, username, role FROM users", (err, rows) => {
        if (err) {
            console.error(err);
            return;
        }
        console.log('Users found:', rows);
    });
});

db.close();
