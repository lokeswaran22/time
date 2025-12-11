const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const db = new sqlite3.Database('./timesheet.db');

const pass = '123123';
bcrypt.hash(pass, 10, (err, hash) => {
    if (err) {
        console.error(err);
        return;
    }
    db.run("UPDATE users SET password = ? WHERE username = 'testuser'", [hash], function (err) {
        if (err) {
            console.error(err);
        } else {
            console.log(`Updated testuser password to ${pass}. Changes: ${this.changes}`);
        }
        db.close();
    });
});
