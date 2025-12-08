# Timesheet Tracker - React + MySQL Application

A modern, full-stack timesheet tracking application built with React and MySQL.

## 🚀 Quick Start

### Prerequisites

1. **Node.js** (already installed ✓)
2. **MySQL Server** - Choose one option:
   - **Option A (Recommended)**: [XAMPP](https://www.apachefriends.org/download.html) - Easiest, includes MySQL
   - **Option B**: [MySQL Community Server](https://dev.mysql.com/downloads/mysql/)

### Setup Instructions

#### Step 1: Install MySQL (if not already installed)

**Using XAMPP (Easiest):**
1. Download and install XAMPP
2. Open XAMPP Control Panel
3. Click "Start" next to MySQL
4. MySQL will run on port 3306

**Using MySQL Community Server:**
1. Download and install MySQL
2. Remember the root password you set during installation
3. Start MySQL service

#### Step 2: Configure Database Connection

1. Open the `.env` file in this directory
2. Update with your MySQL credentials:
   ```
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password_here
   DB_NAME=timesheet_db
   PORT=3000
   ```
   - For XAMPP: Usually password is empty (leave blank)
   - For MySQL Community: Use the password you set during installation

#### Step 3: Build the React Frontend (First Time Only)

```bash
cd client
npm install
npm run build
cd ..
```

#### Step 4: Start the Application

**Windows:**
```bash
.\start-app.bat
```

**Or manually:**
```bash
node server.js
```

The application will be available at: **http://localhost:3000**

## 📁 Project Structure

```
Ts/
├── client/              # React frontend (Vite)
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   └── App.jsx      # Main app component
│   └── dist/            # Built frontend (served by backend)
├── server.js            # Express + MySQL backend
├── .env                 # Database configuration
└── timesheet.db         # SQLite backup (legacy)
```

## 🔧 Development Mode

If you want to develop with hot-reload:

1. **Terminal 1 - Backend:**
   ```bash
   node server.js
   ```

2. **Terminal 2 - Frontend:**
   ```bash
   cd client
   npm run dev
   ```
   Frontend will run on http://localhost:5173

## 🗄️ Database

The application automatically:
- Creates the `timesheet_db` database
- Creates all required tables
- Sets up proper relationships

### Tables Created:
- `employees` - Employee information
- `activities` - Daily activity records
- `deleted_activities` - Recycle bin for deleted activities
- `users` - User authentication
- `activity_log` - Activity history tracker

## 🛠️ Troubleshooting

### "Could not connect to MySQL Database"

**Solution:**
1. Make sure MySQL is running:
   - XAMPP: Check XAMPP Control Panel, MySQL should be green
   - MySQL Service: Check Windows Services, MySQL should be "Running"
2. Verify credentials in `.env` file
3. Test connection: Open MySQL Workbench or phpMyAdmin

### "Port 3000 already in use"

**Solution:**
1. Close other running instances
2. Or change PORT in `.env` file

### Frontend not loading

**Solution:**
1. Make sure you built the frontend:
   ```bash
   cd client
   npm run build
   ```
2. Check that `client/dist` folder exists

## 📊 Features

- ✅ Employee management
- ✅ Hourly activity tracking
- ✅ Multiple activity types (Work, Break, Lunch, Leave, Permission)
- ✅ Pages done tracking (Proof Reading, Epub Process, Calibrai)
- ✅ Full day leave marking
- ✅ Activity history tracker
- ✅ Excel export
- ✅ Reminder system
- ✅ Real-time status updates
- ✅ Responsive design

## 🔐 Default Employees

The system includes these predefined employees:
Anitha, Asha, Aswini, Balaji, Dhivya, Dharma, Jegan, Kamal, Kumaran, Loki, Mani, Nandhini, Sakthi, Sandhiya, Sangeetha, Vivek, Yogesh

## 📝 Notes

- All data is stored in MySQL database
- Deleted items are backed up in `deleted_activities` table
- Activity log maintains a permanent history
- The application serves the React frontend from the backend (single port deployment)

## 🆘 Support

For issues or questions, check:
1. MySQL is running
2. `.env` credentials are correct
3. `client/dist` folder exists (run `npm run build` in client folder)
4. No other application is using port 3000

---

**For:** [Pristonix](https://pristonix.com)
