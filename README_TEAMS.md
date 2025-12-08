# 📊 Timesheet Tracker - Microsoft Teams Edition

A modern, enterprise-ready timesheet management system with **Microsoft Teams authentication**, role-based access control, and comprehensive activity tracking.

![Version](https://img.shields.io/badge/version-2.0--teams-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen.svg)
![React](https://img.shields.io/badge/react-19.x-61dafb.svg)
![License](https://img.shields.io/badge/license-ISC-blue.svg)

## 🎯 What's New in Teams Edition

### 🔐 Microsoft Teams Authentication
- **Single Sign-On (SSO)** with Microsoft Teams/Office 365 accounts
- Automatic employee name from Teams profile
- Secure JWT token-based authentication
- Role-based access control (Employee vs Admin)
- **Demo Mode** for testing without Azure AD setup

### 👤 Employee Features
- ✅ Login via Microsoft Teams account
- ✅ Personal timesheet with 13 hourly time slots (9 AM - 8 PM)
- ✅ 5 Activity types: Work, Break, Lunch, Leave, Permission
- ✅ Pages tracking: Proof Reading, Epub Process, Calibrai
- ✅ **Read-only view** of other employees' timesheets
- ✅ **Edit restriction**: Can only modify own timesheet
- ✅ Full day leave marking
- ✅ Real-time activity history
- ✅ Browser notifications for timesheet reminders

### 👨‍💼 Admin Features
- ✅ **Admin Panel** with comprehensive table view
- ✅ View all employees' timesheets in one place
- ✅ **Add, Edit, Delete** any timesheet entry
- ✅ **Timestamp tracking**: See who created/modified each entry
- ✅ **Send reminders** to employees
- ✅ **Excel export** with date-wise and employee-wise filtering
- ✅ **Audit log**: Track all admin actions
- ✅ Filter by employee, date range, and activity type

## 🚀 Quick Start

### Prerequisites
- **Node.js** v14 or higher
- **npm** (comes with Node.js)
- **Microsoft Teams** account (optional - app works in Demo Mode without it)

### Installation

1. **Clone or navigate to the repository**
   ```bash
   cd e:\github\Timesheet
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd client
   npm install
   cd ..
   ```

3. **Run database migration**
   ```bash
   node migrate-teams-auth.js
   ```

4. **Configure environment** (Optional - skip for Demo Mode)
   
   Copy `.env.example` to `.env` and fill in Azure AD credentials:
   ```bash
   copy .env.example .env
   ```
   
   Edit `.env` with your Azure AD app credentials (see [Azure AD Setup Guide](AZURE_AD_SETUP_GUIDE.md))

5. **Start the application**
   
   **Windows:**
   ```bash
   START-TEAMS.bat
   ```
   
   **Manual start:**
   ```bash
   node server-teams-sqlite.js
   ```

6. **Access the application**
   ```
   http://localhost:3000/teams-login
   ```

## 🎪 Demo Mode

**No Azure AD? No problem!**

The application automatically runs in **Demo Mode** if Azure AD credentials are not configured.

### Demo Mode Features:
- ✅ Login with any email address
- ✅ Automatic user creation
- ✅ Admin role for emails containing "admin"
- ✅ Full functionality except actual Teams integration
- ✅ Perfect for development and testing

### Demo Login Examples:
```
Admin Access:
Email: admin@company.com
Name: (optional, auto-generated from email)

Employee Access:
Email: john.doe@company.com
Name: John Doe
```

## 📊 Time Slots Configuration

The application uses **13 predefined hourly time slots**:

```
09:00-10:00  →  Morning work
10:00-11:00  →  Morning work
11:00-11:10  →  Tea break
11:10-12:00  →  Pre-lunch work
12:00-01:00  →  Work/Break
01:00-01:40  →  🍽️ LUNCH (default)
01:40-03:00  →  Afternoon work
03:00-03:50  →  Afternoon work
03:50-04:00  →  Tea break
04:00-05:00  →  Evening work
05:00-06:00  →  Evening work
06:00-07:00  →  Overtime
07:00-08:00  →  Overtime
```

## 🎨 Activity Types

### 1. **Work** 🟢
- Regular work activities
- Supports job/task description
- Pages tracking enabled

### 2. **Break** 🟡
- Short breaks (tea, rest)
- No description required

### 3. **Lunch** 🟠
- Meal break
- Default for 01:00-01:40 slot

### 4. **Leave** 🔴
- Full day or partial leave
- Can mark entire day as leave

### 5. **Permission** 🔵
- Personal time off
- Hospital visits, errands, etc.

## 📄 Pages Tracking

Track productivity with three work types:

1. **Proof Reading** 📖
   - Editing and reviewing content
   - Track pages completed

2. **Epub Process** 📱
   - E-book conversion and formatting
   - Monitor digital publication workflow

3. **Calibrai** 🎨
   - Graphics and calibration work
   - Specialized production tracking

## 🔐 Authentication & Authorization

### How It Works

1. **Login Flow:**
   ```
   User → Teams Login → Azure AD → JWT Token → Dashboard
   ```

2. **Role Assignment:**
   - Automatically assigned based on email or manual configuration
   - Stored in `users` table with `role` field

3. **Access Control:**
   - **Employee**: Can only edit own timesheet, view others in read-only
   - **Admin**: Full CRUD access to all timesheets + admin panel

### Security Features
- ✅ JWT token authentication (24-hour expiry)
- ✅ Backend authorization checks on all API routes
- ✅ Frontend UI restrictions based on role
- ✅ Audit trail for all admin actions
- ✅ Secure password-less authentication via Microsoft

## 📁 Project Structure

```
e:\github\Timesheet\
├── client/                          # React Frontend
│   ├── src/
│   │   ├── components/              # React components
│   │   │   ├── TeamsLogin.jsx      # ⭐ Teams login component
│   │   │   ├── ActivityModal.jsx   # Activity entry modal
│   │   │   ├── TimesheetTable.jsx  # Timesheet grid
│   │   │   └── ...
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx       # Employee dashboard
│   │   │   ├── AdminPanel.jsx      # ⭐ Admin panel
│   │   │   └── Login.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx     # ⭐ Authentication context
│   │   ├── config/
│   │   │   └── authConfig.js       # ⭐ MSAL configuration
│   │   └── App.jsx                 # ⭐ Main app with auth providers
│   ├── .env.example                # ⭐ Frontend env template
│   └── package.json
├── middleware/
│   └── auth.js                      # ⭐ JWT authentication middleware
├── server-teams-sqlite.js           # ⭐ Teams-enabled server
├── migrate-teams-auth.js            # ⭐ Database migration script
├── START-TEAMS.bat                  # ⭐ Quick start script
├── AZURE_AD_SETUP_GUIDE.md          # ⭐ Setup instructions
├── MSTEAMS_IMPLEMENTATION_PLAN.md   # ⭐ Implementation plan
├── .env.example                     # Backend env template
├── package.json
└── timesheet.db                     # SQLite database

⭐ = New Teams Edition files
```

## 🗄️ Database Schema

### New Tables (Teams Edition)

#### `users` - Microsoft Teams Users
```sql
- id (Primary Key)
- azure_id (Unique) - Azure AD user ID
- email (Unique)
- display_name - From Teams profile
- teams_name - Employee name
- role - 'employee' or 'admin'
- department
- created_at
- last_login
- is_active
```

#### `admin_actions` - Audit Trail
```sql
- id (Primary Key)
- admin_user_id (FK → users)
- action_type - 'add', 'edit', 'delete', 'remind'
- target_employee_id
- target_date
- target_timeslot
- old_value - JSON
- new_value - JSON
- timestamp
```

#### `reminders` - Employee Reminders
```sql
- id (Primary Key)
- admin_user_id (FK → users)
- employee_id (FK → employees)
- date
- message
- status - 'sent', 'pending', 'read'
- created_at
```

### Enhanced Tables

#### `activities` - Now includes:
- `created_by_user_id` - Who created the entry
- `updated_by_user_id` - Who last modified
- `created_at_timestamp` - Creation time
- `updated_at_timestamp` - Last modification time

#### `employees` - Now includes:
- `user_id` - Link to users table

## 🔌 API Endpoints

### Authentication
```
POST   /api/auth/login           - Login (Demo or Teams)
GET    /api/auth/verify          - Verify JWT token
GET    /api/auth/profile         - Get user profile
POST   /api/auth/logout          - Logout
```

### Employees
```
GET    /api/employees            - Get all employees
GET    /api/employees/me         - Get current user's employee data
POST   /api/employees            - Add/update employee (Admin)
DELETE /api/employees/:id        - Delete employee (Admin)
```

### Activities
```
GET    /api/activities                      - Get activities
POST   /api/activities                      - Save activity (authorized)
DELETE /api/activities                      - Delete activity (authorized)
```

### Admin
```
GET    /api/admin/timesheets     - Get all timesheets (Admin)
POST   /api/admin/remind/:id     - Send reminder (Admin)
GET    /api/admin/audit-log      - Get audit log (Admin)
```

### Export
```
GET    /api/export?dateKey=2025-12-07&employeeId=john  - Excel export
```

## 📤 Excel Export

### Features:
- ✅ Date-wise filtering
- ✅ Employee-wise filtering
- ✅ Formatted output with colors
- ✅ Total pages calculation
- ✅ Professional Excel formatting
- ✅ Download as `.xlsx` file

### Export File Structure:
```
| Employee Name | Total Pages | 9:00-10:00 | 10:00-11:00 | ... |
|---------------|-------------|------------|-------------|-----|
| John Doe      | 25          | WORK: ...  | WORK: ...   | ... |
| Jane Smith    | 30          | WORK: ...  | BREAK       | ... |
```

## 🔔 Notification System

### Browser Notifications
- Triggered at end of each time slot
- Reminds employees to fill timesheet
- Requires permission grant

### In-App Notifications
- Visual alerts within the application
- Admin can send custom reminders
- Notification history tracked

## 🎨 UI/UX Features

### Modern Design
- ✅ Gradient backgrounds
- ✅ Card-based layouts
- ✅ Smooth animations
- ✅ Responsive design (mobile-friendly)
- ✅ Loading states
- ✅ Error handling

### Accessibility
- ✅ Keyboard navigation
- ✅ Focus indicators
- ✅ Screen reader friendly
- ✅ High contrast mode support

### Visual Indicators
- 🟢 Green → Work
- 🟡 Yellow → Break
- 🟠 Orange → Lunch
- 🔴 Red → Leave
- 🔵 Blue → Permission
- 🔖 Badges for timestamps and editing info

## 🧪 Testing

### Test User Accounts (Demo Mode)

```javascript
// Admin Account
Email: admin@company.com
Role: admin
Access: Full admin panel + all features

// Employee Account
Email: employee1@company.com
Role: employee
Access: Own timesheet only
```

### Testing Checklist
- [ ] Login with Microsoft Teams account
- [ ] Login in Demo Mode
- [ ] Employee can edit own timesheet
- [ ] Employee cannot edit others' timesheets
- [ ] Admin can edit all timesheets
- [ ] Admin panel loads correctly
- [ ] Excel export works
- [ ] Reminders can be sent
- [ ] Audit log shows admin actions
- [ ] Timestamps display correctly

## 🚀 Deployment

### Production Checklist
- [ ] Set up Azure AD app with production redirect URI
- [ ] Configure `.env` with production values
- [ ] Build React frontend: `cd client && npm run build`
- [ ] Set `NODE_ENV=production`
- [ ] Use HTTPS (required for Teams auth)
- [ ] Configure database backups
- [ ] Set up monitoring and logging

### Deploy to Render/Heroku/etc
```bash
# Build frontend
cd client
npm run build
cd ..

# Start production server
NODE_ENV=production node server-teams-sqlite.js
```

## 📊 Usage Examples

### Employee Workflow
1. Login via Microsoft Teams
2. See personal timesheet with current date
3. Clickon empty time slot
4. Select activity type and fill details
5. Save entry (with automatic timestamp)
6. View activity history in right panel

### Admin Workflow
1. Login with admin account
2. Go to Admin Panel
3. Select date and employee filter
4. View all timesheets in table format
5. Edit/delete entries as needed
6. Send reminders to employees
7. Export data to Excel
8. Review audit log

## 🛠️ Troubleshooting

### Common Issues

**Issue: "MSAL Configuration Error"**
- Solution: Run in Demo Mode, or configure Azure AD properly

**Issue: "User not authenticated"**
- Solution: Check JWT token, login again if expired

**Issue: "Cannot edit timesheet"**
- Solution: Employees can only edit own timesheet. Use admin account for others.

**Issue: "Database locked"**
- Solution: Close other instances of the app, restart server

**Issue: "Port 3000 already in use"**
- Solution: Change PORT in `.env` file, or kill the process using port 3000

## 📚 Documentation

- [Azure AD Setup Guide](AZURE_AD_SETUP_GUIDE.md) - Complete Azure AD configuration
- [Implementation Plan](MSTEAMS_IMPLEMENTATION_PLAN.md) - Technical implementation details
- [Original README](README.md) - Previous version documentation

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

ISC License

## 🙏 Acknowledgments

- Microsoft Authentication Library (MSAL)
- React Team
- Node.js Community
- All contributors

## 📞 Support

For issues and questions:
1. Check the [Azure AD Setup Guide](AZURE_AD_SETUP_GUIDE.md)
2. Review error messages in browser console
3. Check server logs
4. Verify environment variables
5. Try Demo Mode to isolate Azure AD issues

---

**Made with ❤️ for efficient timesheet management with Microsoft Teams integration**

**Version 2.0 - Teams Edition** | Updated: December 2025
