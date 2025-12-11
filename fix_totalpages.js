const sqlite3 = require('sqlite3').verbose();
const dbString = './timesheet.db';
const db = new sqlite3.Database(dbString);

db.serialize(() => {
    console.log('Running TotalPages Fix...');
    db.run(`
        UPDATE activities 
        SET totalPages = pagesDone 
        WHERE (totalPages IS NULL OR totalPages = '') AND pagesDone IS NOT NULL
    `, function (err) {
        if (err) console.error(err);
        else console.log(`Updated ${this.changes} rows.`);
    });
});
db.close();
