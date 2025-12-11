require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'client/dist')));

// Handle React Routing (SPA) - Return index.html for all non-API routes


// Database Connection Setup
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

const dbName = process.env.DB_NAME || 'timesheet_db';

// Initialize Database and Pool
let pool;
let promisePool;

async function initializeDatabase() {
    try {
        // Create connection without database to check/create it
        const connection = await mysql.createConnection({
            host: dbConfig.host,
            user: dbConfig.user,
            password: dbConfig.password
        }).promise();

        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
        await connection.end();

        // Now create the pool with the database
        pool = mysql.createPool({ ...dbConfig, database: dbName });
        promisePool = pool.promise();

        console.log(`Connected to MySQL database: ${dbName}`);
        await initTables();
    } catch (err) {
        console.error('\n\x1b[31m%s\x1b[0m', '===========================================================');
        console.error('\x1b[31m%s\x1b[0m', 'FATAL ERROR: Could not connect to MySQL Database');
        console.error('\x1b[31m%s\x1b[0m', '===========================================================');
        console.error('\nError Details:', err.message);
        console.error('\nPlease ensure that:');
        console.error('1. MySQL Server is INSTALLED and RUNNING.');
        console.error('2. The credentials in .env are correct:');
        console.error(`   Host: ${dbConfig.host}`);
        console.error(`   User: ${dbConfig.user}`);
        console.error(`   Password: ${dbConfig.password ? '******' : '(empty)'}`);
        console.error('3. Port 3306 is available.');
        console.error('\nIf you do not have MySQL installed, please install it or use XAMPP/WAMP.');
        console.error('\x1b[31m%s\x1b[0m', '===========================================================\n');
        process.exit(1);
    }
}

// Initialize Tables
async function initTables() {
    try {
        const connection = await promisePool.getConnection();


        // Employees Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS employees (
                id VARCHAR(255) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255),
                createdAt DATETIME
            )
        `);

        // Activities Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS activities (
                id INT AUTO_INCREMENT PRIMARY KEY,
                dateKey VARCHAR(255) NOT NULL,
                employeeId VARCHAR(255) NOT NULL,
                timeSlot VARCHAR(255) NOT NULL,
                type VARCHAR(255) NOT NULL,
                description TEXT,
                totalPages VARCHAR(255),
                pagesDone VARCHAR(255),
                timestamp DATETIME,
                FOREIGN KEY (employeeId) REFERENCES employees(id) ON DELETE CASCADE,
                UNIQUE KEY unique_activity (dateKey, employeeId, timeSlot)
            )
        `);

        // Deleted Activities Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS deleted_activities (
                id INT AUTO_INCREMENT PRIMARY KEY,
                original_id INT,
                dateKey VARCHAR(255),
                employeeId VARCHAR(255),
                timeSlot VARCHAR(255),
                type VARCHAR(255),
                description TEXT,
                totalPages VARCHAR(255),
                pagesDone VARCHAR(255),
                timestamp DATETIME,
                deletedAt DATETIME
            )
        `);

        // Users Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(50) DEFAULT 'user',
                createdAt DATETIME
            )
        `);

        // Activity Log Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS activity_log (
                id INT AUTO_INCREMENT PRIMARY KEY,
                dateKey VARCHAR(255),
                employeeName VARCHAR(255) NOT NULL,
                activityType VARCHAR(255) NOT NULL,
                description TEXT,
                timeSlot VARCHAR(255) NOT NULL,
                action VARCHAR(50) NOT NULL,
                editedBy VARCHAR(255),
                timestamp DATETIME NOT NULL,
                createdAt DATETIME NOT NULL
            )
        `);

        connection.release();
        console.log('Database tables initialized.');
    } catch (err) {
        console.error('Error initializing database:', err);
    }
}

initializeDatabase();

// Routes

// Auth Routes
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

    try {
        const [result] = await promisePool.query(
            'INSERT INTO users (username, password, createdAt) VALUES (?, ?, ?)',
            [username, password, new Date()]
        );
        res.json({ user: { id: result.insertId, username, role: 'user' } });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Username already exists' });
        }
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const [rows] = await promisePool.query(
            'SELECT * FROM users WHERE username = ? AND password = ?',
            [username, password]
        );

        if (rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

        const user = rows[0];
        res.json({ user: { id: user.id, username: user.username, role: user.role } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all employees
app.get('/api/employees', async (req, res) => {
    try {
        const [rows] = await promisePool.query('SELECT * FROM employees ORDER BY name');
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
        const [existing] = await promisePool.query(
            'SELECT id FROM employees WHERE name = ? AND id != ?',
            [name, id || '']
        );

        if (existing.length > 0) {
            return res.status(400).json({ error: `Employee "${name}" already exists` });
        }

        // Insert or Update
        // MySQL doesn't have INSERT OR REPLACE exactly like SQLite, use ON DUPLICATE KEY UPDATE or REPLACE INTO
        // Since ID is primary key, REPLACE INTO works well if ID is provided
        await promisePool.query(
            'REPLACE INTO employees (id, name, email, createdAt) VALUES (?, ?, ?, ?)',
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
    const connection = await promisePool.getConnection();

    try {
        await connection.beginTransaction();

        // Backup activities
        await connection.query(`
            INSERT INTO deleted_activities (dateKey, employeeId, timeSlot, type, description, totalPages, pagesDone, timestamp, deletedAt)
            SELECT dateKey, employeeId, timeSlot, type, description, totalPages, pagesDone, timestamp, ? 
            FROM activities 
            WHERE employeeId = ?
        `, [new Date(), id]);

        // Delete activities (handled by CASCADE usually, but explicit is fine)
        await connection.query('DELETE FROM activities WHERE employeeId = ?', [id]);

        // Delete employee
        const [result] = await connection.query('DELETE FROM employees WHERE id = ?', [id]);

        await connection.commit();
        res.json({ message: 'Deleted', changes: result.affectedRows });
    } catch (err) {
        await connection.rollback();
        res.status(500).json({ error: err.message });
    } finally {
        connection.release();
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
        const [rows] = await promisePool.query(query, params);

        const activities = {};
        rows.forEach(row => {
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

// Save activity
app.post('/api/activities', async (req, res) => {
    const { dateKey, employeeId, timeSlot, type, description, totalPages, pagesDone, timestamp } = req.body;

    try {
        // Use ON DUPLICATE KEY UPDATE
        const query = `
            INSERT INTO activities (dateKey, employeeId, timeSlot, type, description, totalPages, pagesDone, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            type = VALUES(type),
            description = VALUES(description),
            totalPages = VALUES(totalPages),
            pagesDone = VALUES(pagesDone),
            timestamp = VALUES(timestamp)
        `;

        const [result] = await promisePool.query(query, [dateKey, employeeId, timeSlot, type, description, totalPages, pagesDone, timestamp]);
        res.json({ id: result.insertId || result.insertId === 0 ? result.insertId : 'updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete activity
app.delete('/api/activities', async (req, res) => {
    const { dateKey, employeeId, timeSlot } = req.body;
    const connection = await promisePool.getConnection();

    try {
        await connection.beginTransaction();

        // Copy to deleted_activities
        await connection.query(`
            INSERT INTO deleted_activities (dateKey, employeeId, timeSlot, type, description, totalPages, pagesDone, timestamp, deletedAt)
            SELECT dateKey, employeeId, timeSlot, type, description, totalPages, pagesDone, timestamp, ? 
            FROM activities 
            WHERE dateKey = ? AND employeeId = ? AND timeSlot = ?
        `, [new Date(), dateKey, employeeId, timeSlot]);

        // Delete
        const [result] = await connection.query(`
            DELETE FROM activities 
            WHERE dateKey = ? AND employeeId = ? AND timeSlot = ?
        `, [dateKey, employeeId, timeSlot]);

        await connection.commit();
        res.json({ message: 'Deleted', changes: result.affectedRows });
    } catch (err) {
        await connection.rollback();
        res.status(500).json({ error: err.message });
    } finally {
        connection.release();
    }
});

// Export to Excel
app.get('/api/export', async (req, res) => {
    const { dateKey } = req.query;
    if (!dateKey) return res.status(400).send('Missing dateKey');

    try {
        const [employees] = await promisePool.query('SELECT * FROM employees ORDER BY name');
        const [activities] = await promisePool.query('SELECT * FROM activities WHERE dateKey = ?', [dateKey]);

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
        const [rows] = await promisePool.query('SELECT * FROM activity_log ORDER BY id DESC LIMIT ?', [limit]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Save activity log
app.post('/api/activity-log', async (req, res) => {
    const { dateKey, employeeName, activityType, description, timeSlot, action, editedBy, timestamp } = req.body;
    const createdAt = new Date();

    try {
        const [result] = await promisePool.query(`
            INSERT INTO activity_log (dateKey, employeeName, activityType, description, timeSlot, action, editedBy, timestamp, createdAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [dateKey, employeeName, activityType, description, timeSlot, action, editedBy || 'System', timestamp, createdAt]);

        res.json({
            id: result.insertId,
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
        const [result] = await promisePool.query('DELETE FROM activity_log');
        res.json({ message: 'Activity log cleared', changes: result.affectedRows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Cleanup
app.post('/api/cleanup-employees', async (req, res) => {
    const connection = await promisePool.getConnection();
    try {
        await connection.beginTransaction();
        await connection.query('DELETE FROM activities');
        const [result] = await connection.query('DELETE FROM employees');
        await connection.commit();
        res.json({ message: 'All employees deleted', changes: result.affectedRows });
    } catch (err) {
        await connection.rollback();
        res.status(500).json({ error: err.message });
    } finally {
        connection.release();
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

    console.log(`\n🚀 Server is running on MySQL!`);
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
