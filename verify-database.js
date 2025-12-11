const mysql = require('mysql2/promise');

// MySQL Connection
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'timesheet_db',
    waitForConnections: true,
    connectionLimit: 10
});

async function verifyData() {
    try {
        console.log('🔍 Verifying database integrity...\n');

        // Check connection
        const connection = await pool.getConnection();
        console.log('✅ Database connection: OK');
        connection.release();

        // Get counts
        const [employeeCount] = await pool.query('SELECT COUNT(*) as count FROM employees');
        const [activityCount] = await pool.query('SELECT COUNT(*) as count FROM activities');
        const [deletedCount] = await pool.query('SELECT COUNT(*) as count FROM deleted_activities');
        const [logCount] = await pool.query('SELECT COUNT(*) as count FROM activity_log');

        console.log('\n📊 Database Statistics:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`👥 Employees:          ${employeeCount[0].count}`);
        console.log(`📝 Activities:         ${activityCount[0].count}`);
        console.log(`🗑️  Deleted Activities: ${deletedCount[0].count}`);
        console.log(`📋 Activity Log:       ${logCount[0].count}`);

        // Check for orphaned activities
        const [orphaned] = await pool.query(`
            SELECT COUNT(*) as count 
            FROM activities a 
            LEFT JOIN employees e ON a.employeeId = e.id 
            WHERE e.id IS NULL
        `);

        if (orphaned[0].count > 0) {
            console.log(`\n⚠️  Warning: ${orphaned[0].count} orphaned activities found`);
        } else {
            console.log('\n✅ Data integrity: OK (no orphaned records)');
        }

        // Show recent activities
        const [recentActivities] = await pool.query(`
            SELECT e.name, a.dateKey, a.timeSlot, a.type 
            FROM activities a 
            JOIN employees e ON a.employeeId = e.id 
            ORDER BY a.timestamp DESC 
            LIMIT 5
        `);

        if (recentActivities.length > 0) {
            console.log('\n📅 Recent Activities:');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            recentActivities.forEach(act => {
                console.log(`   ${act.name} - ${act.dateKey} ${act.timeSlot} (${act.type})`);
            });
        }

        // Check table structures
        const tables = ['employees', 'activities', 'deleted_activities', 'activity_log'];
        console.log('\n🔧 Table Structures:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        for (const table of tables) {
            const [columns] = await pool.query(`SHOW COLUMNS FROM ${table}`);
            console.log(`\n${table}:`);
            columns.forEach(col => {
                console.log(`   - ${col.Field} (${col.Type})`);
            });
        }

        console.log('\n✅ Database verification complete!\n');
        process.exit(0);
    } catch (err) {
        console.error('\n❌ Verification failed:', err.message);
        process.exit(1);
    }
}

verifyData();
