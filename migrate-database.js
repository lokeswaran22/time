const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'timesheet.db');
const db = new sqlite3.Database(dbPath);

console.log('🔧 Migrating database schema...\n');

// Check if activities table has userId column
db.all("PRAGMA table_info(activities)", (err, columns) => {
    if (err) {
        console.error('Error checking table:', err);
        db.close();
        return;
    }

    const hasUserId = columns.some(col => col.name === 'userId');

    if (hasUserId) {
        console.log('✅ Database already has userId column. No migration needed.');
        db.close();
        return;
    }

    console.log('📝 Adding userId column to activities table...');

    // Start migration
    db.serialize(() => {
        // Create new table with correct schema
        db.run(`
            CREATE TABLE IF NOT EXISTS activities_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                userId INTEGER,
                dateKey TEXT,
                timeSlot TEXT,
                type TEXT,
                description TEXT,
                totalPages TEXT,
                pagesDone TEXT,
                timestamp TEXT,
                FOREIGN KEY(userId) REFERENCES users(id)
            )
        `, (err) => {
            if (err) {
                console.error('Error creating new table:', err);
                db.close();
                return;
            }

            // Copy data from old table (if it exists and has data)
            db.run(`
                INSERT INTO activities_new (id, dateKey, timeSlot, type, description, totalPages, pagesDone, timestamp)
                SELECT id, dateKey, timeSlot, type, description, totalPages, pagesDone, timestamp
                FROM activities
            `, (err) => {
                if (err) {
                    console.log('ℹ️  No existing data to migrate (this is normal for new installations)');
                }

                // Drop old table
                db.run('DROP TABLE IF EXISTS activities', (err) => {
                    if (err) {
                        console.error('Error dropping old table:', err);
                        db.close();
                        return;
                    }

                    // Rename new table
                    db.run('ALTER TABLE activities_new RENAME TO activities', (err) => {
                        if (err) {
                            console.error('Error renaming table:', err);
                            db.close();
                            return;
                        }

                        console.log('✅ Migration completed successfully!');
                        console.log('📊 Activities table now has userId column');
                        console.log('\n🔄 Please restart the server: npm start\n');
                        db.close();
                    });
                });
            });
        });
    });
});
