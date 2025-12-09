const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'timesheet.db');

console.log('🔄 Starting Microsoft Teams Authentication Migration...\n');

const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('❌ Error opening database:', err.message);
        process.exit(1);
    }
    console.log('✅ Connected to SQLite database');
});

// Run migrations sequentially
db.serialize(() => {
    // 1. Create users table for Microsoft Teams authentication
    console.log('\n📊 Creating users table...');
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
    `, (err) => {
        if (err) {
            console.error('❌ Error creating users table:', err.message);
        } else {
            console.log('✅ Users table created successfully');
        }
    });

    // 2. Add user_id column to employees table
    console.log('\n📊 Updating employees table...');
    db.run(`
        ALTER TABLE employees ADD COLUMN user_id INTEGER REFERENCES users(id)
    `, (err) => {
        if (err && !err.message.includes('duplicate column')) {
            console.error('⚠️  Warning (employees.user_id):', err.message);
        } else {
            console.log('✅ Added user_id to employees table');
        }
    });

    // 3. Add tracking columns to activities table
    console.log('\n📊 Updating activities table...');

    db.run(`
        ALTER TABLE activities ADD COLUMN created_by_user_id INTEGER REFERENCES users(id)
    `, (err) => {
        if (err && !err.message.includes('duplicate column')) {
            console.error('⚠️  Warning (activities.created_by_user_id):', err.message);
        } else {
            console.log('✅ Added created_by_user_id to activities table');
        }
    });

    db.run(`
        ALTER TABLE activities ADD COLUMN updated_by_user_id INTEGER REFERENCES users(id)
    `, (err) => {
        if (err && !err.message.includes('duplicate column')) {
            console.error('⚠️  Warning (activities.updated_by_user_id):', err.message);
        } else {
            console.log('✅ Added updated_by_user_id to activities table');
        }
    });

    db.run(`
        ALTER TABLE activities ADD COLUMN created_at_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    `, (err) => {
        if (err && !err.message.includes('duplicate column')) {
            console.error('⚠️  Warning (activities.created_at_timestamp):', err.message);
        } else {
            console.log('✅ Added created_at_timestamp to activities table');
        }
    });

    db.run(`
        ALTER TABLE activities ADD COLUMN updated_at_timestamp DATETIME
    `, (err) => {
        if (err && !err.message.includes('duplicate column')) {
            console.error('⚠️  Warning (activities.updated_at_timestamp):', err.message);
        } else {
            console.log('✅ Added updated_at_timestamp to activities table');
        }
    });

    // 4. Create admin_actions table for audit trail
    console.log('\n📊 Creating admin_actions table...');
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
    `, (err) => {
        if (err) {
            console.error('❌ Error creating admin_actions table:', err.message);
        } else {
            console.log('✅ Admin actions table created successfully');
        }
    });

    // 5. Create reminders table
    console.log('\n📊 Creating reminders table...');
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
    `, (err) => {
        if (err) {
            console.error('❌ Error creating reminders table:', err.message);
        } else {
            console.log('✅ Reminders table created successfully');
        }
    });

    // 6. Create a default admin user (for testing)
    console.log('\n👤 Creating default admin user...');
    db.run(`
        INSERT OR IGNORE INTO users (azure_id, email, display_name, teams_name, role, department)
        VALUES (
            'admin-default-001',
            'admin@company.com',
            'Admin User',
            'Admin User',
            'admin',
            'Administration'
        )
    `, (err) => {
        if (err) {
            console.error('⚠️  Warning:', err.message);
        } else {
            console.log('✅ Default admin user created (email: admin@company.com)');
        }
    });

    // Verify migration
    console.log('\n🔍 Verifying migration...');
    db.all(`
        SELECT name FROM sqlite_master WHERE type='table' ORDER BY name
    `, (err, tables) => {
        if (err) {
            console.error('❌ Error verifying tables:', err.message);
        } else {
            console.log('\n📋 Current tables in database:');
            tables.forEach(table => {
                console.log(`   - ${table.name}`);
            });
        }

        // Close database
        db.close((err) => {
            if (err) {
                console.error('\n❌ Error closing database:', err.message);
            } else {
                console.log('\n✅ Migration completed successfully!');
                console.log('\n📝 Next steps:');
                console.log('   1. Configure Azure AD app in Azure Portal');
                console.log('   2. Update .env file with MSAL credentials');
                console.log('   3. Restart the application');
                console.log('   4. Test Microsoft Teams login\n');
            }
        });
    });
});
