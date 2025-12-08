require('dotenv').config();
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const XLSX = require('xlsx');
const jwt = require('jsonwebtoken');
const { authenticateToken, requireAdmin, canEditEmployee, generateToken } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from client/dist
app.use(express.static(path.join(__dirname, 'client', 'dist')));

// SQLite Database
const DB_PATH = path.join(__dirname, 'timesheet.db');
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('✅ Connected to SQLite database');
        initializeDatabase();
    }
});

// Initialize database tables
function initializeDatabase() {
    db.serialize(() => {
        // Employees table
        db.run(`
            CREATE TABLE IF NOT EXISTS employees (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                createdAt DATETIME,
                user_id INTEGER REFERENCES users(id)
            )
        `);

        // Activities table
        db.run(`
            CREATE TABLE IF NOT EXISTS activities (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                dateKey TEXT NOT NULL,
                employeeId TEXT NOT NULL,
                timeSlot TEXT NOT NULL,
                type TEXT NOT NULL,
                description TEXT,
                totalPages TEXT,
                pagesDone TEXT,
                timestamp DATETIME,
                created_by_user_id INTEGER REFERENCES users(id),
                updated_by_user_id INTEGER REFERENCES users(id),
                created_at_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at_timestamp DATETIME,
                FOREIGN KEY (employeeId) REFERENCES employees(id) ON DELETE CASCADE,
                UNIQUE(dateKey, employeeId, timeSlot)
            )
        `);

        // Deleted activities (Recycle Bin)
        db.run(`
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
                timestamp DATETIME,
                deletedAt DATETIME
            )
        `);

        // Activity log
        db.run(`
            CREATE TABLE IF NOT EXISTS activity_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                employeeName TEXT NOT NULL,
                activityType TEXT NOT NULL,
                description TEXT,
                timeSlot TEXT NOT NULL,
                action TEXT NOT NULL,
                timestamp DATETIME NOT NULL,
                createdAt  DATETIME NOT NULL
            )
        `);

        // Users table (Microsoft Teams)
        db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                azure_id TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                display_name TEXT NOT NULL,
                teams_name TEXT NOT NULL,
                role TEXT DEFAULT 'employee' CHECK(role IN ('employee', 'admin')),
                department TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_login DATETIME,
                is_active INTEGER DEFAULT 1
            )
        `);

        // Admin actions table
        db.run(`
            CREATE TABLE IF NOT EXISTS admin_actions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                admin_user_id INTEGER NOT NULL,
                action_type TEXT NOT NULL CHECK(action_type IN ('add', 'edit', 'delete', 'remind')),
                target_employee_id TEXT,
                target_date TEXT,
                target_timeslot TEXT,
                old_value TEXT,
                new_value TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (admin_user_id) REFERENCES users(id)
            )
        `);

        // Reminders table
        db.run(`
            CREATE TABLE IF NOT EXISTS reminders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                admin_user_id INTEGER NOT NULL,
                employee_id TEXT NOT NULL,
                date TEXT NOT NULL,
                message TEXT,
                status TEXT DEFAULT 'sent' CHECK(status IN ('sent', 'pending', 'read')),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (admin_user_id) REFERENCES users(id),
                FOREIGN KEY (employee_id) REFERENCES employees(id)
            )
        `);

        console.log('✅ Database tables initialized');
    });
}

// ============ AUTHENTICATION ROUTES ============

// Mock Microsoft Teams login (for development/testing)
// In production, this would integrate with Azure AD OAuth flow
app.post('/api/auth/login', (req, res) => {
    const { email, password, azureId, displayName } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    // For demo: Check if user exists or create new user
    db.get('SELECT * FROM users WHERE email = ? OR azure_id = ?', [email, azureId || email], (err, user) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (user) {
            // Update last login
            db.run('UPDATE users SET last_login = ? WHERE id = ?', [new Date().toISOString(), user.id]);

            // Generate JWT token
            const token = generateToken(user);

            res.json({
                success: true,
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    displayName: user.display_name,
                    teamsName: user.teams_name,
                    role: user.role,
                    department: user.department
                }
            });
        } else {
            // Create new user
            const newUser = {
                azure_id: azureId || `demo-${Date.now()}`,
                email: email,
                display_name: displayName || email.split('@')[0],
                teams_name: displayName || email.split('@')[0],
                role: email.includes('admin') ? 'admin' : 'employee',
                department: 'General'
            };

            db.run(`
                INSERT INTO users (azure_id, email, display_name, teams_name, role, department, last_login)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [
                newUser.azure_id,
                newUser.email,
                newUser.display_name,
                newUser.teams_name,
                newUser.role,
                newUser.department,
                new Date().toISOString()
            ], function (err) {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }

                newUser.id = this.lastID;

                // Also create employee record
                const employeeId = newUser.teams_name.toLowerCase().replace(/\s+/g, '-');
                db.run(`
                    INSERT OR IGNORE INTO employees (id, name, createdAt, user_id)
                    VALUES (?, ?, ?, ?)
                `, [employeeId, newUser.teams_name, new Date().toISOString(), newUser.id]);

                const token = generateToken({ ...newUser, employee_id: employeeId });

                res.json({
                    success: true,
                    token,
                    user: {
                        id: newUser.id,
                        email: newUser.email,
                        displayName: newUser.display_name,
                        teamsName: newUser.teams_name,
                        role: newUser.role,
                        department: newUser.department
                    },
                    message: 'New user created successfully'
                });
            });
        }
    });
});

// Verify token endpoint
app.get('/api/auth/verify', authenticateToken, (req, res) => {
    res.json({
        valid: true,
        user: req.user
    });
});

// Get current user profile
app.get('/api/auth/profile', authenticateToken, (req, res) => {
    db.get('SELECT * FROM users WHERE id = ?', [req.user.id], (err, user) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            id: user.id,
            email: user.email,
            displayName: user.display_name,
            teamsName: user.teams_name,
            role: user.role,
            department: user.department,
            createdAt: user.created_at,
            lastLogin: user.last_login
        });
    });
});

// Logout (client-side will remove token)
app.post('/api/auth/logout', authenticateToken, (req, res) => {
    res.json({ success: true, message: 'Logged out successfully' });
});

// ============ EMPLOYEE ROUTES ============

// Get all employees
app.get('/api/employees', (req, res) => {
    db.all(`
        SELECT e.*, u.email, u.role, u.display_name
        FROM employees e
        LEFT JOIN users u ON e.user_id = u.id
        ORDER BY e.name
    `, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Get current user's employee data
app.get('/api/employees/me', authenticateToken, (req, res) => {
    db.get(`
        SELECT e.*, u.email, u.role, u.display_name
        FROM employees e
        JOIN users u ON e.user_id = u.id
        WHERE u.id = ?
    `, [req.user.id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (!row) {
            return res.status(404).json({ error: 'Employee record not found' });
        }

        res.json(row);
    });
});

// Add/Update employee (admin only)
app.post('/api/employees', authenticateToken, requireAdmin, (req, res) => {
    const { id, name, createdAt, userId } = req.body;

    db.run(`
        INSERT INTO employees (id, name, createdAt, user_id)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        createdAt = excluded.createdAt,
        user_id = excluded.user_id
    `, [id, name, createdAt, userId], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        // Log admin action
        db.run(`
            INSERT INTO admin_actions (admin_user_id, action_type, target_employee_id, new_value)
            VALUES (?, 'add', ?, ?)
        `, [req.user.id, id, JSON.stringify({ name, userId })]);

        res.json({ id, name, createdAt, userId });
    });
});

// Delete employee (admin only)
app.delete('/api/employees/:id', authenticateToken, requireAdmin, (req, res) => {
    const { id } = req.params;

    db.serialize(() => {
        // Backup activities
        db.run(`
            INSERT INTO deleted_activities (dateKey, employeeId, timeSlot, type, description, totalPages, pagesDone, timestamp, deletedAt)
            SELECT dateKey, employeeId, timeSlot, type, description, totalPages, pagesDone, timestamp, ?
            FROM activities
            WHERE employeeId = ?
        `, [new Date().toISOString(), id]);

        // Delete activities
        db.run('DELETE FROM activities WHERE employeeId = ?', [id]);

        // Delete employee
        db.run('DELETE FROM employees WHERE id = ?', [id], function (err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            // Log admin action
            db.run(`
                INSERT INTO admin_actions (admin_user_id, action_type, target_employee_id)
                VALUES (?, 'delete', ?)
            `, [req.user.id, id]);

            res.json({ message: 'Deleted', changes: this.changes });
        });
    });
});

// ============ ACTIVITY ROUTES ============

// Get activities
app.get('/api/activities', (req, res) => {
    const { dateKey } = req.query;
    let query = `
        SELECT a.*, 
               creator.display_name as created_by_name,
               updater.display_name as updated_by_name
        FROM activities a
        LEFT JOIN users creator ON a.created_by_user_id = creator.id
        LEFT JOIN users updater ON a.updated_by_user_id = updater.id
    `;
    let params = [];

    if (dateKey) {
        query += ' WHERE a.dateKey = ?';
        params.push(dateKey);
    }

    db.all(query, params, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

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
                createdBy: row.created_by_name,
                updatedBy: row.updated_by_name,
                createdAt: row.created_at_timestamp,
                updatedAt: row.updated_at_timestamp
            };
        });

        res.json(activities);
    });
});

// Save activity (with authorization check)
app.post('/api/activities', authenticateToken, (req, res) => {
    const { dateKey, employeeId, timeSlot, type, description, totalPages, pagesDone, timestamp } = req.body;

    // Check if user can edit this employee's timesheet
    if (req.user.role !== 'admin' && req.user.employeeId !== employeeId) {
        return res.status(403).json({ error: 'You can only edit your own timesheet' });
    }

    const now = new Date().toISOString();

    // Check if activity exists
    db.get('SELECT id FROM activities WHERE dateKey = ? AND employeeId = ? AND timeSlot = ?',
        [dateKey, employeeId, timeSlot], (err, existing) => {

            if (existing) {
                // Update existing activity
                db.run(`
                UPDATE activities
                SET type = ?, description = ?, totalPages = ?, pagesDone = ?, timestamp = ?,
                    updated_by_user_id = ?, updated_at_timestamp = ?
                WHERE dateKey = ? AND employeeId = ? AND timeSlot = ?
            `, [type, description, totalPages, pagesDone, timestamp, req.user.id, now, dateKey, employeeId, timeSlot], function (err) {
                    if (err) {
                        return res.status(500).json({ error: err.message });
                    }

                    // Log in activity log
                    db.run(`
                    INSERT INTO activity_log (employeeName, activityType, description, timeSlot, action, timestamp, createdAt)
                    VALUES (?, ?, ?, ?, 'updated', ?, ?)
                `, [req.user.teamsName, type, description, timeSlot, timestamp, now]);

                    res.json({ id: existing.id, message: 'Updated' });
                });
            } else {
                // Insert new activity
                db.run(`
                INSERT INTO activities (dateKey, employeeId, timeSlot, type, description, totalPages, pagesDone, timestamp, created_by_user_id, created_at_timestamp)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [dateKey, employeeId, timeSlot, type, description, totalPages, pagesDone, timestamp, req.user.id, now], function (err) {
                    if (err) {
                        return res.status(500).json({ error: err.message });
                    }

                    // Log in activity log
                    db.run(`
                    INSERT INTO activity_log (employeeName, activityType, description, timeSlot, action, timestamp, createdAt)
                    VALUES (?, ?, ?, ?, 'added', ?, ?)
                `, [req.user.teamsName, type, description, timeSlot, timestamp, now]);

                    res.json({ id: this.lastID, message: 'Created' });
                });
            }
        });
});

// Delete activity (with authorization check)
app.delete('/api/activities', authenticateToken, (req, res) => {
    const { dateKey, employeeId, timeSlot } = req.body;

    // Check if user can delete this activity
    if (req.user.role !== 'admin' && req.user.employeeId !== employeeId) {
        return res.status(403).json({ error: 'You can only delete your own activities' });
    }

    db.serialize(() => {
        // Backup to recycle bin
        db.run(`
            INSERT INTO deleted_activities (dateKey, employeeId, timeSlot, type, description, totalPages, pagesDone, timestamp, deletedAt)
            SELECT dateKey, employeeId, timeSlot, type, description, totalPages, pagesDone, timestamp, ?
            FROM activities
            WHERE dateKey = ? AND employeeId = ? AND timeSlot = ?
        `, [new Date().toISOString(), dateKey, employeeId, timeSlot]);

        // Delete activity
        db.run('DELETE FROM activities WHERE dateKey = ? AND employeeId = ? AND timeSlot = ?',
            [dateKey, employeeId, timeSlot], function (err) {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }

                // Log admin action if admin
                if (req.user.role === 'admin') {
                    db.run(`
                    INSERT INTO admin_actions (admin_user_id, action_type, target_employee_id, target_date, target_timeslot)
                    VALUES (?, 'delete', ?, ?, ?)
                `, [req.user.id, employeeId, dateKey, timeSlot]);
                }

                res.json({ message: 'Deleted', changes: this.changes });
            });
    });
});

// ============ ADMIN ROUTES ============

// Get all timesheets (admin only)
app.get('/api/admin/timesheets', authenticateToken, requireAdmin, (req, res) => {
    const { dateKey, employeeId } = req.query;

    let query = `
        SELECT a.*, 
               e.name as employee_name,
               creator.display_name as created_by_name,
               updater.display_name as updated_by_name
        FROM activities a
        JOIN employees e ON a.employeeId = e.id
        LEFT JOIN users creator ON a.created_by_user_id = creator.id
        LEFT JOIN users updater ON a.updated_by_user_id = updater.id
        WHERE 1=1
    `;
    const params = [];

    if (dateKey) {
        query += ' AND a.dateKey = ?';
        params.push(dateKey);
    }

    if (employeeId) {
        query += ' AND a.employeeId = ?';
        params.push(employeeId);
    }

    query += ' ORDER BY a.dateKey DESC, e.name, a.timeSlot';

    db.all(query, params, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Send reminder (admin only)
app.post('/api/admin/remind/:employeeId', authenticateToken, requireAdmin, (req, res) => {
    const { employeeId } = req.params;
    const { date, message } = req.body;

    db.run(`
        INSERT INTO reminders (admin_user_id, employee_id, date, message)
        VALUES (?, ?, ?, ?)
    `, [req.user.id, employeeId, date, message || 'Please fill your timesheet'], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        // Log admin action
        db.run(`
            INSERT INTO admin_actions (admin_user_id, action_type, target_employee_id, target_date, new_value)
            VALUES (?, 'remind', ?, ?, ?)
        `, [req.user.id, employeeId, date, message]);

        res.json({
            id: this.lastID,
            success: true,
            message: 'Reminder sent successfully'
        });
    });
});

// Get admin actions audit log
app.get('/api/admin/audit-log', authenticateToken, requireAdmin, (req, res) => {
    const limit = req.query.limit || 100;

    db.all(`
        SELECT a.*, u.display_name as admin_name, u.email as admin_email
        FROM admin_actions a
        JOIN users u ON a.admin_user_id = u.id
        ORDER BY a.timestamp DESC
        LIMIT ?
    `, [limit], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// ============ EXISTING ROUTES (preserved for compatibility) ============

// Activity log
app.get('/api/activity-log', (req, res) => {
    const limit = req.query.limit || 50;

    db.all('SELECT * FROM activity_log ORDER BY id DESC LIMIT ?', [limit], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

app.post('/api/activity-log', (req, res) => {
    const { employeeName, activityType, description, timeSlot, action, timestamp } = req.body;
    const createdAt = new Date().toISOString();

    db.run(`
        INSERT INTO activity_log (employeeName, activityType, description, timeSlot, action, timestamp, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [employeeName, activityType, description, timeSlot, action, timestamp, createdAt], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        res.json({
            id: this.lastID,
            employeeName,
            activityType,
            description,
            timeSlot,
            action,
            timestamp,
            createdAt
        });
    });
});

app.delete('/api/activity-log', (req, res) => {
    db.run('DELETE FROM activity_log', function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Activity log cleared', changes: this.changes });
    });
});

// Export to Excel
app.get('/api/export', (req, res) => {
    const { dateKey, employeeId } = req.query;

    if (!dateKey) {
        return res.status(400).send('Missing dateKey');
    }

    let employeeQuery = 'SELECT * FROM employees ORDER BY name';
    let activityQuery = 'SELECT * FROM activities WHERE dateKey = ?';
    const activityParams = [dateKey];

    if (employeeId) {
        activityQuery += ' AND employeeId = ?';
        activityParams.push(employeeId);
    }

    db.all(employeeQuery, (err, employees) => {
        if (err) {
            return res.status(500).send(err.message);
        }

        db.all(activityQuery, activityParams, (err, activities) => {
            if (err) {
                return res.status(500).send(err.message);
            }

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
                    if (act && act.type === 'work' && act.pagesDone) {
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
                        if (act.pagesDone) {
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
        });
    });
});

// Serve React app for all other routes (Express 5.x compatible)
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'dist', 'index.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 Server running with Microsoft Teams Authentication!`);
    console.log(`📍 Local: http://localhost:${PORT}`);
    console.log(`\n✅ Features enabled:`);
    console.log(`   - Microsoft Teams Login`);
    console.log(`   - Role-based Authorization`);
    console.log(`   - Admin Panel with Audit Trail`);
    console.log(`   - Real-time Activity Tracking`);
    console.log(`   - Excel Export\n`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('\n✅ Database connection closed');
        process.exit(0);
    });
});
