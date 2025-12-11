const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs'); // Import bcryptjs

const dbPath = path.resolve(__dirname, 'timesheet.db');
const db = new sqlite3.Database(dbPath);

const adminUser = 'admin@pristonix';
const adminPass = '!pristonixadmin@2025';

// Wrap bcrypt in async/iife
(async () => {
    try {
        const hashedPass = await bcrypt.hash(adminPass, 10);

        db.serialize(() => {
            db.run("DELETE FROM users WHERE role = 'admin'", function (err) {
                if (err) console.error('Error deleting admin:', err);
                else console.log('Deleted existing admin(s).');
            });

            const stmt = db.prepare("INSERT INTO users (name, username, password, role, createdAt) VALUES (?, ?, ?, ?, ?)");
            stmt.run("Master Admin", adminUser, hashedPass, 'admin', new Date().toISOString(), function (err) {
                if (err) console.error('Error inserting admin:', err);
                else console.log('Admin user recreated with HASHED password successfully.');
            });
            stmt.finalize();

            // 3. Verify
            db.all("SELECT * FROM users WHERE username = ?", [adminUser], (err, rows) => {
                if (err) console.error("Error verifying:", err);
                else console.log("Verification:", rows);
            });
        });

        db.close();
    } catch (err) {
        console.error('Error hashing password:', err);
    }
})();
