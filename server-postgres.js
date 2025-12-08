const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
const XLSX = require('xlsx');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3005;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Database Setup
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error('CRITICAL ERROR: DATABASE_URL environment variable is missing.');
    console.error('If running locally, set it in .env or terminal.');
    console.error('If running on Render, add it to Environment Variables.');
    // We don't exit to allow serving static files, but API will fail.
}

const pool = new Pool({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false } // Required for most cloud DBs like Render
});

pool.connect().then(() => {
    console.log('Connected to PostgreSQL database');
    initDb();
}).catch(err => {
    console.error('Failed to connect to DB:', err);
});

async function query(text, params) {
    return await pool.query(text, params);
}

async function initDb() {
    try {
        await query(`
            CREATE TABLE IF NOT EXISTS employees (
                id VARCHAR(255) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255),
                createdAt VARCHAR(255)
            );
        `);

        await query(`
            CREATE TABLE IF NOT EXISTS activities (
                id SERIAL PRIMARY KEY,
                dateKey VARCHAR(255) NOT NULL,
                employeeId VARCHAR(255) NOT NULL,
                timeSlot VARCHAR(255) NOT NULL,
                type VARCHAR(50) NOT NULL,
                description TEXT,
                totalPages VARCHAR(50),
                pagesDone VARCHAR(50),
                timestamp VARCHAR(255),
                CONSTRAINT fk_employee FOREIGN KEY(employeeId) REFERENCES employees(id) ON DELETE CASCADE,
                CONSTRAINT unique_activity UNIQUE(dateKey, employeeId, timeSlot)
            );
        `);

        await query(`
            CREATE TABLE IF NOT EXISTS deleted_activities (
                id SERIAL PRIMARY KEY,
                original_id INTEGER,
                dateKey VARCHAR(255),
                employeeId VARCHAR(255),
                timeSlot VARCHAR(255),
                type VARCHAR(255),
                description TEXT,
                totalPages VARCHAR(255),
                pagesDone VARCHAR(255),
                timestamp VARCHAR(255),
                deletedAt VARCHAR(255)
            );
        `);

        await query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(50) DEFAULT 'user',
                createdAt VARCHAR(255)
            );
        `);

        await query(`
            CREATE TABLE IF NOT EXISTS activity_log (
                id SERIAL PRIMARY KEY,
                dateKey VARCHAR(255),
                employeeName VARCHAR(255) NOT NULL,
                activityType VARCHAR(255) NOT NULL,
                description TEXT,
                timeSlot VARCHAR(255) NOT NULL,
                action VARCHAR(50) NOT NULL,
                editedBy VARCHAR(255),
                timestamp VARCHAR(255) NOT NULL,
                createdAt VARCHAR(255) NOT NULL
            );
        `);

        console.log('Database initialized.');
    } catch (err) {
        console.error('Error initializing database:', err);
    }
}

// Routes

// Auth
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

    try {
        const result = await query(
            'INSERT INTO users (username, password, createdAt) VALUES ($1, $2, $3) RETURNING id',
            [username, password, new Date().toISOString()]
        );
        res.json({ user: { id: result.rows[0].id, username, role: 'user' } });
    } catch (err) {
        if (err.code === '23505') { // Unique violation
            return res.status(400).json({ error: 'Username already exists' });
        }
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await query(
            'SELECT * FROM users WHERE username = $1 AND password = $2',
            [username, password]
        );
        let user = result.rows[0];

        if (!user) return res.status(401).json({ error: 'Invalid credentials' });

        const role = username.toLowerCase().includes('admin') ? 'admin' : 'employee';

        // Update role if needed
        if (user.role !== role) {
            await query('UPDATE users SET role = $1 WHERE id = $2', [role, user.id]);
            user.role = role;
        }

        let employeeId = null;
        if (role === 'employee') {
            const empRes = await query('SELECT id FROM employees WHERE name = $1', [username]);

            if (empRes.rows.length === 0) {
                const empId = username.toLowerCase().replace(/\s+/g, '-');
                await query(
                    'INSERT INTO employees (id, name, email, createdAt) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING',
                    [empId, username, '', new Date().toISOString()]
                );
                employeeId = empId;
            } else {
                employeeId = empRes.rows[0].id;
            }
        }

        res.json({
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                employeeId: employeeId
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Employees
app.get('/api/employees', async (req, res) => {
    try {
        const result = await query('SELECT * FROM employees ORDER BY name');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/employees', async (req, res) => {
    const { id, name, email, createdAt, username, password } = req.body;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Check duplicate name
        const existing = await client.query(
            'SELECT id FROM employees WHERE name = $1 AND id != $2',
            [name, id || '']
        );

        if (existing.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: `Employee "${name}" already exists` });
        }

        await client.query(`
            INSERT INTO employees (id, name, email, createdAt) 
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (id) DO UPDATE 
            SET name = EXCLUDED.name, email = EXCLUDED.email
        `, [id, name, email || '', createdAt]);

        if (username && password) {
            const role = username.toLowerCase().includes('admin') ? 'admin' : 'employee';
            const userCheck = await client.query('SELECT id FROM users WHERE username = $1', [username]);

            if (userCheck.rows.length > 0) {
                await client.query(
                    'UPDATE users SET password = $1, role = $2 WHERE username = $3',
                    [password, role, username]
                );
            } else {
                await client.query(
                    'INSERT INTO users (username, password, role, createdAt) VALUES ($1, $2, $3, $4)',
                    [username, password, role, new Date().toISOString()]
                );
            }
        }

        await client.query('COMMIT');
        res.json({ id, name, email, createdAt, username });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

app.delete('/api/employees/:id', async (req, res) => {
    const { id } = req.params;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Backup
        await client.query(`
            INSERT INTO deleted_activities (dateKey, employeeId, timeSlot, type, description, totalPages, pagesDone, timestamp, deletedAt)
            SELECT dateKey, employeeId, timeSlot, type, description, totalPages, pagesDone, timestamp, $1
            FROM activities 
            WHERE employeeId = $2
        `, [new Date().toISOString(), id]);

        await client.query('DELETE FROM activities WHERE employeeId = $1', [id]);
        const result = await client.query('DELETE FROM employees WHERE id = $1', [id]);

        await client.query('COMMIT');
        res.json({ message: 'Deleted', changes: result.rowCount });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// Activities
app.get('/api/activities', async (req, res) => {
    const { dateKey } = req.query;
    let text = 'SELECT * FROM activities';
    let params = [];

    if (dateKey) {
        text += ' WHERE dateKey = $1';
        params.push(dateKey);
    }

    try {
        const result = await query(text, params);

        const activities = {};
        result.rows.forEach(row => {
            if (!activities[row.dateKey]) activities[row.dateKey] = {};
            if (!activities[row.dateKey][row.employeeId]) activities[row.dateKey][row.employeeId] = {};
            activities[row.dateKey][row.employeeId][row.timeSlot] = {
                type: row.type,
                description: row.description,
                totalPages: row.totalPages,
                pagesDone: row.pagesDone,
                timestamp: row.timestamp
            };
        });

        res.json(activities);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/activities', async (req, res) => {
    const { dateKey, employeeId, timeSlot, type, description, totalPages, pagesDone, timestamp } = req.body;

    try {
        await query(`
            INSERT INTO activities (dateKey, employeeId, timeSlot, type, description, totalPages, pagesDone, timestamp)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (dateKey, employeeId, timeSlot) 
            DO UPDATE SET 
                type = EXCLUDED.type, 
                description = EXCLUDED.description,
                totalPages = EXCLUDED.totalPages,
                pagesDone = EXCLUDED.pagesDone,
                timestamp = EXCLUDED.timestamp
        `, [dateKey, employeeId, timeSlot, type, description, totalPages, pagesDone, timestamp]);

        res.json({ status: 'saved' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/activities', async (req, res) => {
    const { dateKey, employeeId, timeSlot } = req.body;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        await client.query(`
            INSERT INTO deleted_activities (dateKey, employeeId, timeSlot, type, description, totalPages, pagesDone, timestamp, deletedAt)
            SELECT dateKey, employeeId, timeSlot, type, description, totalPages, pagesDone, timestamp, $1
            FROM activities 
            WHERE dateKey = $2 AND employeeId = $3 AND timeSlot = $4
        `, [new Date().toISOString(), dateKey, employeeId, timeSlot]);

        const result = await client.query(`
            DELETE FROM activities 
            WHERE dateKey = $1 AND employeeId = $2 AND timeSlot = $3
        `, [dateKey, employeeId, timeSlot]);

        await client.query('COMMIT');
        res.json({ message: 'Deleted', changes: result.rowCount });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// Activity Log
app.get('/api/activity-log', async (req, res) => {
    const limit = parseInt(req.query.limit) || 50;
    try {
        const result = await query('SELECT * FROM activity_log ORDER BY id DESC LIMIT $1', [limit]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/activity-log', async (req, res) => {
    const { dateKey, employeeName, activityType, description, timeSlot, action, editedBy, timestamp } = req.body;
    const createdAt = new Date().toISOString();

    try {
        const result = await query(`
            INSERT INTO activity_log (dateKey, employeeName, activityType, description, timeSlot, action, editedBy, timestamp, createdAt)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id
        `, [dateKey, employeeName, activityType, description, timeSlot, action, editedBy || 'System', timestamp, createdAt]);

        res.json({ id: result.rows[0].id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/activity-log', async (req, res) => {
    try {
        const result = await query('DELETE FROM activity_log');
        res.json({ message: 'Activity log cleared', changes: result.rowCount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Export (Simplified for brevity, similar structure)
app.get('/api/export', async (req, res) => {
    const { dateKey } = req.query;
    if (!dateKey) return res.status(400).send('Missing dateKey');

    try {
        const empRes = await query('SELECT * FROM employees ORDER BY name');
        const actRes = await query('SELECT * FROM activities WHERE dateKey = $1', [dateKey]);

        const employees = empRes.rows;
        const activities = actRes.rows;

        // Same logic as sqlite...
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
                    if (act.description && act.type !== 'break' && act.type !== 'lunch') cellContent += `: ${act.description}`;
                    if (act.type === 'proof' && act.pagesDone) cellContent += ` (${act.pagesDone} pages)`;
                    row.push(cellContent);
                } else {
                    row.push('');
                }
            });
            data.push(row);
        });

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, 'Timesheet');
        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

        res.setHeader('Content-Disposition', `attachment; filename="Timesheet_${dateKey}.xlsx"`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);

    } catch (err) {
        res.status(500).send(err.message);
    }
});

// App Entry
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'login.html')));
app.use((req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 Server is running on PostgreSQL!`);
    console.log(`\n📍 Listening on Port ${PORT}`);
});
