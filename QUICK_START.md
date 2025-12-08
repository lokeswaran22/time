# 🎯 Pristonix Timesheet Tracker - Quick Start Guide

## ✨ Application Overview

A modern, premium web application for tracking employee daily hourly activities with a beautiful UI and comprehensive features.

## 🚀 Getting Started

### Prerequisites
- Node.js (v14.0.0 or higher)
- npm (comes with Node.js)

### Installation & Running

1. **Install Dependencies** (if not already done):
   ```bash
   npm install
   ```

2. **Start the Server**:
   ```bash
   npm start
   ```

3. **Access the Application**:
   - Open your browser and go to: **http://localhost:3005**
   - You will be automatically redirected to the login page

## 🔐 Default Login Credentials

### Admin Access
- **Username**: `admin`
- **Password**: `admin123`
- **Capabilities**: Full access to manage employees, view all timesheets, add/edit/delete activities

### Employee Access (Examples)
- **Loki**: Username: `Loki` | Password: `loki123`
- **Anitha**: Username: `Anitha` | Password: `anitha123`
- **Asha**: Username: `Asha` | Password: `asha123`
- **Aswini**: Username: `Aswini` | Password: `aswini123`

## 📋 Features

### For Employees:
- ✅ Login with personal credentials
- ✅ View personal timesheet (horizontal layout)
- ✅ Add/Edit activities for different time slots
- ✅ Track work activities (Proof Reading, Epub Process, Calibr Process)
- ✅ Mark breaks and lunch times
- ✅ Track pages completed for each activity
- ✅ View recent changes in the activity tracker

### For Administrators:
- ✅ Login with admin credentials
- ✅ View all employees' timesheets
- ✅ Add new employees with login credentials
- ✅ Edit employee information
- ✅ Delete employees
- ✅ Mark employees on leave or permission
- ✅ Export timesheet data to Excel
- ✅ Access admin panel for employee management
- ✅ View comprehensive activity history

## 🎨 How to Use

### Employee Workflow:
1. **Login**: Use your username and password on the Employee Login tab
2. **View Timesheet**: See your personal timesheet for the current day
3. **Add Activity**: Click on any time slot to add an activity
4. **Fill Details**:
   - Select activity type (Proof Reading, Epub Process, etc.)
   - Add description/notes
   - For work activities, enter start and end page numbers
5. **Save**: Click "Save Activity" to record your work
6. **Track Progress**: View your total pages completed in the header

### Admin Workflow:
1. **Login**: Use admin credentials on the Admin Login tab
2. **View All Employees**: See the complete timesheet for all employees
3. **Manage Employees**:
   - Click "Add Employee" to create new employee accounts
   - Click edit icon to modify employee details
   - Click delete icon to remove employees
4. **Mark Leave/Permission**: Click on employee name to mark them on leave or permission
5. **Export Data**: Click "Export to Excel" to download timesheet data
6. **Admin Panel**: Click "Admin Panel" to access employee management interface

## 🔧 Technical Details

### Technology Stack:
- **Backend**: Node.js + Express
- **Database**: SQLite (file-based, no setup required)
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Authentication**: Session-based with localStorage

### File Structure:
```
├── server-sqlite.js      # Main server file
├── index.html            # Main timesheet page
├── login.html            # Login page
├── auth-check.js         # Authentication middleware
├── script.js             # Main application logic
├── style.css             # Styling
├── timesheet.db          # SQLite database (auto-created)
└── init-users.js         # Script to initialize default users
```

### Database Tables:
- **users**: Login credentials and roles
- **employees**: Employee information
- **activities**: Time slot activities
- **activity_log**: Activity change history
- **deleted_activities**: Backup of deleted activities

## 🛠️ Maintenance

### Reset Database:
If you need to start fresh, you can delete `timesheet.db` and restart the server. It will create a new database automatically.

### Add More Users:
Run the initialization script:
```bash
node init-users.js
```

Or use the Admin Panel to add employees with login credentials.

### Backup Data:
Simply copy the `timesheet.db` file to create a backup.

## 🎯 Key Features Explained

### Activity Types:
- **Proof Reading**: Track proofreading work with page counts
- **Epub Process**: Track epub conversion work
- **Calibr Process**: Track calibration work
- **Meeting**: Record meeting times
- **Break**: Mark break times (11:00-11:10, 03:50-04:00)
- **Lunch**: Mark lunch time (01:00-01:40)
- **Other**: Any other activity

### Time Slots:
- 9:00-10:00
- 10:00-11:00
- 11:00-11:10 (Break)
- 11:10-12:00
- 12:00-01:00
- 01:00-01:40 (Lunch)
- 01:40-03:00
- 03:00-03:50
- 03:50-04:00 (Break)
- 04:00-05:00
- 05:00-06:00
- 06:00-07:00
- 07:00-08:00

### Page Tracking:
For work activities (Proof, Epub, Calibr), you can track:
- Start page number
- End page number
- Automatic calculation of total pages
- Daily totals displayed in the header

## 🔒 Security Notes

- Passwords are stored in plain text in the database (for simplicity)
- For production use, implement proper password hashing
- Change default admin password immediately
- Keep the `timesheet.db` file secure

## 📞 Support

For issues or questions:
1. Check the browser console for error messages
2. Verify the server is running on port 3005
3. Ensure you're using the correct login credentials
4. Try clearing browser cache and localStorage

## 🎨 Design Features

- Modern glassmorphism UI
- Responsive design
- Smooth animations and transitions
- Premium color scheme (Royal Blue & Gold)
- Real-time activity tracking
- Live activity feed
- Beautiful login page with role-based tabs

---

**Made with ❤️ by Pristonix | Designed by Trojanx**
