const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.resolve(__dirname, 'timesheet.db');
const db = new sqlite3.Database(dbPath);

async function addTestUser() {
    try {
        // Hash the password
        const hashedPassword = await bcrypt.hash('test123', 10);

        // Insert test employee
        db.run(
            'INSERT OR REPLACE INTO users (id, name, username, password, role, email, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [2, 'Test Employee', 'testuser', hashedPassword, 'employee', 'test@example.com', new Date().toISOString()],
            function (err) {
                if (err) {
                    console.error('Error adding test user:', err);
                } else {
                    console.log('✅ Test employee added successfully!');
                    console.log('   Username: testuser');
                    console.log('   Password: test123');
                    console.log('   Role: employee');
                }
                db.close();
            }
        );
    } catch (error) {
        console.error('Error:', error);
        db.close();
    }
}

addTestUser();
