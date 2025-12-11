const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
const xlsx = require('xlsx');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '.')));

// Database Setup
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error('❌ CRITICAL ERROR: DATABASE_URL environment variable is missing.');
    console.error('📝 Create a .env file with: DATABASE_URL=postgresql://user:password@host:port/database');
    console.error('📖 See POSTGRESQL_SETUP.md for detailed instructions');
    process.exit(1);
}

const pool = new Pool({
    connectionString: connectionString,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

pool.connect().then(() => {
    console.log('✅ Connected to PostgreSQL database');
    initDb();
}).catch(err => {
    console.error('❌ Failed to connect to PostgreSQL:', err.message);
    process.exit(1);
});

async function query(text, params) {
    return await pool.query(text, params);
}

async function initDb() {
    try {
        // Users table
        await query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                username VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(50) DEFAULT 'employee',
                email VARCHAR(255),
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Activities table
        await query(`
            CREATE TABLE IF NOT EXISTS activities (
                id SERIAL PRIMARY KEY,
                dateKey VARCHAR(255) NOT NULL,
                userId INTEGER NOT NULL,
                timeSlot VARCHAR(255) NOT NULL,
                type VARCHAR(50) NOT NULL,
                description TEXT,
                pagesDone VARCHAR(50),
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_user FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
            );
        `);

        // Create index for faster queries
        await query(`
            CREATE INDEX IF NOT EXISTS idx_activities_date_user 
            ON activities(dateKey, userId);
        `);

        // Leave requests table
        await query(`
            CREATE TABLE IF NOT EXISTS leave_requests (
                id SERIAL PRIMARY KEY,
                userId INTEGER NOT NULL,
                dateKey VARCHAR(255) NOT NULL,
                startSlot VARCHAR(255),
                endSlot VARCHAR(255),
                isFullDay BOOLEAN DEFAULT FALSE,
                status VARCHAR(50) DEFAULT 'pending',
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_leave_user FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
            );
        `);

        // Permission requests table
        await query(`
            CREATE TABLE IF NOT EXISTS permission_requests (
                id SERIAL PRIMARY KEY,
                userId INTEGER NOT NULL,
                dateKey VARCHAR(255) NOT NULL,
                startSlot VARCHAR(255) NOT NULL,
                endSlot VARCHAR(255) NOT NULL,
                reason TEXT,
                status VARCHAR(50) DEFAULT 'pending',
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_permission_user FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
            );
        `);

        // Activity log table
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
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Create default admin user
        const adminUsername = 'admin@pristonix';
        const adminPassword = '!pristonixadmin@2025';
        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        await query(`
            INSERT INTO users (name, username, password, role, email)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (username) DO NOTHING
        `, ['Master Admin', adminUsername, hashedPassword, 'admin', 'admin@pristonix.com']);

        console.log('✅ Database schema synchronized');
        console.log('👤 Default admin: admin@pristonix / !pristonixadmin@2025');
    } catch (err) {
        console.error('❌ Error initializing database:', err);
    }
}

// Auth Routes
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await query('SELECT * FROM users WHERE username = $1', [username]);
        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        res.json({
            user: {
                id: user.id,
                name: user.name,
                username: user.username,
                role: user.role,
                email: user.email
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Users/Employees Routes
app.get('/api/users', async (req, res) => {
    try {
        const result = await query('SELECT id, name, username, role, email, createdAt FROM users ORDER BY name');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/users', async (req, res) => {
    const { name, username, password, role } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await query(`
            INSERT INTO users (name, username, password, role, createdAt)
            VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
            RETURNING id, name, username, role
        `, [name, username, hashedPassword, role || 'employee']);

        res.json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') {
            return res.status(400).json({ error: 'Username already exists' });
        }
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    const { name, username, password, role } = req.body;

    try {
        let updateQuery = `
            UPDATE users 
            SET name = $1, username = $2, role = $3
        `;
        let params = [name, username, role || 'employee'];

        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            updateQuery += `, password = $4 WHERE id = $5 RETURNING id, name, username, role`;
            params.push(hashedPassword, id);
        } else {
            updateQuery += ` WHERE id = $4 RETURNING id, name, username, role`;
            params.push(id);
        }

        const result = await query(updateQuery, params);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await query('DELETE FROM users WHERE id = $1', [id]);
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Activities Routes
app.get('/api/activities', async (req, res) => {
    const { dateKey, userId } = req.query;
    let text = 'SELECT * FROM activities WHERE 1=1';
    let params = [];
    let paramCount = 1;

    if (dateKey) {
        text += ` AND dateKey = $${paramCount}`;
        params.push(dateKey);
        paramCount++;
    }

    if (userId) {
        text += ` AND userId = $${paramCount}`;
        params.push(userId);
    }

    text += ' ORDER BY id';

    try {
        const result = await query(text, params);

        // Group activities by dateKey, userId, and timeSlot
        const activities = {};
        result.rows.forEach(row => {
            if (!activities[row.datekey]) activities[row.datekey] = {};
            if (!activities[row.datekey][row.userid]) activities[row.datekey][row.userid] = {};
            if (!activities[row.datekey][row.userid][row.timeslot]) {
                activities[row.datekey][row.userid][row.timeslot] = [];
            }
            activities[row.datekey][row.userid][row.timeslot].push({
                type: row.type,
                description: row.description,
                pagesDone: row.pagesdone,
                timestamp: row.timestamp
            });
        });

        res.json(activities);
    } catch (err) {
        console.error('Get activities error:', err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/activities', async (req, res) => {
    const { dateKey, userId, timeSlot, type, description, pagesDone, timestamp } = req.body;

    console.log('Saving activity to PostgreSQL:', { dateKey, userId, timeSlot, type });

    try {
        await query(`
            INSERT INTO activities (dateKey, userId, timeSlot, type, description, pagesDone, timestamp)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [dateKey, userId, timeSlot, type, description || '', pagesDone || '0', timestamp || new Date().toISOString()]);

        res.json({ status: 'saved' });
    } catch (err) {
        console.error('Save activity error:', err);
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/activities', async (req, res) => {
    const { dateKey, userId, timeSlot } = req.body;

    try {
        await query(`
            DELETE FROM activities 
            WHERE dateKey = $1 AND userId = $2 AND timeSlot = $3
        `, [dateKey, userId, timeSlot]);

        res.json({ message: 'Activity cleared' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Leave Requests
app.post('/api/leave', async (req, res) => {
    const { userId, dateKey, startSlot, endSlot, isFullDay } = req.body;

    try {
        const result = await query(`
            INSERT INTO leave_requests (userId, dateKey, startSlot, endSlot, isFullDay)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `, [userId, dateKey, startSlot, endSlot, isFullDay]);

        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Permission Requests
app.post('/api/permission', async (req, res) => {
    const { userId, dateKey, startSlot, endSlot, reason } = req.body;

    try {
        const result = await query(`
            INSERT INTO permission_requests (userId, dateKey, startSlot, endSlot, reason)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `, [userId, dateKey, startSlot, endSlot, reason]);

        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Export to Excel
app.get('/api/export', async (req, res) => {
    const { dateKey } = req.query;
    if (!dateKey) return res.status(400).send('Missing dateKey');

    try {
        const usersResult = await query('SELECT * FROM users WHERE role = $1 ORDER BY name', ['employee']);
        const activitiesResult = await query('SELECT * FROM activities WHERE dateKey = $1', [dateKey]);

        const users = usersResult.rows;
        const activities = activitiesResult.rows;

        // Build activity map
        const activityMap = {};
        activities.forEach(a => {
            if (!activityMap[a.userid]) activityMap[a.userid] = {};
            if (!activityMap[a.userid][a.timeslot]) activityMap[a.userid][a.timeslot] = [];
            activityMap[a.userid][a.timeslot].push(a);
        });

        const timeSlots = [
            '9:00-10:00', '10:00-11:00', '11:00-11:10', '11:10-12:00',
            '12:00-01:00', '01:00-01:40', '01:40-03:00', '03:00-03:50',
            '03:50-04:00', '04:00-05:00', '05:00-06:00', '06:00-07:00', '07:00-08:00'
        ];

        const data = [];
        const header = ['Employee Name', 'Proof Pages', 'Epub Pages', 'Calibr Pages', ...timeSlots];
        data.push(header);

        users.forEach(user => {
            const row = [user.name];
            let proofTotal = 0, epubTotal = 0, calibrTotal = 0;

            // Calculate totals
            timeSlots.forEach(slot => {
                const acts = activityMap[user.id]?.[slot] || [];
                acts.forEach(act => {
                    const pages = parseInt(act.pagesdone) || 0;
                    if (act.type === 'proof') proofTotal += pages;
                    if (act.type === 'epub') epubTotal += pages;
                    if (act.type === 'calibr') calibrTotal += pages;
                });
            });

            row.push(proofTotal || '', epubTotal || '', calibrTotal || '');

            // Add timeslot data
            timeSlots.forEach(slot => {
                const acts = activityMap[user.id]?.[slot] || [];
                if (acts.length > 0) {
                    const cellContent = acts.map(act => {
                        let text = act.type.toUpperCase();
                        if (act.description) text += `: ${act.description}`;
                        return text;
                    }).join(' | ');
                    row.push(cellContent);
                } else {
                    row.push('');
                }
            });

            data.push(row);
        });

        const wb = xlsx.utils.book_new();
        const ws = xlsx.utils.aoa_to_sheet(data);
        xlsx.utils.book_append_sheet(wb, ws, 'Timesheet');
        const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

        res.setHeader('Content-Disposition', `attachment; filename="Timesheet_${dateKey}.xlsx"`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);

    } catch (err) {
        console.error('Export error:', err);
        res.status(500).send(err.message);
    }
});

// Serve HTML files
app.get('/login.html', (req, res) => res.sendFile(path.join(__dirname, 'login.html')));
app.get('/history.html', (req, res) => res.sendFile(path.join(__dirname, 'history.html')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.listen(port, () => {
    console.log(`\n🚀 Server running on PostgreSQL!`);
    console.log(`📍 Port: ${port}`);
    console.log(`🌐 URL: http://localhost:${port}`);
    console.log(`\n📖 See POSTGRESQL_SETUP.md for database setup instructions\n`);
});
