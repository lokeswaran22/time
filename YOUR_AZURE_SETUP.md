# 🔐 Your Azure AD Configuration - Pristonix-Timesheet

## ✅ Step 1: Azure AD App Registration (COMPLETED)

You've successfully registered your application:
- **Application Name:** Pristonix-Timesheet
- **Application (client) ID:** `80a7b35f-d491-45a6-af13-43f04978769e`
- **Directory (tenant) ID:** `2b0177a8-9e13-44d2-877e-8332922e4b83`

## 📋 Next Steps to Enable Microsoft Teams Login

### Step 2: Generate Client Secret

1. **Go to Azure Portal:**
   - Navigate to: https://portal.azure.com
   - Go to: Azure Active Directory → App registrations → Pristonix-Timesheet

2. **Create Client Secret:**
   - Click on "Certificates & secrets" in the left menu
   - Click "+ New client secret"
   - Description: `Timesheet Backend Secret`
   - Expires: Choose 6 months or 1 year
   - Click "Add"
   - **IMPORTANT:** Copy the SECRET VALUE immediately (not the Secret ID)

### Step 3: Configure API Permissions

1. **In Azure Portal:**
   - Go to: API permissions
   - Click "+ Add a permission"
   - Select "Microsoft Graph"
   - Select "Delegated permissions"

2. **Add these permissions:**
   - ✅ `User.Read` - Sign users in and read user profile
   - ✅ `email` - View users' email address
   - ✅ `openid` - Sign users in
   - ✅ `profile` - View users' basic profile

3. **Grant Admin Consent:**
   - Click "Grant admin consent for [Your Organization]"
   - Click "Yes" to confirm

### Step 4: Configure Redirect URIs

1. **Go to Authentication:**
   - Click "Authentication" in the left menu
   - Under "Platform configurations" → "Single-page application"
   - Click "+ Add a platform" if not already added
   - Select "Single-page application"

2. **Add Redirect URIs:**
   - Add: `http://localhost:3000`
   - Check ✅ "Access tokens"
   - Check ✅ "ID tokens"
   - Click "Configure"

3. **For Production (when deploying):**
   - Add your production URL: `https://your-domain.com`

### Step 5: Update Backend Environment (.env)

Create or edit `e:\github\Timesheet\.env` file:

```env
# Server Configuration
PORT=3000

# Microsoft Teams / Azure AD Configuration
MSAL_CLIENT_ID=80a7b35f-d491-45a6-af13-43f04978769e
MSAL_TENANT_ID=2b0177a8-9e13-44d2-877e-8332922e4b83
MSAL_CLIENT_SECRET=<PASTE_YOUR_CLIENT_SECRET_HERE>
MSAL_REDIRECT_URI=http://localhost:3000
JWT_SECRET=7f8a2e4d9c1b6e3f5a8d7c2b9e4f1a6d3c7b5e8f2a9d6c3b7e5f8a1d4c6b9e2f

# MySQL Configuration (optional)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=timesheet_db
```

**⚠️ Replace `<PASTE_YOUR_CLIENT_SECRET_HERE>` with the secret you copied from Azure Portal**

### Step 6: Update Frontend Environment (client/.env)

Create or edit `e:\github\Timesheet\client\.env` file:

```env
# Microsoft Teams Configuration
VITE_MSAL_CLIENT_ID=80a7b35f-d491-45a6-af13-43f04978769e
VITE_MSAL_TENANT_ID=2b0177a8-9e13-44d2-877e-8332922e4b83
VITE_MSAL_REDIRECT_URI=http://localhost:3000
VITE_API_BASE_URL=http://localhost:3000
```

### Step 7: Rebuild and Restart

1. **Rebuild the React frontend:**
   ```bash
   cd e:\github\Timesheet\client
   npm run build
   cd ..
   ```

2. **Restart the server:**
   ```bash
   # Stop current server (Ctrl+C in terminal)
   # Then restart:
   node server-teams-sqlite.js
   ```

   OR just run:
   ```bash
   START-TEAMS.bat
   ```

### Step 8: Test Microsoft Teams Login

1. **Open browser:**
   ```
   http://localhost:3000/teams-login
   ```

2. **Click "Sign in with Microsoft Teams"** button

3. **You'll be redirected to Microsoft login**
   - Sign in with your work/school account
   - Grant permissions when prompted
   - You'll be redirected back to the app

4. **Success!**
   - Your Teams display name will be automatically used
   - You're now logged in with Microsoft authentication

## 🎯 Quick Command Reference

### To edit .env files:
```bash
# Backend
notepad e:\github\Timesheet\.env

# Frontend
notepad e:\github\Timesheet\client\.env
```

### To rebuild and restart:
```bash
cd e:\github\Timesheet
cd client
npm run build
cd ..
node server-teams-sqlite.js
```

## ✅ Verification Checklist

- [ ] Client Secret created in Azure Portal
- [ ] Client Secret copied and saved
- [ ] API permissions added (User.Read, email, openid, profile)
- [ ] Admin consent granted for permissions
- [ ] Redirect URI configured (http://localhost:3000)
- [ ] Backend `.env` file updated with all credentials
- [ ] Frontend `client\.env` file updated with client ID and tenant ID
- [ ] React frontend rebuilt (`npm run build`)
- [ ] Server restarted
- [ ] Can access http://localhost:3000/teams-login
- [ ] "Sign in with Microsoft Teams" button shows (not Demo Mode)
- [ ] Teams login works and redirects back successfully

## 🆘 Troubleshooting

### Issue: Still showing "Demo Mode"
**Solution:** 
- Verify `VITE_MSAL_CLIENT_ID` is set in `client\.env`
- Rebuild frontend: `cd client && npm run build`
- Restart server

### Issue: "Redirect URI mismatch"
**Solution:**
- Go to Azure AD → Authentication
- Ensure `http://localhost:3000` is listed as redirect URI
- Platform should be "Single-page application"

### Issue: "Need admin approval"
**Solution:**
- Go to Azure AD → API permissions
- Click "Grant admin consent"
- Or contact your IT administrator

### Issue: Login works but shows error after redirect
**Solution:**
- Check backend `.env` has correct `MSAL_CLIENT_SECRET`
- Check `JWT_SECRET` is set
- Restart the server

## 📞 Current Status

✅ **Azure AD App Registered**  
⏳ **Next:** Generate Client Secret  
⏳ **Next:** Configure API Permissions  
⏳ **Next:** Update .env files  
⏳ **Next:** Test Teams Login

## 🎉 Once Complete

You'll have a fully functional timesheet application with:
- ✨ Microsoft Teams SSO authentication
- ✨ Automatic employee names from Teams profiles
- ✨ Secure OAuth 2.0 authentication
- ✨ Role-based access control
- ✨ Production-ready security

---

**Need Help?** Refer to the complete guide: `AZURE_AD_SETUP_GUIDE.md`

**Your personalized setup** | **Generated: December 7, 2025**
