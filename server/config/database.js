const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
    constructor() {
        this.dbPath = path.resolve(__dirname, '../../timesheet.db');
        this.db = null;
    }

    connect() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('Error opening database:', err.message);
                    reject(err);
                } else {
                    console.log('✅ Connected to SQLite database');
                    this.initializeTables().then(resolve).catch(reject);
                }
            });
        });
    }

    async initializeTables() {
        const tables = [
            // Users table for authentication
            `CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT DEFAULT 'employee',
                createdAt TEXT,
                updatedAt TEXT
            )`,

            // Employees table
            `CREATE TABLE IF NOT EXISTS employees (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT,
                phone TEXT,
                department TEXT,
                position TEXT,
                status TEXT DEFAULT 'active',
                userId INTEGER,
                createdAt TEXT,
                updatedAt TEXT,
                FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL
            )`,

            // Timesheet entries table
            `CREATE TABLE IF NOT EXISTS timesheets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                employeeId TEXT NOT NULL,
                dateKey TEXT NOT NULL,
                timeSlot TEXT NOT NULL,
                activityType TEXT NOT NULL,
                description TEXT,
                startPage INTEGER,
                endPage INTEGER,
                totalPages INTEGER,
                pagesDone INTEGER,
                status TEXT DEFAULT 'draft',
                submittedAt TEXT,
                approvedAt TEXT,
                approvedBy INTEGER,
                createdAt TEXT,
                updatedAt TEXT,
                FOREIGN KEY (employeeId) REFERENCES employees(id) ON DELETE CASCADE,
                FOREIGN KEY (approvedBy) REFERENCES users(id) ON DELETE SET NULL,
                UNIQUE(dateKey, employeeId, timeSlot)
            )`,

            // Activity log table
            `CREATE TABLE IF NOT EXISTS activity_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                employeeId TEXT,
                employeeName TEXT NOT NULL,
                activityType TEXT NOT NULL,
                action TEXT NOT NULL,
                description TEXT,
                timeSlot TEXT,
                dateKey TEXT,
                editedBy TEXT,
                metadata TEXT,
                createdAt TEXT NOT NULL
            )`,

            // Clock-in/out records
            `CREATE TABLE IF NOT EXISTS attendance (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                employeeId TEXT NOT NULL,
                dateKey TEXT NOT NULL,
                clockIn TEXT,
                clockOut TEXT,
                totalHours REAL,
                status TEXT DEFAULT 'present',
                notes TEXT,
                createdAt TEXT,
                updatedAt TEXT,
                FOREIGN KEY (employeeId) REFERENCES employees(id) ON DELETE CASCADE,
                UNIQUE(dateKey, employeeId)
            )`,

            // Deleted records backup
            `CREATE TABLE IF NOT EXISTS deleted_records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                recordType TEXT NOT NULL,
                recordId TEXT,
                recordData TEXT,
                deletedBy TEXT,
                deletedAt TEXT
            )`,

            // Approvals table
            `CREATE TABLE IF NOT EXISTS approvals (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timesheetId INTEGER NOT NULL,
                employeeId TEXT NOT NULL,
                dateKey TEXT NOT NULL,
                status TEXT DEFAULT 'pending',
                approvedBy INTEGER,
                approvalNotes TEXT,
                createdAt TEXT,
                updatedAt TEXT,
                FOREIGN KEY (timesheetId) REFERENCES timesheets(id) ON DELETE CASCADE,
                FOREIGN KEY (employeeId) REFERENCES employees(id) ON DELETE CASCADE,
                FOREIGN KEY (approvedBy) REFERENCES users(id) ON DELETE SET NULL
            )`
        ];

        try {
            for (const table of tables) {
                await this.run(table);
            }
            console.log('✅ Database tables initialized');
        } catch (err) {
            console.error('❌ Error initializing tables:', err);
            throw err;
        }
    }

    // Promisified database methods
    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function (err) {
                if (err) reject(err);
                else resolve(this);
            });
        });
    }

    get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    all(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    close() {
        return new Promise((resolve, reject) => {
            this.db.close((err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }
}

// Export singleton instance
const database = new Database();
module.exports = database;
