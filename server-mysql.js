const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const path = require('path');
const XLSX = require('xlsx');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// MySQL Connection Pool
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',           // Change this to your MySQL username
    password: '',           // Change this to your MySQL password
    database: 'timesheet_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Database Setup
async function initDb() {
    try {
        const connection = await pool.getConnection();
        console.log('Connected to MySQL database.');

        // Employees Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS employees (
                id VARCHAR(255) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                createdAt DATETIME
            )
        `);

        // Activities Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS activities (
                id INT AUTO_INCREMENT PRIMARY KEY,
                dateKey VARCHAR(50) NOT NULL,
                employeeId VARCHAR(255) NOT NULL,
                timeSlot VARCHAR(50) NOT NULL,
                type VARCHAR(50) NOT NULL,
                description TEXT,
                totalPages VARCHAR(50),
                pagesDone VARCHAR(50),
                timestamp DATETIME,
                FOREIGN KEY (employeeId) REFERENCES employees(id) ON DELETE CASCADE,
                UNIQUE KEY unique_activity (dateKey, employeeId, timeSlot)
            )
        `);

        // Deleted Activities Table (Recycle Bin)
        await connection.query(`
            CREATE TABLE IF NOT EXISTS deleted_activities (
                id INT AUTO_INCREMENT PRIMARY KEY,
                original_id INT,
                dateKey VARCHAR(50),
                employeeId VARCHAR(255),
                timeSlot VARCHAR(50),
                type VARCHAR(50),
                description TEXT,
                totalPages VARCHAR(50),
                pagesDone VARCHAR(50),
                timestamp DATETIME,
                deletedAt DATETIME
            )
        `);

        // Activity Log Table (Permanent tracker history)
        await connection.query(`
            CREATE TABLE IF NOT EXISTS activity_log (
                id INT AUTO_INCREMENT PRIMARY KEY,
                employeeName VARCHAR(255) NOT NULL,
                activityType VARCHAR(50) NOT NULL,
                description TEXT,
                timeSlot VARCHAR(50) NOT NULL,
                action VARCHAR(50) NOT NULL,
                timestamp DATETIME NOT NULL,
                createdAt DATETIME NOT NULL
            )
        `);

        connection.release();
        console.log('Database tables initialized.');
    } catch (err) {
        console.error('Error initializing database:', err.message);
    }
}

// Initialize database on startup
initDb();

// Routes

// Get all employees
app.get('/api/employees', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM employees ORDER BY name');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add/Update employee
app.post('/api/employees', async (req, res) => {
    const { id, name, createdAt } = req.body;

    try {
        // Check if an employee with this name already exists
        const [existing] = await pool.query(
            'SELECT id FROM employees WHERE name = ? AND id != ?',
            [name, id || '']
        );

        if (existing.length > 0) {
            return res.status(400).json({ error: `Employee "${name}" already exists` });
        }

        // Insert or update employee
        await pool.query(
            `INSERT INTO employees (id, name, createdAt) VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE name = ?, createdAt = ?`,
            [id, name, createdAt, name, createdAt]
        );

        res.json({ id, name, createdAt });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete employee
app.delete('/api/employees/:id', async (req, res) => {
    const { id } = req.params;
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // Backup activities before deleting
        await connection.query(
            `INSERT INTO deleted_activities (dateKey, employeeId, timeSlot, type, description, totalPages, pagesDone, timestamp, deletedAt)
             SELECT dateKey, employeeId, timeSlot, type, description, totalPages, pagesDone, timestamp, ?
             FROM activities
             WHERE employeeId = ?`,
            [new Date(), id]
        );

        // Delete activities
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

// Get activities for a specific date (or all if needed)
app.get('/api/activities', async (req, res) => {
    const { dateKey } = req.query;
    let query = 'SELECT * FROM activities';
    let params = [];

    if (dateKey) {
        query += ' WHERE dateKey = ?';
        params.push(dateKey);
    }

    try {
        const [rows] = await pool.query(query, params);

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
        const [result] = await pool.query(
            `INSERT INTO activities (dateKey, employeeId, timeSlot, type, description, totalPages, pagesDone, timestamp)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
             type = ?, description = ?, totalPages = ?, pagesDone = ?, timestamp = ?`,
            [dateKey, employeeId, timeSlot, type, description, totalPages, pagesDone, timestamp,
                type, description, totalPages, pagesDone, timestamp]
        );

        res.json({ id: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete activity (with Recycle Bin)
app.delete('/api/activities', async (req, res) => {
    const { dateKey, employeeId, timeSlot } = req.body;
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // Copy to deleted_activities
        await connection.query(
            `INSERT INTO deleted_activities (dateKey, employeeId, timeSlot, type, description, totalPages, pagesDone, timestamp, deletedAt)
             SELECT dateKey, employeeId, timeSlot, type, description, totalPages, pagesDone, timestamp, ?
             FROM activities
             WHERE dateKey = ? AND employeeId = ? AND timeSlot = ?`,
            [new Date(), dateKey, employeeId, timeSlot]
        );

        // Delete from activities
        const [result] = await connection.query(
            'DELETE FROM activities WHERE dateKey = ? AND employeeId = ? AND timeSlot = ?',
            [dateKey, employeeId, timeSlot]
        );

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
        const [employees] = await pool.query('SELECT * FROM employees ORDER BY name');
        const [activities] = await pool.query('SELECT * FROM activities WHERE dateKey = ?', [dateKey]);

        // Map activities for easy lookup
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

        // Prepare data for XLSX
        const data = [];
        const header = ['Employee Name', 'Total Pages', ...timeSlots];
        data.push(header);

        employees.forEach(emp => {
            const row = [emp.name];

            // Calculate total pages
            let totalPages = 0;
            timeSlots.forEach(slot => {
                const act = activityMap[emp.id]?.[slot];
                if (act && act.type === 'proof' && act.pagesDone) {
                    totalPages += parseInt(act.pagesDone) || 0;
                }
            });
            row.push(totalPages > 0 ? totalPages : '');

            // Add time slot activities
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

        // Set column widths
        const colWidths = [
            { wch: 20 }, // Employee Name
            { wch: 12 }, // Total Pages
            ...timeSlots.map(() => ({ wch: 25 })) // Time slots
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

// Get activity log (recent changes)
app.get('/api/activity-log', async (req, res) => {
    const limit = req.query.limit || 50;

    try {
        const [rows] = await pool.query(
            'SELECT * FROM activity_log ORDER BY id DESC LIMIT ?',
            [parseInt(limit)]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Save activity log entry
app.post('/api/activity-log', async (req, res) => {
    const { employeeName, activityType, description, timeSlot, action, timestamp } = req.body;
    const createdAt = new Date();

    try {
        const [result] = await pool.query(
            `INSERT INTO activity_log (employeeName, activityType, description, timeSlot, action, timestamp, createdAt)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [employeeName, activityType, description, timeSlot, action, timestamp, createdAt]
        );

        res.json({
            id: result.insertId,
            employeeName,
            activityType,
            description,
            timeSlot,
            action,
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
        const [result] = await pool.query('DELETE FROM activity_log');
        res.json({ message: 'Activity log cleared', changes: result.affectedRows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Database cleanup endpoint - Remove all employees
app.post('/api/cleanup-employees', async (req, res) => {
    const connection = await pool.getConnection();

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

// Start Server
app.listen(PORT, '0.0.0.0', () => {
    const os = require('os');
    const networkInterfaces = os.networkInterfaces();

    console.log(`\n🚀 Server is running with MySQL!`);
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
