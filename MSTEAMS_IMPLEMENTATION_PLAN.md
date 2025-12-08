# 📋 Microsoft Teams Authentication & Enhanced Timesheet Implementation Plan

## 🎯 Objective
Transform the existing timesheet application to include Microsoft Teams authentication, enhanced employee/admin features, and comprehensive database integration.

## 📊 Current State Analysis
- ✅ React frontend with Vite
- ✅ Node.js backend with MySQL/SQLite support
- ✅ Basic employee management
- ✅ Activity tracking
- ✅ Admin panel
- ✅ Excel export
- ✅ Notification system
- ❌ Microsoft Teams authentication (TO ADD)
- ❌ Role-based access control with Teams (TO ADD)
- ❌ Enhanced admin features with timestamps (TO ENHANCE)

## 🔐 Phase 1: Microsoft Teams Authentication Setup

### 1.1 Azure AD App Registration
**Tasks:**
1. Register application in Azure Portal (https://portal.azure.com)
2. Configure redirect URIs for local and production
3. Set up API permissions:
   - `User.Read` (Read user profile)
   - `email` (Access user's email)
   - `openid` (Sign in and read user profile)
   - `profile` (View user's basic profile)
4. Generate Client ID and Client Secret
5. Store credentials in `.env` file

**Required Environment Variables:**
```env
MSAL_CLIENT_ID=your_client_id
MSAL_TENANT_ID=your_tenant_id
MSAL_CLIENT_SECRET=your_client_secret
MSAL_REDIRECT_URI=http://localhost:3000/auth/callback
```

### 1.2 Install Required Dependencies

**Frontend:**
```bash
cd client
npm install @azure/msal-browser @azure/msal-react
```

**Backend:**
```bash
npm install @azure/msal-node passport passport-azure-ad jsonwebtoken
```

## 🗄️ Phase 2: Database Schema Enhancement

### 2.1 Update Database Tables

**New `users` table structure:**
```sql
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    azure_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    teams_name VARCHAR(255) NOT NULL,
    role ENUM('employee', 'admin') DEFAULT 'employee',
    department VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME,
    is_active BOOLEAN DEFAULT TRUE
);
```

**Update `employees` table to link with users:**
```sql
ALTER TABLE employees ADD COLUMN user_id INT;
ALTER TABLE employees ADD FOREIGN KEY (user_id) REFERENCES users(id);
```

**Enhanced `activities` table with user tracking:**
```sql
ALTER TABLE activities ADD COLUMN created_by_user_id INT;
ALTER TABLE activities ADD COLUMN updated_by_user_id INT;
ALTER TABLE activities ADD COLUMN created_at_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE activities ADD COLUMN updated_at_timestamp DATETIME ON UPDATE CURRENT_TIMESTAMP;
```

**New `admin_actions` table for audit trail:**
```sql
CREATE TABLE admin_actions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_user_id INT NOT NULL,
    action_type ENUM('add', 'edit', 'delete', 'remind') NOT NULL,
    target_employee_id VARCHAR(255),
    target_date VARCHAR(50),
    target_timeslot VARCHAR(50),
    old_value TEXT,
    new_value TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_user_id) REFERENCES users(id)
);
```

## 🔨 Phase 3: Backend Implementation

### 3.1 Authentication Middleware (`server/middleware/auth.js`)
- JWT token verification
- Role-based access control
- Teams user validation

### 3.2 Updated API Routes

**Authentication Routes:**
- `POST /api/auth/teams-login` - Initiate Teams OAuth
- `GET /api/auth/callback` - Handle OAuth callback
- `POST /api/auth/verify` - Verify JWT token
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/profile` - Get user profile

**Enhanced Employee Routes:**
- `GET /api/employees/me` - Get current user's employee data
- `PUT /api/employees/me/activities` - Update own activities only

**Enhanced Admin Routes:**
- `GET /api/admin/timesheets` - Get all employee timesheets
- `POST /api/admin/timesheets/:employeeId/:date/:slot` - Add entry
- `PUT /api/admin/timesheets/:id` - Edit entry (with timestamp)
- `DELETE /api/admin/timesheets/:id` - Delete entry (with timestamp)
- `POST /api/admin/remind/:employeeId` - Send reminder
- `GET /api/admin/export` - Export with filters
- `GET /api/admin/audit-log` - View all admin actions

## ⚛️ Phase 4: Frontend Implementation

### 4.1 Microsoft Teams Login Component (`client/src/components/TeamsLogin.jsx`)
Features:
- "Sign in with Microsoft" button
- Automatic SSO flow
- Display name extraction from Teams profile
- Redirect after successful login

### 4.2 Enhanced Dashboard (`client/src/pages/Dashboard.jsx`)
Employee Features:
- Display logged-in user's Teams name
- Lock other employees' rows (read-only)
- Only allow editing own timesheet
- Show all 13 time slots:
  - 9:00-10:00, 10:00-11:00, 11:00-11:10, 11:10-12:00
  - 12:00-01:00, 01:00-01:40, 01:40-03:00, 03:00-03:50
  - 03:50-04:00, 04:00-05:00, 05:00-06:00, 06:00-07:00, 07:00-08:00
- Activity types: Work, Break, Lunch, Leave, Permission
- Pages tracking: Proof Reading, Epub Process, Calibrai
- Full day leave marking
- Real-time status updates

### 4.3 Enhanced Admin Panel (`client/src/pages/AdminPanel.jsx`)
Admin Features:
- View all employees' timesheets in table format
- Each cell shows:
  - Activity type
  - Description
  - Pages done
  - Timestamp (when created/modified)
  - Employee name who created/modified
- Action buttons on each entry:
  - ✏️ Edit (opens modal)
  - 🗑️ Delete (with confirmation)
  - 🔔 Remind employee
- Filter controls:
  - By employee (dropdown)
  - By date range (date picker)
  - By activity type
- Export button with date-wise filtering
- Audit log section showing all admin actions

### 4.4 Activity Modal Enhancements (`client/src/components/ActivityModal.jsx`)
- Show timestamp for existing activities
- Display "Last modified by [Name] on [Date/Time]"
- Validation for required fields
- Auto-fill Pages tracking fields based on activity type

### 4.5 Admin Action Modal (`client/src/components/AdminActionModal.jsx`) - NEW
For editing/adding entries from admin panel:
- Employee selector (if adding new)
- Date selector
- Time slot selector
- Activity type dropdown
- Description field
- Pages done tracking
- Timestamp display
- Save button (records admin action)

## 📱 Phase 5: Feature Enhancements

### 5.1 Time Slot Management
- Hardcoded 13 time slots (as specified)
- Auto-populate default "LUNCH" for 01:00-01:40 slot
- Disable editing for lunch slot (or make it editable based on business logic)

### 5.2 Reminder System Enhancement
- Admin can send reminder via:
  - Browser notification (if permission granted)
  - In-app notification
  - Email (optional feature)
- Track reminder history in database
- Show reminder status ("Sent", "Pending", "Read")

### 5.3 Real-time Updates
- Use WebSocket or polling for live updates
- Show indicator when another user is editing
- Auto-refresh timesheet when changes detected

### 5.4 Export Enhancements
- Date-wise filtering
- Employee-wise filtering
- Include timestamps in Excel export
- Show admin actions in separate sheet
- Format cells with colors based on activity type

## 🎨 Phase 6: UI/UX Improvements

### 6.1 Responsive Design
- Mobile-friendly timesheet table (horizontal scroll)
- Touch-friendly buttons
- Collapsible sections on mobile

### 6.2 Visual Indicators
- Color coding for activity types:
  - 🟢 Work: Green
  - 🟡 Break: Yellow
  - 🟠 Lunch: Orange
  - 🔴 Leave: Red
  - 🔵 Permission: Blue
- Timestamp badges
- "Edited by Admin" badge

### 6.3 Loading States
- Skeleton loaders for timesheet table
- Progress indicators for exports
- Optimistic UI updates

## 🔒 Phase 7: Security & Authorization

### 7.1 Role-Based Access Control
- Employee role: Can only edit own timesheet
- Admin role: Can edit all timesheets + admin actions
- Backend validation on all routes
- Frontend UI restrictions

### 7.2 Data Validation
- Validate time slot format
- Validate activity types
- Prevent duplicate entries for same slot
- Validate pages done (numeric only)

### 7.3 Audit Trail
- Log all admin actions
- Log all employee timesheet edits
- Include IP address and user agent
- Permanent storage (no deletion)

## 📦 Phase 8: Deployment Considerations

### 8.1 Environment Configuration
- Separate `.env` files for dev/prod
- Azure AD app registration for production domain
- Production database credentials
- CORS configuration for production URLs

### 8.2 Build Process
- Frontend build: `npm run build` in client folder
- Backend serves static files from `client/dist`
- Environment-specific builds

### 8.3 Migration Script
- Script to migrate existing users to Teams authentication
- Map existing employee names to Teams accounts
- Preserve historical data

## 📋 Implementation Checklist

### Backend Tasks
- [ ] Set up Azure AD app registration
- [ ] Install MSAL dependencies
- [ ] Create authentication middleware
- [ ] Update database schema
- [ ] Create migration scripts
- [ ] Implement auth routes
- [ ] Update employee routes with authorization
- [ ] Create admin routes with audit logging
- [ ] Implement reminder API
- [ ] Enhance export API with filters

### Frontend Tasks
- [ ] Install MSAL React dependencies
- [ ] Create MSAL configuration
- [ ] Build TeamsLogin component
- [ ] Update App.jsx with MSAL provider
- [ ] Enhance Dashboard with read-only restrictions
- [ ] Build enhanced AdminPanel with table view
- [ ] Create AdminActionModal component
- [ ] Update ActivityModal with timestamps
- [ ] Implement real-time updates
- [ ] Add filter controls
- [ ] Update export functionality
- [ ] Add visual indicators and badges
- [ ] Implement responsive design
- [ ] Add loading states

### Testing Tasks
- [ ] Test Teams login flow
- [ ] Test employee restrictions (can only edit own)
- [ ] Test admin CRUD operations
- [ ] Test reminder system
- [ ] Test export with filters
- [ ] Test real-time updates
- [ ] Test mobile responsiveness
- [ ] Test audit trail logging
- [ ] Cross-browser testing
- [ ] Performance testing with large datasets

## 🚀 Execution Order

1. **Week 1: Authentication Foundation**
   - Azure AD setup
   - Backend auth implementation
   - Frontend login component

2. **Week 2: Database & Authorization**
   - Database schema updates
   - Migration scripts
   - Role-based authorization

3. **Week 3: Employee Features**
   - Enhanced Dashboard
   - Time slot management
   - Activity restrictions

4. **Week 4: Admin Features**
   - Admin panel table view
   - CRUD operations with audit
   - Reminder system

5. **Week 5: Polish & Testing**
   - Export enhancements
   - Real-time updates
   - UI/UX improvements
   - Comprehensive testing

## 📝 Notes

- Keep existing SQLite/MySQL dual support
- Maintain backward compatibility where possible
- Document all API changes
- Create user guides for Teams authentication setup
- Consider adding Teams bot for notifications (future enhancement)
- Consider Teams tab integration (future enhancement)

---

**Last Updated:** December 7, 2025
**Status:** Ready for Implementation
