const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(__dirname, 'timesheet.db');
const db = new sqlite3.Database(dbPath);

function run(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
}

async function init() {
    try {
        // 1. Unified Users Table
        await run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT CHECK(role IN ('admin', 'employee')) NOT NULL DEFAULT 'employee',
                email TEXT,
                createdAt TEXT
            )
        `);

        // 2. Activities Table
        await run(`
            CREATE TABLE IF NOT EXISTS activities (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                userId INTEGER,
                dateKey TEXT,
                timeSlot TEXT,
                type TEXT,
                description TEXT,
                totalPages TEXT,
                pagesDone TEXT,
                timestamp TEXT,
                FOREIGN KEY(userId) REFERENCES users(id)
            )
        `);

        // 3. Leave Requests
        await run(`
            CREATE TABLE IF NOT EXISTS leave_requests (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                userId INTEGER,
                startDate TEXT,
                endDate TEXT,
                reason TEXT,
                status TEXT DEFAULT 'Pending',
                createdAt TEXT,
                FOREIGN KEY(userId) REFERENCES users(id)
            )
        `);

        // 4. Permissions
        await run(`
            CREATE TABLE IF NOT EXISTS permissions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                userId INTEGER,
                date TEXT,
                startTime TEXT,
                endTime TEXT,
                reason TEXT,
                status TEXT DEFAULT 'Pending',
                createdAt TEXT,
                FOREIGN KEY(userId) REFERENCES users(id)
            )
        `);

        // 5. Activity Log
        await run(`
            CREATE TABLE IF NOT EXISTS activity_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                employeeName TEXT,
                activityType TEXT,
                description TEXT,
                timeSlot TEXT,
                action TEXT,
                editedBy TEXT, 
                timestamp TEXT
            )
        `);

        console.log("Tables created.");

        // Create Admin
        const adminUser = 'admin@pristonix';
        const adminPass = '!pristonixadmin@2025';
        const hashedPass = await bcrypt.hash(adminPass, 10);

        await run("DELETE FROM users WHERE role = 'admin'");
        await run(
            'INSERT INTO users (name, username, password, role, createdAt) VALUES (?, ?, ?, ?, ?)',
            ['Master Admin', adminUser, hashedPass, 'admin', new Date().toISOString()]
        );
        console.log("Admin initialized with hashed password.");

    } catch (e) {
        console.error(e);
    } finally {
        db.close();
    }
}

init();
