const sqlite3 = require('sqlite3').verbose();
const dbString = './timesheet.db';
const db = new sqlite3.Database(dbString);

db.serialize(() => {
    console.log('Running DateKey Log Fix...');
    // Update dateKey for rows where it is null but timeSlot has the date
    db.run(`
        UPDATE activity_log 
        SET dateKey = SUBSTR(timeSlot, 1, 10) 
        WHERE dateKey IS NULL AND timeSlot LIKE '%|%'
    `, function (err) {
        if (err) {
            console.error('Error:', err.message);
        } else {
            console.log(`Updated ${this.changes} rows.`);
        }

        // Also fix any that might have been saved as 'YYYY-MM-DD' without pipe (unlikely)
    });
});

db.close();
