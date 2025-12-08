# MySQL Migration Guide

## Prerequisites

1. **Install MySQL Server** (if not already installed)
   - Download from: https://dev.mysql.com/downloads/mysql/
   - Or use XAMPP/WAMP which includes MySQL

2. **Create the Database**
   ```sql
   CREATE DATABASE timesheet_db;
   ```

## Migration Steps

### 1. Install MySQL2 Package
```bash
npm install mysql2
```

### 2. Configure MySQL Connection

Edit `server-mysql.js` and update these lines (around line 16-19):

```javascript
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',           // Change to your MySQL username
    password: '',           // Change to your MySQL password
    database: 'timesheet_db',
    // ... rest of config
});
```

### 3. Export Data from SQLite (Optional - if you want to keep existing data)

Run this script to export your current data:
```bash
node export-sqlite-data.js
```

This will create a `data-export.json` file with all your employees and activities.

### 4. Start MySQL Server

Make sure MySQL is running on your system.

### 5. Switch to MySQL Server

**Option A: Rename files (recommended)**
```bash
# Backup SQLite server
mv server.js server-sqlite.js

# Use MySQL server
mv server-mysql.js server.js
```

**Option B: Update your start command**
```bash
node server-mysql.js
```

### 6. Import Data (if you exported in step 3)

```bash
node import-mysql-data.js
```

## Key Differences

### SQLite vs MySQL

| Feature | SQLite | MySQL |
|---------|--------|-------|
| Connection | File-based | Network-based |
| Concurrent Writes | Limited | Excellent |
| Data Types | TEXT, INTEGER | VARCHAR, INT, DATETIME |
| Auto Increment | AUTOINCREMENT | AUTO_INCREMENT |
| Insert/Replace | INSERT OR REPLACE | ON DUPLICATE KEY UPDATE |

### Code Changes Made

1. **Connection**: Changed from `sqlite3.Database` to `mysql2.createPool()`
2. **Async/Await**: All database operations now use promises
3. **Transactions**: Proper transaction handling with `beginTransaction()` and `commit()`
4. **Data Types**: Updated to MySQL-compatible types (VARCHAR, INT, DATETIME)
5. **Queries**: Changed SQLite-specific syntax to MySQL syntax

## Testing

1. Start the MySQL server: `node server-mysql.js`
2. Open http://localhost:3000
3. Test adding employees and activities
4. Verify data persistence

## Rollback

If you need to go back to SQLite:
```bash
mv server.js server-mysql.js
mv server-sqlite.js server.js
```

## Troubleshooting

### "Cannot connect to MySQL"
- Ensure MySQL server is running
- Check username/password in `server-mysql.js`
- Verify database `timesheet_db` exists

### "Table doesn't exist"
- The server creates tables automatically on first run
- Check MySQL logs for errors

### "Access denied"
- Update MySQL user permissions:
  ```sql
  GRANT ALL PRIVILEGES ON timesheet_db.* TO 'root'@'localhost';
  FLUSH PRIVILEGES;
  ```

## Benefits of MySQL

✅ Better performance with multiple users
✅ Proper concurrent access handling
✅ Industry-standard database
✅ Better for production environments
✅ Easier to scale and backup
✅ Support for remote connections
