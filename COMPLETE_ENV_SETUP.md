# 🔧 Complete Environment Configuration

## Your Azure AD Credentials:
- Client ID: `80a7b35f-d491-45a6-af13-43f04978769e`
- Tenant ID: `2b0177a8-9e13-44d2-877e-8332922e4b83`
- Client Secret: **[The secret you copied from Azure Portal]**

---

## ✅ Step 1: Complete Backend .env File

**Open this file in Notepad:**
```
e:\github\Timesheet\.env
```

**Delete everything and paste this COMPLETE content:**

```
PORT=3000

MSAL_CLIENT_ID=80a7b35f-d491-45a6-af13-43f04978769e
MSAL_TENANT_ID=2b0177a8-9e13-44d2-877e-8332922e4b83
MSAL_CLIENT_SECRET=PASTE_YOUR_COPIED_SECRET_HERE
MSAL_REDIRECT_URI=http://localhost:3000
JWT_SECRET=7f8a2e4d9c1b6e3f5a8d7c2b9e4f1a6d3c7b5e8f2a9d6c3b7e5f8a1d4c6b9e2f

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=timesheet_db
```

**⚠️ IMPORTANT:** Replace `PASTE_YOUR_COPIED_SECRET_HERE` with the actual secret value you copied!

**Save and close Notepad**

---

## ✅ Step 2: Verify Frontend .env File

**This file should already be correct:**
```
e:\github\Timesheet\client\.env
```

**Should contain:**
```
VITE_MSAL_CLIENT_ID=80a7b35f-d491-45a6-af13-43f04978769e
VITE_MSAL_TENANT_ID=2b0177a8-9e13-44d2-877e-8332922e4b83
VITE_MSAL_REDIRECT_URI=http://localhost:3000
VITE_API_BASE_URL=http://localhost:3000
```

This looks correct! ✅

---

## ✅ Step 3: Rebuild and Restart

**Open Command Prompt and run these commands:**

```cmd
cd e:\github\Timesheet

REM Kill any running servers
taskkill /F /IM node.exe

REM Rebuild frontend
cd client
npm run build
cd ..

REM Start server
node server-teams-sqlite.js
```

---

## ✅ Step 4: Open in Browser

Once the server is running, open:
```
http://localhost:3000/teams-login
```

---

## 🎯 What You'll See:

**If Configured Correctly:**
- Beautiful purple/blue gradient background
- "Pristonix" branding with logo
- **"Sign in with Microsoft Teams"** button (purple button with Teams icon)
- NO "Demo Mode" warning

**If Still Demo Mode:**
- Yellow/orange "Demo Mode" warning box
- Email and Name input fields
- This means the `.env` file needs the secret pasted correctly

---

## 🆘 Quick Commands:

**Open backend .env file:**
```cmd
notepad e:\github\Timesheet\.env
```

**Check if secret is set:**
```cmd
cd e:\github\Timesheet
findstr "MSAL_CLIENT_SECRET" .env
```

Should show your secret (not "PASTE_YOUR_COPIED_SECRET_HERE")

---

**Generated:** December 7, 2025
**For:** Pristonix-Timesheet Application
