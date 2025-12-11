const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'timesheet.db');
const db = new sqlite3.Database(dbPath);

const username = 'admin@pristonix';
const password = '!pristonixadmin@2025';

db.serialize(() => {
    // 1. Delete existing admin
    db.run("DELETE FROM users WHERE username = ?", [username], (err) => {
        if (err) console.error("Error deleting:", err);
        else console.log("Deleted existing admin user (if any).");
    });

    // 2. Insert fresh
    const stmt = db.prepare('INSERT INTO users (username, password, role, createdAt) VALUES (?, ?, ?, ?)');
    stmt.run(username, password, 'admin', new Date().toISOString(), (err) => {
        if (err) console.error("Error inserting:", err);
        else console.log(`Created admin user: ${username} with password: ${password}`);
    });
    stmt.finalize();

    // 3. Verify
    db.all("SELECT * FROM users WHERE username = ?", [username], (err, rows) => {
        console.log("Verification:", rows);
    });
});

db.close();
