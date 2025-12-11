const express = require('express');
const cors = require('cors');
const path = require('path');
const database = require('./server/config/database');

// Import routes
const authRoutes = require('./server/routes/auth.routes');
const employeeRoutes = require('./server/routes/employee.routes');
const timesheetRoutes = require('./server/routes/timesheet.routes');
const exportRoutes = require('./server/routes/export.routes');

const app = express();
const PORT = process.env.PORT || 3005;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/timesheets', timesheetRoutes);
app.use('/api/export', exportRoutes);

// Backward compatibility routes (for existing frontend)
const CompatibilityController = require('./server/controllers/compatibility.controller');
app.post('/api/login', CompatibilityController.login);
app.post('/api/register', CompatibilityController.register);
app.get('/api/employees', CompatibilityController.getEmployees);
app.post('/api/employees', CompatibilityController.saveEmployee);
app.delete('/api/employees/:id', CompatibilityController.deleteEmployee);
app.get('/api/activities', CompatibilityController.getActivities);
app.post('/api/activities', CompatibilityController.saveActivity);
app.delete('/api/activities', CompatibilityController.deleteActivity);
app.get('/api/activity-log', CompatibilityController.getActivityLog);
app.post('/api/activity-log', CompatibilityController.logActivity);
app.delete('/api/activity-log', CompatibilityController.clearActivityLog);
app.get('/api/export', CompatibilityController.exportExcel);

// Serve static pages
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

// SPA catch-all
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// Initialize database and start server
async function startServer() {
    try {
        // Connect to database
        await database.connect();

        // Start server
        app.listen(PORT, '0.0.0.0', () => {
            const os = require('os');
            const networkInterfaces = os.networkInterfaces();

            console.log('\n🚀 Timesheet Application Server Started!');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
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

            console.log('\n✅ Database: SQLite (Connected)');
            console.log('✅ Architecture: Modular MVC');
            console.log('✅ Authentication: Session-based');
            console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        });

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n\n🛑 Shutting down server...');
    try {
        await database.close();
        console.log('✅ Database connection closed');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
    }
});

// Start the server
startServer();

module.exports = app;
