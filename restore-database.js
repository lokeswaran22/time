const mysql = require('mysql2/promise');
const fs = require('fs').promises;

// MySQL Connection
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'timesheet_db',
    waitForConnections: true,
    connectionLimit: 10
});

async function restoreBackup(backupFile) {
    try {
        console.log('🔄 Starting database restore...');
        console.log(`📁 Reading backup file: ${backupFile}`);

        // Read backup file
        const backupData = await fs.readFile(backupFile, 'utf8');
        const backup = JSON.parse(backupData);

        console.log(`📅 Backup created: ${backup.timestamp}`);
        console.log(`📊 Backup contains:`);
        console.log(`   - Employees: ${backup.stats.totalEmployees}`);
        console.log(`   - Activities: ${backup.stats.totalActivities}`);
        console.log(`   - Deleted Activities: ${backup.stats.deletedActivities}`);
        console.log(`   - Log Entries: ${backup.stats.logEntries}`);

        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            // Clear existing data
            console.log('\n🗑️  Clearing existing data...');
            await connection.query('DELETE FROM activity_log');
            await connection.query('DELETE FROM deleted_activities');
            await connection.query('DELETE FROM activities');
            await connection.query('DELETE FROM employees');

            // Restore employees
            console.log('👥 Restoring employees...');
            for (const emp of backup.employees) {
                await connection.query(
                    'INSERT INTO employees (id, name, createdAt) VALUES (?, ?, ?)',
                    [emp.id, emp.name, emp.createdAt]
                );
            }

            // Restore activities
            console.log('📝 Restoring activities...');
            for (const act of backup.activities) {
                await connection.query(
                    `INSERT INTO activities (dateKey, employeeId, timeSlot, type, description, totalPages, pagesDone, timestamp)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [act.dateKey, act.employeeId, act.timeSlot, act.type, act.description, act.totalPages, act.pagesDone, act.timestamp]
                );
            }

            // Restore deleted activities
            console.log('🗂️  Restoring deleted activities...');
            for (const act of backup.deletedActivities) {
                await connection.query(
                    `INSERT INTO deleted_activities (original_id, dateKey, employeeId, timeSlot, type, description, totalPages, pagesDone, timestamp, deletedAt)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [act.original_id, act.dateKey, act.employeeId, act.timeSlot, act.type, act.description, act.totalPages, act.pagesDone, act.timestamp, act.deletedAt]
                );
            }

            // Restore activity log
            console.log('📋 Restoring activity log...');
            for (const log of backup.activityLog) {
                await connection.query(
                    `INSERT INTO activity_log (employeeName, activityType, description, timeSlot, action, timestamp, createdAt)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [log.employeeName, log.activityType, log.description, log.timeSlot, log.action, log.timestamp, log.createdAt]
                );
            }

            await connection.commit();

            console.log('\n✅ Database restored successfully!');
            console.log('📊 Restored:');
            console.log(`   - ${backup.stats.totalEmployees} employees`);
            console.log(`   - ${backup.stats.totalActivities} activities`);
            console.log(`   - ${backup.stats.deletedActivities} deleted activities`);
            console.log(`   - ${backup.stats.logEntries} log entries`);

        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }

        process.exit(0);
    } catch (err) {
        console.error('❌ Restore failed:', err.message);
        process.exit(1);
    }
}

// Get backup file from command line argument
const backupFile = process.argv[2];

if (!backupFile) {
    console.error('❌ Please provide a backup file path');
    console.log('Usage: node restore-database.js <backup-file>');
    console.log('Example: node restore-database.js backups/backup_2025-12-02T03-00-00-000Z.json');
    process.exit(1);
}

restoreBackup(backupFile);
