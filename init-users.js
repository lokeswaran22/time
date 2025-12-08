const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'timesheet.db');
const db = new sqlite3.Database(dbPath);

// Default users to create
const defaultUsers = [
    { username: 'admin', password: 'admin123', role: 'admin' },
    { username: 'Loki', password: 'loki123', role: 'employee' },
    { username: 'Anitha', password: 'anitha123', role: 'employee' },
    { username: 'Asha', password: 'asha123', role: 'employee' },
    { username: 'Aswini', password: 'aswini123', role: 'employee' }
];

console.log('🔧 Initializing default users...\n');

db.serialize(() => {
    // Check if users table exists
    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='users'", (err, row) => {
        if (err) {
            console.error('Error checking for users table:', err);
            return;
        }

        if (!row) {
            console.log('⚠️  Users table does not exist. Please run the server first to initialize the database.');
            db.close();
            return;
        }

        // Insert default users
        const stmt = db.prepare('INSERT OR IGNORE INTO users (username, password, role, createdAt) VALUES (?, ?, ?, ?)');

        defaultUsers.forEach(user => {
            stmt.run(user.username, user.password, user.role, new Date().toISOString(), function (err) {
                if (err) {
                    console.error(`❌ Error creating user ${user.username}:`, err.message);
                } else if (this.changes > 0) {
                    console.log(`✅ Created ${user.role} user: ${user.username} (password: ${user.password})`);
                } else {
                    console.log(`ℹ️  User ${user.username} already exists`);
                }
            });
        });

        stmt.finalize(() => {
            console.log('\n✨ User initialization complete!');
            console.log('\n📝 Default Credentials:');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('Admin Login:');
            console.log('  Username: admin');
            console.log('  Password: admin123');
            console.log('\nEmployee Login (examples):');
            console.log('  Username: Loki    | Password: loki123');
            console.log('  Username: Anitha  | Password: anitha123');
            console.log('  Username: Asha    | Password: asha123');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

            db.close();
        });
    });
});
