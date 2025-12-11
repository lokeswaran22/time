# 🚀 Timesheet Application - Microsoft Teams Integration

## Project Overview
Building a comprehensive timesheet management system with Microsoft Teams authentication, employee timesheet tracking, and admin management panel.

## 🎯 Core Features

### Employee Features
- ✅ Microsoft Teams OAuth Login
- ✅ Auto-create profile using Teams name
- ✅ Daily hourly production tracking (9:00 AM - 8:00 PM)
- ✅ Activity types: Work, Break, Lunch, Leave, Permission
- ✅ Pages tracking: Proof Reading, Epub Process, Calibrai
- ✅ Description field for each activity
- ✅ Full day leave marking
- ✅ Logout functionality

### Admin Features
- ✅ Admin login (separate from Teams)
- ✅ View all employees' timesheets in table format
- ✅ CRUD operations on timesheet entries
- ✅ Send reminders to employees
- ✅ Export data (date-wise)
- ✅ Filter by employee
- ✅ Timestamp tracking for all actions
- ✅ Activity history log

## 📅 Time Slots
```
09:00-10:00
10:00-11:00
11:00-11:10 (Break)
11:10-12:00
12:00-01:00
01:00-01:40 (Lunch)
01:40-03:00
03:00-03:50
03:50-04:00 (Break)
04:00-05:00
05:00-06:00
06:00-07:00
07:00-08:00
```

## 🏗️ Tech Stack

### Frontend
- React 18 with TypeScript
- React Router for navigation
- MSAL (Microsoft Authentication Library) for Teams login
- Axios for API calls
- Material-UI or Tailwind CSS for styling
- React-Toastify for notifications
- XLSX for Excel export

### Backend
- Node.js + Express
- MySQL/PostgreSQL database
- JWT for session management
- bcrypt for admin password hashing
- MSAL Node for Teams authentication
- CORS enabled

### Database Schema

#### Tables:
1. **users**
   - id (PK)
   - teams_id (unique)
   - name
   - email
   - role (employee/admin)
   - created_at
   - last_login

2. **timesheets**
   - id (PK)
   - user_id (FK)
   - date
   - time_slot
   - activity_type (Work/Break/Lunch/Leave/Permission)
   - description
   - pages_proof_reading
   - pages_epub
   - pages_calibrai
   - created_at
   - updated_at
   - created_by
   - updated_by

3. **activity_log**
   - id (PK)
   - user_id (FK)
   - action (create/update/delete/reminder)
   - timesheet_id (FK)
   - details
   - timestamp
   - performed_by

4. **reminders**
   - id (PK)
   - user_id (FK)
   - message
   - sent_at
   - sent_by

## 🔐 Authentication Flow

### Employee Login:
1. Click "Login with Microsoft Teams"
2. Redirect to Microsoft OAuth
3. Get user profile (name, email, teams_id)
4. Auto-create user if not exists
5. Generate JWT token
6. Redirect to employee dashboard

### Admin Login:
1. Username/password form
2. Verify credentials
3. Generate JWT token
4. Redirect to admin dashboard

## 📱 Application Structure

```
timesheet-app/
├── client/                      # React Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth/
│   │   │   │   ├── TeamsLogin.tsx
│   │   │   │   ├── AdminLogin.tsx
│   │   │   │   └── ProtectedRoute.tsx
│   │   │   ├── Employee/
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   ├── TimesheetForm.tsx
│   │   │   │   └── TimeSlotCard.tsx
│   │   │   ├── Admin/
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   ├── TimesheetTable.tsx
│   │   │   │   ├── EmployeeFilter.tsx
│   │   │   │   ├── ExportButton.tsx
│   │   │   │   └── ReminderModal.tsx
│   │   │   └── Common/
│   │   │       ├── Header.tsx
│   │   │       ├── Navbar.tsx
│   │   │       └── Loader.tsx
│   │   ├── services/
│   │   │   ├── authService.ts
│   │   │   ├── timesheetService.ts
│   │   │   └── adminService.ts
│   │   ├── utils/
│   │   │   ├── msalConfig.ts
│   │   │   └── constants.ts
│   │   ├── App.tsx
│   │   └── index.tsx
│   └── package.json
├── server/                      # Node.js Backend
│   ├── config/
│   │   ├── database.js
│   │   └── msal.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── timesheetController.js
│   │   └── adminController.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   └── adminMiddleware.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Timesheet.js
│   │   └── ActivityLog.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── timesheet.js
│   │   └── admin.js
│   ├── utils/
│   │   └── logger.js
│   └── server.js
└── .env
```

## 🔄 Implementation Steps

### Phase 1: Setup & Authentication (Priority)
1. ✅ Create React app with TypeScript
2. ✅ Setup Express server
3. ✅ Configure MySQL database
4. ✅ Implement Microsoft Teams OAuth
5. ✅ Create admin login
6. ✅ JWT token management

### Phase 2: Employee Features
1. ✅ Employee dashboard
2. ✅ Timesheet form with time slots
3. ✅ Activity type selection
4. ✅ Pages tracking inputs
5. ✅ Save/update timesheet
6. ✅ View own timesheet history

### Phase 3: Admin Features
1. ✅ Admin dashboard
2. ✅ All employees timesheet table
3. ✅ CRUD operations
4. ✅ Employee filtering
5. ✅ Date range filtering
6. ✅ Send reminders
7. ✅ Excel export

### Phase 4: Polish & Testing
1. ✅ Responsive design
2. ✅ Error handling
3. ✅ Loading states
4. ✅ Notifications
5. ✅ Activity logging
6. ✅ Testing

## 🔑 Environment Variables

```env
# Server
PORT=5000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=timesheet_db

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=7d

# Microsoft Teams OAuth
AZURE_CLIENT_ID=your_client_id
AZURE_CLIENT_SECRET=your_client_secret
AZURE_TENANT_ID=your_tenant_id
REDIRECT_URI=http://localhost:3000/auth/callback

# Admin
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

## 📊 API Endpoints

### Authentication
- POST `/api/auth/teams/login` - Teams OAuth callback
- POST `/api/auth/admin/login` - Admin login
- POST `/api/auth/logout` - Logout
- GET `/api/auth/me` - Get current user

### Timesheet (Employee)
- GET `/api/timesheet/my` - Get my timesheets
- POST `/api/timesheet` - Create timesheet entry
- PUT `/api/timesheet/:id` - Update timesheet entry
- DELETE `/api/timesheet/:id` - Delete timesheet entry

### Admin
- GET `/api/admin/timesheets` - Get all timesheets (with filters)
- GET `/api/admin/employees` - Get all employees
- PUT `/api/admin/timesheet/:id` - Update any timesheet
- DELETE `/api/admin/timesheet/:id` - Delete any timesheet
- POST `/api/admin/reminder` - Send reminder to employee
- GET `/api/admin/export` - Export to Excel
- GET `/api/admin/activity-log` - Get activity history

## 🎨 UI/UX Design

### Color Scheme
- Primary: #1976d2 (Microsoft Blue)
- Secondary: #f50057
- Success: #4caf50
- Warning: #ff9800
- Error: #f44336

### Components
- Modern card-based design
- Responsive tables
- Modal dialogs
- Toast notifications
- Loading spinners
- Date pickers
- Dropdown filters

## 🚀 Deployment Checklist
- [ ] Setup Azure AD App Registration
- [ ] Configure production database
- [ ] Setup environment variables
- [ ] Build React app
- [ ] Deploy backend to cloud
- [ ] Deploy frontend to cloud
- [ ] Configure CORS
- [ ] SSL certificate
- [ ] Monitor logs

---

**Ready to implement!** 🎯
