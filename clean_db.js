const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const db = new sqlite3.Database(path.resolve(__dirname, 'timesheet.db'));

db.serialize(() => {
    db.run("DROP TABLE IF EXISTS users");
    db.run("DROP TABLE IF EXISTS employees");
    db.run("DELETE FROM activities"); // Clear old activities with incompatible IDs
    console.log("Cleaned up old tables and data.");
});

db.close();
