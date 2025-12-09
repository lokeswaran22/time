require('dotenv').config();
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const XLSX = require('xlsx');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'client/dist')));

// Database Setup
const dbPath = path.resolve(__dirname, 'timesheet.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        initDb();
    }
});

// Promisify helper
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

async function initDb() {
    try {
        // Employees Table
        await run(`
            CREATE TABLE IF NOT EXISTS employees (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT,
                createdAt TEXT
            )
        `);

        // Activities Table
        await run(`
            CREATE TABLE IF NOT EXISTS activities (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                dateKey TEXT NOT NULL,
                employeeId TEXT NOT NULL,
                timeSlot TEXT NOT NULL,
                type TEXT NOT NULL,
                description TEXT,
                totalPages TEXT,
                pagesDone TEXT,
                timestamp TEXT,
                FOREIGN KEY (employeeId) REFERENCES employees(id) ON DELETE CASCADE,
                UNIQUE(dateKey, employeeId, timeSlot)
            )
        `);

        // Deleted Activities Table
        await run(`
            CREATE TABLE IF NOT EXISTS deleted_activities (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                original_id INTEGER,
                dateKey TEXT,
                employeeId TEXT,
                timeSlot TEXT,
                type TEXT,
                description TEXT,
                totalPages TEXT,
                pagesDone TEXT,
                timestamp TEXT,
                deletedAt TEXT
            )
        `);

        // Users Table
        await run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT DEFAULT 'user',
                createdAt TEXT
            )
        `);

        // Activity Log Table
        await run(`
            CREATE TABLE IF NOT EXISTS activity_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                dateKey TEXT,
                employeeName TEXT NOT NULL,
                activityType TEXT NOT NULL,
                description TEXT,
                timeSlot TEXT NOT NULL,
                action TEXT NOT NULL,
                editedBy TEXT,
                timestamp TEXT NOT NULL,
                createdAt TEXT NOT NULL
            )
        `);

        console.log('Database tables initialized.');
    } catch (err) {
        console.error('Error initializing database:', err);
    }
}

// Routes

// Auth Routes
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

    try {
        const result = await run(
            'INSERT INTO users (username, password, createdAt) VALUES (?, ?, ?)',
            [username, password, new Date().toISOString()]
        );
        res.json({ user: { id: result.lastID, username, role: 'user' } });
    } catch (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Username already exists' });
        }
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await get(
            'SELECT * FROM users WHERE username = ? AND password = ?',
            [username, password]
        );

        if (!user) return res.status(401).json({ error: 'Invalid credentials' });

        res.json({ user: { id: user.id, username: user.username, role: user.role } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all employees
app.get('/api/employees', async (req, res) => {
    try {
        const rows = await all('SELECT * FROM employees ORDER BY name');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add/Update employee
app.post('/api/employees', async (req, res) => {
    const { id, name, email, createdAt } = req.body;

    try {
        // Check duplicate name
        const existing = await get(
            'SELECT id FROM employees WHERE name = ? AND id != ?',
            [name, id || '']
        );

        if (existing) {
            return res.status(400).json({ error: `Employee "${name}" already exists` });
        }

        await run(
            'INSERT OR REPLACE INTO employees (id, name, email, createdAt) VALUES (?, ?, ?, ?)',
            [id, name, email || '', createdAt]
        );

        res.json({ id, name, email, createdAt });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete employee
app.delete('/api/employees/:id', async (req, res) => {
    const { id } = req.params;

    try {
        await run('BEGIN TRANSACTION');

        // Backup activities
        await run(`
            INSERT INTO deleted_activities (dateKey, employeeId, timeSlot, type, description, totalPages, pagesDone, timestamp, deletedAt)
            SELECT dateKey, employeeId, timeSlot, type, description, totalPages, pagesDone, timestamp, ? 
            FROM activities 
            WHERE employeeId = ?
        `, [new Date().toISOString(), id]);

        // Delete activities
        await run('DELETE FROM activities WHERE employeeId = ?', [id]);

        // Delete employee
        const result = await run('DELETE FROM employees WHERE id = ?', [id]);

        await run('COMMIT');
        res.json({ message: 'Deleted', changes: result.changes });
    } catch (err) {
        await run('ROLLBACK');
        res.status(500).json({ error: err.message });
    }
});

// Get activities
app.get('/api/activities', async (req, res) => {
    const { dateKey } = req.query;
    let query = 'SELECT * FROM activities';
    let params = [];

    if (dateKey) {
        query += ' WHERE dateKey = ?';
        params.push(dateKey);
    }

    try {
        const rows = await all(query, params);

        const activities = {};
        rows.forEach(row => {
            if (!activities[row.dateKey]) activities[row.dateKey] = {};
            if (!activities[row.dateKey][row.employeeId]) activities[row.dateKey][row.employeeId] = {};

            activities[row.dateKey][row.employeeId][row.timeSlot] = {
                type: row.type,
                description: row.description,
                totalPages: row.totalPages,
                pagesDone: row.pagesDone,
                timestamp: row.timestamp,
                startPage: row.startPage,
                endPage: row.endPage
            };
        });

        // Add default lunch for all employees if not set
        const employees = await all('SELECT id FROM employees');
        const lunchSlot = '01:00-01:40';

        if (dateKey) {
            if (!activities[dateKey]) activities[dateKey] = {};
            employees.forEach(emp => {
                if (!activities[dateKey][emp.id]) activities[dateKey][emp.id] = {};
                if (!activities[dateKey][emp.id][lunchSlot]) {
                    activities[dateKey][emp.id][lunchSlot] = {
                        type: 'lunch',
                        description: 'LUNCH',
                        timestamp: new Date().toISOString()
                    };
                }
            });
        }

        res.json(activities);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Save activity
app.post('/api/activities', async (req, res) => {
    const { dateKey, employeeId, timeSlot, type, description, totalPages, pagesDone, timestamp } = req.body;

    try {
        await run(`
            INSERT OR REPLACE INTO activities (dateKey, employeeId, timeSlot, type, description, totalPages, pagesDone, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [dateKey, employeeId, timeSlot, type, description, totalPages, pagesDone, timestamp]);

        res.json({ status: 'saved' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete activity
app.delete('/api/activities', async (req, res) => {
    const { dateKey, employeeId, timeSlot } = req.body;

    try {
        await run('BEGIN TRANSACTION');

        // Copy to deleted_activities
        await run(`
            INSERT INTO deleted_activities (dateKey, employeeId, timeSlot, type, description, totalPages, pagesDone, timestamp, deletedAt)
            SELECT dateKey, employeeId, timeSlot, type, description, totalPages, pagesDone, timestamp, ? 
            FROM activities 
            WHERE dateKey = ? AND employeeId = ? AND timeSlot = ?
        `, [new Date().toISOString(), dateKey, employeeId, timeSlot]);

        // Delete
        const result = await run(`
            DELETE FROM activities 
            WHERE dateKey = ? AND employeeId = ? AND timeSlot = ?
        `, [dateKey, employeeId, timeSlot]);

        await run('COMMIT');
        res.json({ message: 'Deleted', changes: result.changes });
    } catch (err) {
        await run('ROLLBACK');
        res.status(500).json({ error: err.message });
    }
});

// Export to Excel
app.get('/api/export', async (req, res) => {
    const { dateKey } = req.query;
    if (!dateKey) return res.status(400).send('Missing dateKey');

    try {
        const employees = await all('SELECT * FROM employees ORDER BY name');
        const activities = await all('SELECT * FROM activities WHERE dateKey = ?', [dateKey]);

        const activityMap = {};
        activities.forEach(a => {
            if (!activityMap[a.employeeId]) activityMap[a.employeeId] = {};
            activityMap[a.employeeId][a.timeSlot] = a;
        });

        const timeSlots = [
            '9:00-10:00', '10:00-11:00', '11:00-11:10', '11:10-12:00',
            '12:00-01:00', '01:00-01:40', '01:40-03:00', '03:00-03:50',
            '03:50-04:00', '04:00-05:00', '05:00-06:00', '06:00-07:00', '07:00-08:00'
        ];

        const data = [];
        const header = ['Employee Name', 'Total Pages', ...timeSlots];
        data.push(header);

        employees.forEach(emp => {
            const row = [emp.name];
            let totalPages = 0;
            timeSlots.forEach(slot => {
                const act = activityMap[emp.id]?.[slot];
                if (act && act.type === 'proof' && act.pagesDone) {
                    totalPages += parseInt(act.pagesDone) || 0;
                }
            });
            row.push(totalPages > 0 ? totalPages : '');

            timeSlots.forEach(slot => {
                const act = activityMap[emp.id]?.[slot];
                if (act) {
                    let cellContent = act.type.toUpperCase();
                    if (act.description && act.type !== 'break' && act.type !== 'lunch') {
                        cellContent += `: ${act.description}`;
                    }
                    if (act.type === 'proof' && act.pagesDone) {
                        cellContent += ` (${act.pagesDone} pages)`;
                    }
                    row.push(cellContent);
                } else {
                    row.push('');
                }
            });
            data.push(row);
        });

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(data);
        const colWidths = [
            { wch: 20 },
            { wch: 12 },
            ...timeSlots.map(() => ({ wch: 25 }))
        ];
        ws['!cols'] = colWidths;

        XLSX.utils.book_append_sheet(wb, ws, 'Timesheet');
        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

        res.setHeader('Content-Disposition', `attachment; filename="Timesheet_${dateKey}.xlsx"`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);

    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Get activity log
app.get('/api/activity-log', async (req, res) => {
    const limit = parseInt(req.query.limit) || 50;
    try {
        const rows = await all('SELECT * FROM activity_log ORDER BY id DESC LIMIT ?', [limit]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Save activity log
app.post('/api/activity-log', async (req, res) => {
    const { dateKey, employeeName, activityType, description, timeSlot, action, editedBy, timestamp } = req.body;
    const createdAt = new Date().toISOString();

    try {
        const result = await run(`
            INSERT INTO activity_log (dateKey, employeeName, activityType, description, timeSlot, action, editedBy, timestamp, createdAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [dateKey, employeeName, activityType, description, timeSlot, action, editedBy || 'System', timestamp, createdAt]);

        res.json({
            id: result.lastID,
            dateKey,
            employeeName,
            activityType,
            description,
            timeSlot,
            action,
            editedBy,
            timestamp,
            createdAt
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Clear activity log
app.delete('/api/activity-log', async (req, res) => {
    try {
        const result = await run('DELETE FROM activity_log');
        res.json({ message: 'Activity log cleared', changes: result.changes });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Cleanup
app.post('/api/cleanup-employees', async (req, res) => {
    try {
        await run('BEGIN TRANSACTION');
        await run('DELETE FROM activities');
        const result = await run('DELETE FROM employees');
        await run('COMMIT');
        res.json({ message: 'All employees deleted', changes: result.changes });
    } catch (err) {
        await run('ROLLBACK');
        res.status(500).json({ error: err.message });
    }
});

// Handle React Routing (SPA) - Catch all non-API routes and return index.html
app.get(/^(?!\/api).*$/, (req, res) => {
    res.sendFile(path.join(__dirname, 'client/dist/index.html'));
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
    const os = require('os');
    const networkInterfaces = os.networkInterfaces();

    console.log(`\n🚀 Server is running with React + SQLite!`);
    console.log(`\n📍 Local access:`);
    console.log(`   http://localhost:${PORT}`);

    console.log(`\n🌐 Network access:`);
    Object.keys(networkInterfaces).forEach(interfaceName => {
        networkInterfaces[interfaceName].forEach(iface => {
            if (iface.family === 'IPv4' && !iface.internal) {
                console.log(`   http://${iface.address}:${PORT}`);
            }
        });
    });

    console.log(`\n✅ Port ${PORT} is now forwarded and accessible from other devices on your network\n`);
});
