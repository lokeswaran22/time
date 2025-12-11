const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const xlsx = require('xlsx');
const bcrypt = require('bcryptjs');

const app = express();
const port = process.env.PORT || 3000;
const dbPath = path.resolve(__dirname, 'timesheet.db');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '.')));

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('Error opening database:', err.message);
    else {
        console.log('Connected to SQLite database.');
        initDb();
    }
});

// Helper functions for Promises
function run(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
}

function get(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
}

function all(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

// Initialize Database
async function initDb() {
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
                timestamp TEXT,
                dateKey TEXT
            )
        `);

        // Migration: Add dateKey if it doesn't exist (for existing DBs)
        try {
            await run('ALTER TABLE activity_log ADD COLUMN dateKey TEXT');
            console.log('Migrated activity_log: Added dateKey column');
        } catch (e) {
            // Ignore error if column already exists (SQLITE_ERROR: duplicate column name: dateKey)
            if (!e.message.includes('duplicate column name')) {
                console.warn('Migration warning (activity_log dateKey):', e.message);
            }
        }

        // Default Admin Check
        const admin = await get("SELECT * FROM users WHERE role = 'admin'");
        if (!admin) {
            const adminUser = 'admin@pristonix';
            const adminPass = '!pristonixadmin@2025';
            const hashedPass = await bcrypt.hash(adminPass, 10);

            await run(
                'INSERT INTO users (name, username, password, role, createdAt) VALUES (?, ?, ?, ?, ?)',
                ['Master Admin', adminUser, hashedPass, 'admin', new Date().toISOString()]
            );
            console.log('Admin user created successfully (Secure).');
        }

        console.log('Database schema synchronized.');
    } catch (err) {
        console.error('Error initializing database:', err);
    }
}

// ==========================================
// API ROUTES
// ==========================================

// Login
app.post('/api/login', async (req, res) => {
    let { username, password } = req.body;
    if (username) username = username.trim();
    if (password) password = password.trim();

    try {
        const user = await get(
            'SELECT * FROM users WHERE username = ?',
            [username]
        );

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // 1. Try secure comparison
        let match = await bcrypt.compare(password, user.password);

        // 2. Fallback: Check plain text (Lazy Migration)
        if (!match && password === user.password) {
            console.log(`Migrating user ${username} to hashed password...`);
            const newHash = await bcrypt.hash(password, 10);
            await run('UPDATE users SET password = ? WHERE id = ?', [newHash, user.id]);
            match = true;
        }

        if (!match) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Return user info necessary for frontend
        res.json({
            user: {
                id: user.id,
                name: user.name,
                username: user.username,
                role: user.role,
                employeeId: user.id
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Users
app.get('/api/users', async (req, res) => {
    try {
        const users = await all('SELECT id, name, username, role, email, password, createdAt FROM users ORDER BY name');
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create User
app.post('/api/users', async (req, res) => {
    const { name, username, password, role, email } = req.body;
    try {
        if (!username || !password || !name) {
            return res.status(400).json({ error: 'Name, Username and Password are required.' });
        }
        const existing = await get('SELECT id FROM users WHERE username = ?', [username]);
        if (existing) {
            return res.status(400).json({ error: 'Username already exists.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await run(
            'INSERT INTO users (name, username, password, role, email, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
            [name, username, hashedPassword, role || 'employee', email || '', new Date().toISOString()]
        );
        res.json({ id: result.lastID, name, username, role, message: 'User created' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update User
app.put('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    const { name, username, password, role, email } = req.body;
    try {
        const user = await get('SELECT * FROM users WHERE id = ?', [id]);
        if (!user) return res.status(404).json({ error: 'User not found' });

        let query = 'UPDATE users SET name = ?, username = ?, role = ?, email = ?';
        let params = [name, username, role, email];

        if (password && password.trim() !== '') {
            const hashedPassword = await bcrypt.hash(password.trim(), 10);
            query += ', password = ?';
            params.push(hashedPassword);
        }
        query += ' WHERE id = ?';
        params.push(id);

        await run(query, params);
        res.json({ message: 'User updated successfully' });
    } catch (err) {
        if (err.message.includes('UNIQUE')) {
            return res.status(400).json({ error: 'Username already taken' });
        }
        res.status(500).json({ error: err.message });
    }
});

// Delete User
app.delete('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await run('BEGIN TRANSACTION');
        await run('DELETE FROM activities WHERE userId = ?', [id]);
        await run('DELETE FROM leave_requests WHERE userId = ?', [id]);
        await run('DELETE FROM permissions WHERE userId = ?', [id]);
        const result = await run('DELETE FROM users WHERE id = ?', [id]);
        await run('COMMIT');
        res.json({ message: 'User deleted', changes: result.changes });
    } catch (err) {
        await run('ROLLBACK');
        res.status(500).json({ error: err.message });
    }
});

// Activities
app.get('/api/activities', async (req, res) => {
    const { dateKey, userId } = req.query;
    let query = 'SELECT * FROM activities';
    let params = [];
    let clauses = [];

    if (dateKey) { clauses.push('dateKey = ?'); params.push(dateKey); }
    if (userId) { clauses.push('userId = ?'); params.push(userId); }

    if (clauses.length > 0) {
        query += ' WHERE ' + clauses.join(' AND ');
    }

    try {
        const rows = await all(query, params);
        const activities = {};

        rows.forEach(row => {
            if (!activities[row.dateKey]) activities[row.dateKey] = {};
            if (!activities[row.dateKey][row.userId]) activities[row.dateKey][row.userId] = {};
            if (!activities[row.dateKey][row.userId][row.timeSlot]) activities[row.dateKey][row.userId][row.timeSlot] = [];

            activities[row.dateKey][row.userId][row.timeSlot].push({
                id: row.id, // Include ID for updates/deletes
                type: row.type,
                description: row.description,
                totalPages: row.totalPages,
                pagesDone: row.pagesDone,
                timestamp: row.timestamp
            });
        });

        res.json(activities);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/activities', async (req, res) => {
    const { dateKey, employeeId, userId, timeSlot, type, description, totalPages, pagesDone, timestamp } = req.body;
    const finalUserId = userId || employeeId;

    try {
        await run(`
            INSERT INTO activities (userId, dateKey, timeSlot, type, description, totalPages, pagesDone, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [finalUserId, dateKey, timeSlot, type, description, totalPages, pagesDone, timestamp]);
        res.json({ status: 'saved' });
    } catch (err) {
        console.error('POST /api/activities Error:', err);
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/activities', async (req, res) => {
    const { dateKey, employeeId, userId, timeSlot } = req.body;
    const finalUserId = userId || employeeId;

    try {
        const result = await run(`
            DELETE FROM activities 
            WHERE dateKey = ? AND userId = ? AND timeSlot = ?
        `, [dateKey, finalUserId, timeSlot]);
        res.json({ message: 'Deleted', changes: result.changes });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Activity Log (for Recent Changes)
app.get('/api/activity-log', async (req, res) => {
    const limit = parseInt(req.query.limit) || 50;
    const date = req.query.date; // Expects 'YYYY-MM-DD'

    try {
        let query = 'SELECT * FROM activity_log';
        const params = [];

        if (date) {
            // Strict filtering by dateKey
            query += ' WHERE dateKey = ?';
            params.push(date);
        }

        query += ' ORDER BY id DESC LIMIT ?';
        params.push(limit);

        const rows = await all(query, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/activity-log', async (req, res) => {
    const { employeeName, activityType, description, timeSlot, action, editedBy, timestamp, dateKey } = req.body;
    try {
        await run(`
            INSERT INTO activity_log (employeeName, activityType, description, timeSlot, action, editedBy, timestamp, dateKey, createdAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [employeeName, activityType, description, timeSlot, action, editedBy || 'System', timestamp || new Date().toISOString(), dateKey, new Date().toISOString()]);
        res.json({ status: 'logged' });
    } catch (err) {
        console.error('Activity log error:', err);
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/activity-log', async (req, res) => {
    try {
        const result = await run('DELETE FROM activity_log');
        res.json({ message: 'Activity log cleared', changes: result.changes });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Leave & Permissions
app.post('/api/leave', async (req, res) => {
    const { userId, startDate, endDate, reason } = req.body;
    try {
        await run(
            'INSERT INTO leave_requests (userId, startDate, endDate, reason, createdAt) VALUES (?, ?, ?, ?, ?)',
            [userId, startDate, endDate, reason, new Date().toISOString()]
        );
        res.json({ message: 'Leave request submitted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/leave', async (req, res) => {
    const { userId } = req.query;
    try {
        let query = `
            SELECT l.*, u.name as userName 
            FROM leave_requests l 
            JOIN users u ON l.userId = u.id
        `;
        let params = [];
        if (userId) {
            query += ' WHERE l.userId = ?';
            params.push(userId);
        }
        const rows = await all(query, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/permission', async (req, res) => {
    const { userId, date, startTime, endTime, reason } = req.body;
    try {
        await run(
            'INSERT INTO permissions (userId, date, startTime, endTime, reason, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, date, startTime, endTime, reason, new Date().toISOString()]
        );
        res.json({ message: 'Permission request submitted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/permission', async (req, res) => {
    const { userId } = req.query;
    try {
        let query = `
            SELECT p.*, u.name as userName 
            FROM permissions p 
            JOIN users u ON p.userId = u.id
        `;
        let params = [];
        if (userId) {
            query += ' WHERE p.userId = ?';
            params.push(userId);
        }
        const rows = await all(query, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Activity Log
app.get('/api/activity-log', async (req, res) => {
    const limit = parseInt(req.query.limit) || 50;
    try {
        const rows = await all('SELECT * FROM activity_log ORDER BY id DESC LIMIT ?', [limit]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/activity-log', async (req, res) => {
    const { employeeName, activityType, description, timeSlot, action, editedBy } = req.body;
    const timestamp = new Date().toISOString();
    try {
        await run(`
            INSERT INTO activity_log (employeeName, activityType, description, timeSlot, action, editedBy, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [employeeName, activityType, description, timeSlot, action, editedBy || 'System', timestamp]);
        res.json({ status: 'logged' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Export
app.get('/api/export', async (req, res) => {
    const { dateKey } = req.query;
    if (!dateKey) return res.status(400).send('Missing dateKey');

    try {
        const users = await all('SELECT id, name FROM users WHERE role != "admin" ORDER BY name');
        const activities = await all('SELECT * FROM activities WHERE dateKey = ?', [dateKey]);

        const activityMap = {};
        activities.forEach(a => {
            if (!activityMap[a.userId]) activityMap[a.userId] = {};
            activityMap[a.userId][a.timeSlot] = a;
        });

        const timeSlots = [
            '9:00-10:00', '10:00-11:00', '11:00-11:10', '11:10-12:00',
            '12:00-01:00', '01:00-01:40', '01:40-03:00', '03:00-03:50',
            '03:50-04:00', '04:00-05:00', '05:00-06:00', '06:00-07:00', '07:00-08:00'
        ];

        const data = [];
        users.forEach(user => {
            const row = { 'Employee Name': user.name };
            timeSlots.forEach(slot => {
                const act = activityMap[user.id]?.[slot];
                let cellText = '';
                if (act) {
                    cellText = act.type;
                    if (act.description) cellText += ` (${act.description})`;
                    if (act.pagesDone) cellText += ` [Pages: ${act.pagesDone}]`;
                }
                row[slot] = cellText;
            });
            data.push(row);
        });

        const wb = xlsx.utils.book_new();
        const ws = xlsx.utils.json_to_sheet(data);
        xlsx.utils.book_append_sheet(wb, ws, 'Timesheet');

        const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
        res.setHeader('Content-Disposition', `attachment; filename="Timesheet_${dateKey}.xlsx"`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
