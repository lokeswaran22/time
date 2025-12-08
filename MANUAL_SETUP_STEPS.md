# ✅ Azure AD Configuration - Manual Steps

## Your App Details:
- **App Name:** Pristonix-Timesheet
- **Client ID:** `80a7b35f-d491-45a6-af13-43f04978769e`
- **Tenant ID:** `2b0177a8-9e13-44d2-877e-8332922e4b83`

---

## 🎯 Complete These 3 Quick Steps in Azure Portal:

### ✅ **STEP 1: Verify/Add Redirect URI** (On current page: Authentication)

**You're already on the Authentication page!** Just do this:

1. Look for "**Platform configurations**" section
2. You should see "**Single-page application**" listed
3. **Click on it** to expand/edit
4. Verify `http://localhost:3000` is listed as Redirect URI
5. Make sure these boxes are **CHECKED**:
   - ✅ **Access tokens** (for implicit grant)
   - ✅ **ID tokens** (for implicit grant)
6. Click "**Save**" at the bottom

**If you don't see Single-page application:**
- Click "+ Add a platform"
- Select "Single-page application"
- Enter: `http://localhost:3000`
- Check both boxes (Access tokens + ID tokens)
- Click "Configure"

---

### ⭐ **STEP 2: Generate Client Secret** (MOST IMPORTANT!)

1. In the left menu, click "**Certificates & secrets**"
2. Under "Client secrets" section, click "+ **New client secret**"
3. Description: `Timesheet Backend`
4. Expires: Select "**6 months**" or "**12 months**"
5. Click "**Add**"
6. **IMMEDIATELY COPY THE VALUE** (the long string in the "Value" column, NOT the "Secret ID")
   - ⚠️ **You can only see this ONCE!** Copy it now!
7. Save it somewhere safe (you'll need it in next step)

---

### ✅ **STEP 3: Add API Permissions**

1. In the left menu, click "**API permissions**"
2. Click "+ **Add a permission**"
3. Select "**Microsoft Graph**"
4. Select "**Delegated permissions**"
5. Search and check these 4 permissions:
   - ✅ `User.Read`
   - ✅ `email`
   - ✅ `openid`
   - ✅ `profile`
6. Click "**Add permissions**" at the bottom
7. Click "**Grant admin consent for [Your Organization]**" (blue button)
8. Click "**Yes**" to confirm

---

## 📝 **STEP 4: Update Environment Files**

### Backend .env file:

Open Notepad and create this file:
```
Path: e:\github\Timesheet\.env
```

**Paste this content (replace YOUR_SECRET_HERE with the secret you copied):**

```env
# Server Configuration
PORT=3000

# Microsoft Teams / Azure AD Configuration
MSAL_CLIENT_ID=80a7b35f-d491-45a6-af13-43f04978769e
MSAL_TENANT_ID=2b0177a8-9e13-44d2-877e-8332922e4b83
MSAL_CLIENT_SECRET=YOUR_SECRET_HERE
MSAL_REDIRECT_URI=http://localhost:3000
JWT_SECRET=7f8a2e4d9c1b6e3f5a8d7c2b9e4f1a6d3c7b5e8f2a9d6c3b7e5f8a1d4c6b9e2f

# MySQL Configuration (optional)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=timesheet_db
```

**Commands to open in Notepad:**
```cmd
notepad e:\github\Timesheet\.env
```

---

### Frontend client/.env file:

**Paste this content:**

```env
# Microsoft Teams Configuration
VITE_MSAL_CLIENT_ID=80a7b35f-d491-45a6-af13-43f04978769e
VITE_MSAL_TENANT_ID=2b0177a8-9e13-44d2-877e-8332922e4b83
VITE_MSAL_REDIRECT_URI=http://localhost:3000
VITE_API_BASE_URL=http://localhost:3000
```

**Commands to open in Notepad:**
```cmd
notepad e:\github\Timesheet\client\.env
```

---

## 🚀 **STEP 5: Rebuild and Restart**

Open **Command Prompt** in `e:\github\Timesheet` and run:

```cmd
REM Stop current server
taskkill /F /IM node.exe

REM Rebuild React frontend
cd client
npm run build
cd ..

REM Restart server
node server-teams-sqlite.js
```

---

##  🎉 **STEP 6: Test Microsoft Teams Login!**

1. Open browser: **http://localhost:3000/teams-login**

2. You should now see:
   - ✅ "**Sign in with Microsoft Teams**" button (NOT Demo Mode!)
   - 🎨 Teams icon and purple Teams-style button

3. Click "**Sign in with Microsoft Teams**"

4. You'll be redirected to Microsoft login page

5. Sign in with your work account: `lokeswaran.r@pristonix.com`

6. Grant permissions when prompted

7. You'll be redirected back to the timesheet app **logged in!**

8. Your Teams display name will show in the header!

---

## ✅ Checklist:

- [ ] Step 1: Redirect URI configured (http://localhost:3000)
- [ ] Step 1: Access tokens checked
- [ ] Step 1: ID tokens checked
- [ ] Step 1: Saved
- [ ] Step 2: Client secret generated
- [ ] Step 2: Client secret VALUE copied
- [ ] Step 3: API permissions added (4 permissions)
- [ ] Step 3: Admin consent granted
- [ ] Step 4: Backend `.env` file created with secret
- [ ] Step 4: Frontend `client\.env` file created
- [ ] Step 5: Frontend rebuilt (`npm run build`)
- [ ] Step 5: Server restarted
- [ ] Step 6: Tested Teams login successfully!

---

## 🆘 Troubleshooting:

**Still showing "Demo Mode"?**
→ Make sure `VITE_MSAL_CLIENT_ID` is in `client\.env` and you ran `npm run build`

**"Redirect URI mismatch" error?**
→ Double-check redirect URI is exactly `http://localhost:3000` in Azure

**"Need admin approval"?**
→ Click "Grant admin consent" in API permissions

**Login works but error after redirect?**
→ Check backend `.env` has the correct `MSAL_CLIENT_SECRET`

---

**🎯 You're almost there! Just complete these steps and you'll have full Microsoft Teams authentication working!**

---
Generated: December 7, 2025
For app: Pristonix-Timesheet (80a7b35f-d491-45a6-af13-43f04978769e)
