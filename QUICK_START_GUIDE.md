# 🚦 Quick Start Guide - Microsoft Teams Timesheet

## 🎯 Choose Your Path

### Path A: Demo Mode (No Azure AD Needed) - **Recommended for Testing**
### Path B: Production Mode (Microsoft Teams Integration)

---

## 🟢 Path A: Demo Mode Quick Start

**Perfect for: Testing, Development, Proof of Concept**

### Step 1: Open Terminal in Project Folder
```bash
cd e:\github\Timesheet
```

### Step 2: Run theStartup Script

**Double-click:**
```
START-TEAMS.bat
```

OR

**Command line:**
```bash
START-TEAMS.bat
```

### Step 3: Wait for Server to Start

You'll see:
```
✅ Connected to SQLite database
✅ Database tables initialized
🚀 Server running with Microsoft Teams Authentication!
📍 Local: http://localhost:3000
```

### Step 4: Open Browser
```
http://localhost:3000/teams-login
```

### Step 5: Login

#### For Admin Access:
```
Email: admin@company.com
Name: Admin User (optional)
```
Click "Sign In"

#### For Employee Access:
```
Email: john.doe@company.com
Name: John Doe (optional)
```
Click "Sign In"

### Step 6: Explore!

**As Employee:**
1. See your personal timesheet
2. Click on any time slot
3. Select activity type (Work, Break, Lunch, etc.)
4. Fill in details
5. Save
6. View activity history in right panel

**As Admin:**
1. Click "Admin Panel" button in header
2. See all employees' timesheets
3. Edit/Delete any entry
4. Send reminders
5. Export to Excel

---

## 🔵 Path B: Production Mode (Microsoft Teams)

**Perfect for: Production deployment with real Teams authentication**

### Step 1: Azure AD App Registration

Follow the complete guide:
```
📖 Open: AZURE_AD_SETUP_GUIDE.md
```

**Quick summary:**
1. Go to https://portal.azure.com
2. Azure Active Directory → App registrations → New registration
3. Configure redirect URI: `http://localhost:3000` (or your production URL)
4. Set API permissions: User.Read, email, profile, openid
5. Generate client secret
6. Copy: Client ID, Tenant ID, Client Secret

### Step 2: Configure Backend Environment

Create `.env` file in root folder:

```env
# Copy from .env.example
MSAL_CLIENT_ID=<your_azure_client_id>
MSAL_TENANT_ID=<your_azure_tenant_id>
MSAL_CLIENT_SECRET=<your_azure_client_secret>
MSAL_REDIRECT_URI=http://localhost:3000
JWT_SECRET=<generate_random_string>
```

**Generate JWT Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 3: Configure Frontend Environment

Create `client\.env` file:

```env
VITE_MSAL_CLIENT_ID=<your_azure_client_id>
VITE_MSAL_TENANT_ID=<your_azure_tenant_id>
VITE_MSAL_REDIRECT_URI=http://localhost:3000
VITE_API_BASE_URL=http://localhost:3000
```

### Step 4: Build and Run

```bash
# Install dependencies
npm install
cd client
npm install
cd ..

# Run migration
node migrate-teams-auth.js

# Build frontend
cd client
npm run build
cd ..

# Start server
node server-teams-sqlite.js
```

### Step 5: Access Application
```
http://localhost:3000/teams-login
```

### Step 6: Login with Microsoft Teams

1. Click "Sign in with Microsoft Teams"
2. Authenticate with your work/school account
3. Grant permissions when prompted
4. Automatically redirected to dashboard
5. Your Teams display name is used automatically!

---

## 📋 Quick Reference Card

### Demo Mode Login Examples

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@company.com | None (Demo) |
| Admin | admin@pristonix.com | None (Demo) |
| Employee | john@company.com | None (Demo) |
| Employee | sarah@company.com | None (Demo) |

### Time Slots
```
09:00-10:00  →  Morning Work
10:00-11:00  →  Morning Work
11:00-11:10  →  Tea Break
11:10-12:00  →  Pre-Lunch
12:00-01:00  →  Work
01:00-01:40  →  LUNCH 🍽️
01:40-03:00  →  Afternoon
03:00-03:50  →  Afternoon
03:50-04:00  →  Tea Break
04:00-05:00  →  Evening
05:00-06:00  →  Evening
06:00-07:00  →  Overtime
07:00-08:00  →  Overtime
```

### Activity Types
- 🟢 **Work** - Regular work with description and pages
- 🟡 **Break** - Short breaks
- 🟠 **Lunch** - Meal time (default 01:00-01:40)
- 🔴 **Leave** - Full/partial day off
- 🔵 **Permission** - Personal time off

### Pages Tracking Options
- 📖 **Proof Reading** - Editing, reviewing, and checking content  
- 📱 **Epub Process** - E-book conversion and formatting  
- 🎨 **Calibrai** - Graphics, layout, and calibration work

---

## 🎬 Usage Scenarios

### Scenario 1: Employee Fills Daily Timesheet

1. **Login**: `employee1@company.com`
2. **Dashboard**: See today's date and 13 time slots
3. **Click 9:00-10:00 slot**
4. **Select**: Activity = Work, Type = Proof Reading
5. **Enter**: Description = "Reviewing Chapter 5", Pages = 15
6. **Save**: Entry appears in table with green background
7. **Activity Tracker**: Shows "Employee1 added WORK: Proof Reading - Reviewing Chapter 5"
8. **Repeat**: Fill other time slots

### Scenario 2: Employee Marks Leave

1. **Click "Mark Full Day Leave" button**
2. **Confirm**: All slots filled with "LEAVE"
3. **Table**: Entire row shows red "LEAVE" entries
4. **History**: Logged as "Employee1 added LEAVE for [date]"

### Scenario 3: Admin Edits Someone's Timesheet

1. **Login**: `admin@company.com`
2. **Dashboard**: See all employees
3. **Click Admin Panel button**
4. **Select**: Date and Employee filter
5. **Find entry**: Employee1's 9:00-10:00 slot
6. **Click Edit icon**
7. **Modify**: Change pages from 15 to 20
8. **Save**: Entry shows "Modified by Admin User on [timestamp]"
9. **Audit Log**: Records "Admin User edited time slot 9:00-10:00 for Employee1"

### Scenario 4: Admin Sends Reminder

1. **Admin Panel**: Navigate to reminders section
2. **Select Employee**: Choose "Employee1"
3. **Choose Date**: Today's date
4. **Message**: "Please complete your timesheet"
5. **Send**: Reminder logged and notification sent
6. **History**: Shows in admin actions log

### Scenario 5: Export to Excel

1. **Admin Panel** OR **Dashboard**
2. **Select Date**: 2025-12-07
3. **Select Employee** (optional): Leave blank for all
4. **Click Export to Excel**
5. **Download**: Timesheet_2025-12-07.xlsx
6. **Open Excel**: See formatted timesheet with all data

---

## 🆘 Troubleshooting

### Problem: "Port 3000 already in use"

**Solution 1**: Kill the existing process
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <process_id> /F
```

**Solution 2**: Change port in `.env`
```env
PORT=3001
```

### Problem: "Cannot find module"

**Solution**: Reinstall dependencies
```bash
npm install
cd client
npm install
```

### Problem: "Database locked"

**Solution**: Close all running instances
```bash
# Stop all Node processes
taskkill /IM node.exe /F

# Restart
START-TEAMS.bat
```

### Problem: "Teams login not working"

**Check:**
1. ✅ Azure AD Client ID configured correctly
2. ✅ Redirect URI matches in Azure Portal
3. ✅ Internet connection active
4. ★ **Try Demo Mode instead** if Azure AD not needed

### Problem: "Cannot edit timesheet"

**Possible Reasons:**
- You're an employee trying to edit another employee's sheet → **This is by design**
- Login as admin to edit all timesheets
- OR, make sure you're editing your own assigned employee row

---

## 📊 Feature Matrix

| Feature | Employee | Admin |
|---------|----------|-------|
| View own timesheet | ✅ | ✅ |
| Edit own timesheet | ✅ | ✅ |
| View others' timesheets | ✅ (Read-only) | ✅ |
| Edit others' timesheets | ❌ | ✅ |
| Delete any entry | ❌ | ✅ |
| Send reminders | ❌ | ✅ |
| Export to Excel | ✅ | ✅ |
| View audit log | ❌ | ✅ |
| Access Admin Panel | ❌ | ✅ |

---

## 🎓 Tips & Best Practices

### For Employees:
1. ⏰ Fill timesheet at the end of each time slot
2. 📝 Be specific in descriptions
3. 📊 Track pages accurately for productivity reports
4. 🔔 Enable browser notifications for reminders
5. 📅 Mark leave in advance

### For Admins:
1. 👀 Review timesheets daily
2. 🔔 Send reminders to late submitters
3. 📤 Export data weekly for records
4. 📋 Check audit log for discrepancies
5. 🔐 Maintain data security (keep credentials safe)

---

## 📞 Need Help?

📖 **Read the full guides:**
- `README_TEAMS.md` - Complete feature documentation
- `AZURE_AD_SETUP_GUIDE.md` - Azure AD configuration
- `IMPLEMENTATION_SUMMARY.md` - Technical details

💡 **Common Questions:**

**Q: Do I need Microsoft Teams to use this?**
A: No! Demo Mode works without Teams. Teams authentication is optional for production.

**Q: Can employees see each other's timesheets?**
A: Yes, but read-only. They can only edit their own.

**Q: How do I make someone an admin?**
A: In Demo Mode, use email containing "admin". In Production, update the `role` field in database `users` table.

**Q: Where is the data stored?**
A: In `timesheet.db` (SQLite database) in the project root folder.

**Q: Can I use MySQL instead?**
A: Yes! Use `server.js` instead and configure MySQL in `.env` file.

---

## ✅ Quick Checklist

**Before First Use:**
- [ ] Node.js installed (v14+)
- [ ] Project dependencies installed (`npm install`)
- [ ] Database migrated (`node migrate-teams-auth.js`)
- [ ] Client built (`cd client && npm run build`)
- [ ] Environment configured (`.env` files) OR use Demo Mode

**Every Time You Start:**
- [ ] Run `START-TEAMS.bat` OR `node server-teams-sqlite.js`
- [ ] Wait for "Server running" message
- [ ] Open `http://localhost:3000/teams-login`
- [ ] Login and start tracking!

---

## 🚀 You're Ready!

**Follow Path A (Demo Mode) to start immediately!**

**Need production Teams authentication? Follow Path B with the Azure AD guide.**

**Happy Time Tracking! ⏱️📊**

---

**Quick Start Guide** | **Version 2.0 - Teams Edition** | **Updated: December 2025**
