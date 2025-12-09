# 📊 Timesheet Tracker

A modern, beautiful web application for tracking employee daily hourly activities. Built with React and SQLite/MySQL, featuring a premium user interface with real-time updates, notifications, and comprehensive activity tracking.

![License](https://img.shields.io/badge/license-ISC-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen.svg)
![React](https://img.shields.io/badge/react-18.x-61dafb.svg)

## ✨ Features

- 🎯 **Employee Management** - Add, edit, and manage employee profiles with email support
- ⏰ **Hourly Activity Tracking** - Track activities for each hour of the workday (9 AM - 8 PM)
- 📝 **Multiple Activity Types** - Work, Break, Lunch, Leave, Permission
- 📄 **Pages Done Tracking** - Track Proof Reading, Epub Process, and Calibrai pages
- 🔔 **Smart Notifications** - Browser and in-app notifications for timesheet reminders
- 📊 **Activity History** - Comprehensive activity log with user tracking
- 📤 **Excel Export** - Export timesheets to Excel format
- 🎨 **Premium UI** - Royal-themed interface with smooth animations
- 🔐 **User Authentication** - Secure login system with admin panel
- ♻️ **Recycle Bin** - Recover deleted activities
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v14 or higher)
- **npm** (comes with Node.js)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd time
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the application**
   
   **Windows:**
   ```bash
   .\START.bat
   ```
   
   **Linux/Mac:**
   ```bash
   node server-react-sqlite.js
   ```

4. **Open your browser**
   ```
   http://localhost:3000
   ```

## 📁 Project Structure

```
time/
├── client/                 # React frontend (if using React version)
├── images/                 # Application images and assets
├── legacy/                 # Legacy code and backups
├── index.html             # Main HTML file
├── login.html             # Login page
├── history.html           # Activity history page
├── script.js              # Main JavaScript logic
├── style.css              # Main stylesheet
├── server-react-sqlite.js # React + SQLite server
├── server.js              # MySQL server
├── timesheet.db           # SQLite database
├── .env                   # Environment configuration
└── START.bat              # Windows startup script
```

## 🗄️ Database Options

The application supports both SQLite and MySQL:

### SQLite (Default - Recommended for Quick Start)
- **Server:** `server-react-sqlite.js`
- **Database:** `timesheet.db` (auto-created)
- **No setup required** - Just run and go!

### MySQL (For Production)
- **Server:** `server.js`
- **Setup:** Configure `.env` file with MySQL credentials
- **Database:** Auto-creates `timesheet_db`

### Database Tables
- `employees` - Employee information with email
- `activities` - Daily activity records
- `deleted_activities` - Recycle bin
- `users` - User authentication
- `activity_log` - Activity history tracker

## 🎨 UI Features

- **Royal Theme** - Deep navy blue and gold color scheme
- **Live Clock** - Real-time display in header
- **Modal Animations** - Smooth popup overlays
- **Preloader** - Branded loading screen
- **Glassmorphism** - Modern card designs
- **Hover Effects** - Interactive button states

## 🔔 Notification System

- **Browser Notifications** - Desktop alerts even when tab is inactive
- **In-App Notifications** - Visual alerts within the application
- **Timesheet Reminders** - Automatic prompts at end of time slots
- **Permission Handling** - Smart notification permission requests

## 🛠️ Available Scripts

### Start Scripts
- `START.bat` - Start React + SQLite version (Windows)
- `start-app.bat` - Alternative startup script
- `start-react-mysql.bat` - Start React + MySQL version
- `start-sqlite.bat` - Start SQLite version

### Utility Scripts
- `add-employees.js` - Add default employees
- `cleanup-database.js` - Clean up database
- `reset-database.js` - Reset database to defaults
- `verify-database.js` - Verify database integrity
- `generate-sample-data.js` - Generate test data

## 📊 Activity Types

1. **Work** - Regular work activities
2. **Break** - Short breaks
3. **Lunch** - Lunch break
4. **Leave** - Full day leave
5. **Permission** - Partial day permission

## 👥 Default Employees

The system includes predefined employees:
Anitha, Asha, Aswini, Balaji, Dhivya, Dharma, Jegan, Kamal, Kumaran, Loki, Mani, Nandhini, Sakthi, Sandhiya, Sangeetha, Vivek, Yogesh

## 🔐 Authentication

- **Login System** - Secure user authentication
- **Admin Panel** - Administrative controls
- **User Tracking** - Track who made each edit
- **Session Management** - Secure session handling

## 📤 Export Features

- **Excel Export** - Export timesheets to `.xlsx` format
- **Formatted Output** - Professional Excel formatting
- **Date Range Selection** - Export specific date ranges
- **Employee Filtering** - Export by employee

## 🛠️ Troubleshooting

### Port Already in Use
```bash
# Change PORT in .env file
PORT=3001
```

### Database Issues
```bash
# Reset database
node reset-database.js

# Verify database
node verify-database.js
```

### Module Not Found
```bash
# Reinstall dependencies
npm install
```

## 📝 Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=3000

# MySQL Configuration (if using MySQL)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=timesheet_db
```

## 🔄 Version History

- **v1.0** - Initial release with basic timesheet tracking
- **v2.0** - Added React frontend and MySQL support
- **v3.0** - Added notifications, activity history, and user authentication
- **Current** - Royal theme, enhanced UI, and comprehensive features

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
2. Verify all dependencies are installed
3. Ensure the database is properly initialized
4. Check that no other application is using port 3000

---

**Made with ❤️ for efficient timesheet management**
