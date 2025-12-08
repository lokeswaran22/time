# Data Persistence & Backup Guide

## ✅ Data Persistence Guarantees

Your MySQL database ensures **permanent data storage** through:

### 1. **Database Persistence**
- All data is stored in MySQL tables on disk
- Data survives server restarts
- ACID compliance ensures data integrity
- Transactions prevent partial updates

### 2. **Backup System**
Three layers of data protection:

#### **Active Data** (Main Tables)
- `employees` - All employee records
- `activities` - All timesheet activities

#### **Recycle Bin** (Safety Net)
- `deleted_activities` - Recoverable deleted data
- Automatic backup before any deletion

#### **Audit Trail** (History)
- `activity_log` - Complete change history
- Never deleted, permanent record

## 🛡️ Data Safety Features

### **Transaction Protection**
```javascript
// Every critical operation uses transactions
await connection.beginTransaction();
// ... operations ...
await connection.commit(); // Only saves if all succeed
```

### **Foreign Key Constraints**
- Prevents orphaned records
- Maintains data relationships
- CASCADE deletion with backup

### **Unique Constraints**
- Prevents duplicate entries
- Ensures data consistency

## 📦 Backup & Restore

### **Create Manual Backup**
```bash
node backup-database.js
```

This creates a timestamped JSON backup in the `backups/` folder:
- Keeps last 30 backups automatically
- Includes all tables and data
- Human-readable JSON format

### **Restore from Backup**
```bash
node restore-database.js backups/backup_2025-12-02T03-00-00-000Z.json
```

### **Verify Database**
```bash
node verify-database.js
```

Checks:
- Connection status
- Record counts
- Data integrity
- Recent activities
- Table structures

## 🔄 Automated Backup Schedule

### **Windows Task Scheduler**
1. Open Task Scheduler
2. Create Basic Task
3. Set trigger (e.g., Daily at 2 AM)
4. Action: Start a program
   - Program: `node`
   - Arguments: `backup-database.js`
   - Start in: `E:\lokii\Ts`

### **Linux/Mac Cron Job**
```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * cd /path/to/Ts && node backup-database.js
```

## 💾 MySQL Data Location

Your data is stored in MySQL's data directory:

**Windows (default):**
```
C:\ProgramData\MySQL\MySQL Server 8.0\Data\timesheet_db\
```

**Linux:**
```
/var/lib/mysql/timesheet_db/
```

## 🔐 Data Security Best Practices

### 1. **Regular Backups**
```bash
# Run backup before major changes
node backup-database.js
```

### 2. **MySQL Configuration**
Ensure these settings in `my.ini` or `my.cnf`:
```ini
[mysqld]
# Enable binary logging for point-in-time recovery
log-bin=mysql-bin

# Enable InnoDB (ACID compliant)
default-storage-engine=InnoDB

# Auto-commit (ensures immediate persistence)
autocommit=1
```

### 3. **Database Dumps**
```bash
# Full MySQL dump
mysqldump -u root -p timesheet_db > timesheet_backup.sql

# Restore from dump
mysql -u root -p timesheet_db < timesheet_backup.sql
```

## 📊 Data Verification

### **Check Data Exists**
```sql
-- Connect to MySQL
mysql -u root -p

-- Use database
USE timesheet_db;

-- Check employees
SELECT COUNT(*) FROM employees;

-- Check activities
SELECT COUNT(*) FROM activities;

-- View recent data
SELECT * FROM activities ORDER BY timestamp DESC LIMIT 10;
```

## ⚡ Performance & Reliability

### **Connection Pooling**
- Maintains 10 concurrent connections
- Automatic reconnection
- Queue management for high load

### **Error Handling**
- All operations wrapped in try-catch
- Transaction rollback on errors
- Detailed error logging

### **Data Validation**
- Required fields enforced
- Unique constraints prevent duplicates
- Foreign keys maintain relationships

## 🚨 Recovery Scenarios

### **Scenario 1: Accidental Deletion**
```bash
# Restore from most recent backup
node restore-database.js backups/backup_<latest>.json
```

### **Scenario 2: Data Corruption**
```bash
# 1. Verify database
node verify-database.js

# 2. Restore from known good backup
node restore-database.js backups/backup_<date>.json
```

### **Scenario 3: Server Crash**
- MySQL automatically recovers using transaction logs
- Data committed before crash is safe
- Uncommitted transactions are rolled back

## ✅ Verification Checklist

Run this checklist weekly:

- [ ] Create backup: `node backup-database.js`
- [ ] Verify data: `node verify-database.js`
- [ ] Check backup folder has recent files
- [ ] Test restore on a copy (optional)
- [ ] Review activity log for anomalies

## 📝 Important Notes

1. **Data is PERMANENT** - Stored in MySQL database files
2. **Survives restarts** - Data persists across server restarts
3. **Transaction safe** - All operations are atomic
4. **Backup protected** - Deleted data goes to recycle bin
5. **Audit trail** - All changes logged permanently

## 🔗 Quick Commands

```bash
# Backup
node backup-database.js

# Verify
node verify-database.js

# Restore
node restore-database.js backups/<filename>.json

# Check MySQL status
mysql -u root -p -e "SELECT COUNT(*) FROM timesheet_db.employees;"
```

## 💡 Pro Tips

1. **Before major changes**: Always create a backup
2. **Weekly verification**: Run verify-database.js
3. **Keep backups**: Don't delete old backup files manually
4. **Monitor logs**: Check server console for errors
5. **Test restores**: Periodically test backup restoration

---

**Your data is safe and permanent!** 🎉
