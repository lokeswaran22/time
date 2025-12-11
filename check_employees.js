const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const db = new sqlite3.Database(path.resolve(__dirname, 'timesheet.db'));

db.all('SELECT * FROM employees', (err, rows) => {
    if (err) console.log('No employees table or error:', err.message);
    else console.log('Employees:', rows);
    db.close();
});
