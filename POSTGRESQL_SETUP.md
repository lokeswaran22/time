# PostgreSQL Setup Guide for Timesheet Application

## Option 1: Local PostgreSQL Installation (Recommended for Development)

### Step 1: Install PostgreSQL
1. Download PostgreSQL from: https://www.postgresql.org/download/windows/
2. Run the installer
3. During installation:
   - Remember the password you set for the `postgres` user
   - Default port: 5432
   - Install pgAdmin 4 (GUI tool)

### Step 2: Create Database
Open Command Prompt or PowerShell and run:
```bash
# Login to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE timesheet_db;

# Exit
\q
```

### Step 3: Create .env File
Create a file named `.env` in the project root with:
```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/timesheet_db
PORT=3000
```
Replace `YOUR_PASSWORD` with your PostgreSQL password.

### Step 4: Start the Application
```bash
npm run start:prod
```

---

## Option 2: Free Cloud PostgreSQL (Render.com)

### Step 1: Create Free PostgreSQL Database
1. Go to https://render.com
2. Sign up for free account
3. Click "New +" → "PostgreSQL"
4. Name: `timesheet-db`
5. Database: `timesheet_db`
6. User: `timesheet_user`
7. Region: Choose closest to you
8. Plan: **Free**
9. Click "Create Database"

### Step 2: Get Connection String
1. After creation, click on your database
2. Scroll to "Connections"
3. Copy the **External Database URL**
   - It looks like: `postgresql://user:password@host:port/database`

### Step 3: Update .env File
```
DATABASE_URL=postgresql://timesheet_user:xxxxx@dpg-xxxxx.oregon-postgres.render.com/timesheet_db
PORT=3000
```

### Step 4: Start the Application
```bash
npm run start:prod
```

---

## Option 3: Other Free Cloud Options

### Supabase (Recommended - Very Easy)
1. Go to https://supabase.com
2. Create free account
3. New Project → Name it "Timesheet"
4. Copy the connection string from Settings → Database
5. Add to .env file

### ElephantSQL
1. Go to https://www.elephantsql.com
2. Create free "Tiny Turtle" plan
3. Copy connection URL
4. Add to .env file

---

## Verification

After starting with `npm run start:prod`, you should see:
```
🚀 Server is running on PostgreSQL!
📍 Listening on Port 3000
Connected to PostgreSQL database
Database initialized.
```

## Troubleshooting

### "DATABASE_URL environment variable is missing"
- Make sure `.env` file exists in project root
- Check that DATABASE_URL is set correctly

### "Failed to connect to DB"
- Check your PostgreSQL is running (local)
- Verify connection string is correct
- Check firewall settings

### "relation does not exist"
- Database tables will be created automatically on first run
- Check console for "Database initialized" message

---

## Migration from SQLite

Your existing SQLite data will NOT be automatically migrated. To migrate:

1. Export data from SQLite (use admin panel export)
2. Start PostgreSQL server
3. Re-add employees and activities

OR use the migration script (coming next).

---

## Quick Start (Recommended)

**For beginners, use Render.com (Option 2) - it's completely free and requires no local installation!**

1. Create free Render PostgreSQL database
2. Copy connection string
3. Create `.env` file with DATABASE_URL
4. Run `npm run start:prod`
5. Done!
