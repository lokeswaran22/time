# 🔐 Microsoft Teams Authentication Setup Guide

This guide will walk you through setting up Microsoft Teams authentication for the Timesheet application using Azure Active Directory (Azure AD).

## 📋 Prerequisites

- An Azure account with access to Azure Portal
- Admin privileges to register an app in Azure AD
- Node.js installed (v14 or higher)

## 🚀 Step-by-Step Setup

### Step 1: Register Application in Azure Portal

1. **Go to Azure Portal**
   - Navigate to [https://portal.azure.com](https://portal.azure.com)
   - Sign in with your Microsoft account

2. **Navigate to Azure Active Directory**
   - Click on "Azure Active Directory" from the left sidebar
   - OR search for "Azure Active Directory" in the top search bar

3. **Register New Application**
   - Click on "App registrations" in the left menu
   - Click "+ New registration" button

4. **Fill in Application Details**
   ```
   Name: Timesheet Tracker
   Supported account types: Accounts in this organizational directory only (Single tenant)
   Redirect URI: 
     - Platform: Single-page application (SPA)
     - URL: http://localhost:3000
   ```

5. **Click "Register"**

### Step 2: Configure API Permissions

1. **Go to API permissions**
   - In your app's page, click "API permissions" from the left menu

2. **Add Microsoft Graph Permissions**
   - Click "+ Add a permission"
   - Select "Microsoft Graph"
   - Select "Delegated permissions"
   - Add the following permissions:
     - ✅ `User.Read` - Sign users in and read user profile
     - ✅ `email` - View users' email address
     - ✅ `openid` - Sign users in
     - ✅ `profile` - View users' basic profile

3. **Grant Admin Consent**
   - Click "Grant admin consent for [Your Organization]"
   - Click "Yes" to confirm

### Step 3: Get Application Credentials

1. **Get Client ID**
   - Go to "Overview" page of your app
   - Copy the **Application (client) ID**
   - Save this as `MSAL_CLIENT_ID`

2. **Get Tenant ID**
   - Still on the "Overview" page
   - Copy the **Directory (tenant) ID**
   - Save this as `MSAL_TENANT_ID`

3. **Create Client Secret** (for backend authentication)
   - Click on "Certificates & secrets" from the left menu
   - Click "+ New client secret"
   - Description: `Timesheet Backend`
   - Expires: Choose based on your security policy (recommended: 6 months or 1 year)
   - Click "Add"
   - **IMPORTANT**: Copy the secret **VALUE** immediately (not the Secret ID)
   - Save this as `MSAL_CLIENT_SECRET`

### Step 4: Configure Redirect URIs

1. **Add Development URI**
   - Go to "Authentication" section
   - Under "Platform configurations" > "Single-page application"
   - Add: `http://localhost:3000`
   - Check ✅ "Access tokens" and ✅ "ID tokens"

2. **Add Production URI** (when deploying)
   - Add your production URL: `https://your-production-domain.com`
   - Check the same token options

3. **Click "Save"**

### Step 5: Configure Environment Variables

#### Backend (.env)

Create or update `e:\github\Timesheet\.env`:

```env
# Server Configuration
PORT=3000

# Microsoft Teams / Azure AD Configuration
MSAL_CLIENT_ID=<paste_your_client_id_here>
MSAL_TENANT_ID=<paste_your_tenant_id_here>
MSAL_CLIENT_SECRET=<paste_your_client_secret_here>
MSAL_REDIRECT_URI=http://localhost:3000
JWT_SECRET=<generate_a_random_secret_string>

# MySQL Configuration (optional)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=timesheet_db
```

**Generate JWT Secret:**
```bash
# Use Node.js to generate a random secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### Frontend (client/.env)

Create `e:\github\Timesheet\client\.env`:

```env
# Microsoft Teams Configuration
VITE_MSAL_CLIENT_ID=<paste_your_client_id_here>
VITE_MSAL_TENANT_ID=<paste_your_tenant_id_here>
VITE_MSAL_REDIRECT_URI=http://localhost:3000
VITE_API_BASE_URL=http://localhost:3000
```

### Step 6: Test the Configuration

1. **Start the Application**

   ```bash
   # In the root directory
   npm start
   ```

   This will:
   - Build the React frontend
   - Start the Node.js backend on port 3000

2. **Access the Application**

   - Open browser: `http://localhost:3000`
   - You should see the login page
   - Click "Sign in with Microsoft Teams"

3. **First Time Sign-In**
   - You'll be redirected to Microsoft login
   - Sign in with your work/school account
   - Grant permissions when prompted
   - You'll be redirected back to the timesheet app

## 🧪 Demo Mode (No Azure AD Required)

If you haven't set up Azure AD yet, the app will automatically run in **Demo Mode**:

- Use any email address to sign in
- Email addresses containing "admin" will get admin role
- No actual Microsoft authentication - for testing only

To use Demo Mode:
- Simply don't configure the `MSAL_CLIENT_ID` in `.env` files
- OR set it to `YOUR_CLIENT_ID_HERE`

## ✅ Verification Checklist

- [ ] Azure AD app registered
- [ ] API permissions configured and admin consent granted
- [ ] Client ID copied to both backend and frontend `.env` files
- [ ] Tenant ID copied to both `.env` files
- [ ] Client Secret copied to backend `.env` file
- [ ] JWT Secret generated and added to backend `.env` file
- [ ] Redirect URIs configured in Azure AD
- [ ] Application starts without errors
- [ ] Can sign in with Microsoft Teams account
- [ ] User profile data loads correctly

## 🔧 Troubleshooting

### Issue: "Invalid client" error

**Solution:**
- Verify `MSAL_CLIENT_ID` is correct
- Check that the client ID matches the Azure AD app

### Issue: "Redirect URI mismatch" error

**Solution:**
- Go to Azure AD app > Authentication
- Ensure `http://localhost:3000` is listed under Redirect URIs
- Make sure it's configured as "Single-page application" platform

### Issue: "Need admin approval" message

**Solution:**
- The API permissions need admin consent
- Go to Azure AD app > API permissions
- Click "Grant admin consent"

### Issue: Can't grant admin consent

**Solution:**
- You need Azure AD admin privileges
- Contact your IT administrator
- OR use Demo Mode for development

### Issue: Token expires too quickly

**Solution:**
- JWT tokens expire after 24 hours by default
- User will need to login again
- This is normal security behavior

## 📚 Additional Resources

- [Azure AD Documentation](https://docs.microsoft.com/en-us/azure/active-directory/)
- [MSAL.js Documentation](https://github.com/AzureAD/microsoft-authentication-library-for-js)
- [Microsoft Graph API](https://docs.microsoft.com/en-us/graph/)

## 🔒 Security Best Practices

1. **Never commit `.env` files to Git**
   - They contain sensitive credentials
   - Use `.env.example` as a template

2. **Rotate Client Secrets Regularly**
   - Set expiration dates on secrets
   - Update before expiry

3. **Use HTTPS in Production**
   - Never use HTTP for authentication in production
   - Update redirect URIs to `https://`

4. **Limit Access Permissions**
   - Only request the minimum required Microsoft Graph permissions
   - Review permissions regularly

5. **Implement Token Refresh**
   - Tokens should expire
   - Implement proper refresh logic

## 📞 Support

If you encounter issues:
1. Check the console for error messages
2. Verify all environment variables are set
3. Ensure Azure AD configuration matches the guide
4. Check network connectivity
5. Review Azure AD audit logs

---

**Setup Complete!** 🎉

Your timesheet application now supports Microsoft Teams authentication. Users can sign in with their work accounts, and their Teams display name will be automatically used in the application.

**Next Steps:**
- Test with different user accounts
- Configure employee roles (admin vs employee)
- Set up production deployment with HTTPS
- Configure additional Teams integration features
