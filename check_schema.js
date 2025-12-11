const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./timesheet.db');
db.all("PRAGMA table_info(activity_log)", [], (err, rows) => {
    if (err) console.error(err);
    else console.log(JSON.stringify(rows, null, 2));
    db.close();
});
