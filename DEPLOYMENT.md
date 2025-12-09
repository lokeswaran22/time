# 🚀 Deployment Guide - Timesheet Tracker

This guide will help you deploy your Timesheet Tracker application to the cloud for free.

## 📋 Prerequisites

- ✅ GitHub repository: https://github.com/lokeswaran22/Timesheet
- ✅ Code pushed to GitHub
- ✅ `client/dist` folder included in repository

## 🌐 Deployment Options

### Option 1: Render.com (Recommended - Free Tier)

Render offers a free tier perfect for this application with automatic deployments from GitHub.

#### Steps:

1. **Sign Up / Log In**
   - Go to [render.com](https://render.com)
   - Sign up with your GitHub account

2. **Create New Web Service**
   - Click **"New +"** → **"Web Service"**
   - Connect your GitHub account if not already connected
   - Select repository: `lokeswaran22/Timesheet`

3. **Configure Service**
   ```
   Name: timesheet-tracker
   Environment: Node
   Region: Choose closest to you
   Branch: main (or master)
   Build Command: npm install
   Start Command: npm start
   ```

4. **Select Plan**
   - Choose **"Free"** plan
   - Click **"Create Web Service"**

5. **Wait for Deployment**
   - Render will automatically build and deploy
   - Takes 2-5 minutes
   - You'll get a URL like: `https://timesheet-tracker.onrender.com`

6. **Done! 🎉**
   - Your app is now live!
   - Auto-deploys on every GitHub push

#### Important Notes for Render:
- ⚠️ Free tier sleeps after 15 minutes of inactivity
- ⚠️ First request after sleep takes 30-60 seconds to wake up
- ⚠️ Database resets on each deploy (SQLite is in-memory on free tier)
- 💡 For persistent data, upgrade to paid tier or use external database

---

### Option 2: Railway.app (Free $5 Credit)

Railway provides $5 free credit per month, good for small apps.

#### Steps:

1. **Sign Up**
   - Go to [railway.app](https://railway.app)
   - Sign in with GitHub

2. **New Project**
   - Click **"New Project"**
   - Select **"Deploy from GitHub repo"**
   - Choose `lokeswaran22/Timesheet`

3. **Configure**
   - Railway auto-detects Node.js
   - Add environment variable: `PORT` (Railway sets this automatically)
   - Click **"Deploy"**

4. **Generate Domain**
   - Go to **Settings** → **Networking**
   - Click **"Generate Domain"**
   - You'll get: `https://timesheet-production.up.railway.app`

5. **Done! 🎉**

---

### Option 3: Vercel (Free Tier)

Vercel is great for static sites but can also host Node.js apps.

#### Steps:

1. **Install Vercel CLI** (optional)
   ```bash
   npm install -g vercel
   ```

2. **Deploy via GitHub**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with GitHub
   - Click **"Add New"** → **"Project"**
   - Import `lokeswaran22/Timesheet`

3. **Configure**
   ```
   Framework Preset: Other
   Build Command: npm install
   Output Directory: (leave empty)
   Install Command: npm install
   ```

4. **Deploy**
   - Click **"Deploy"**
   - Get URL: `https://timesheet.vercel.app`

---

### Option 4: Heroku (Paid - $5/month minimum)

Heroku no longer has a free tier but is very reliable.

#### Steps:

1. **Sign Up**
   - Go to [heroku.com](https://heroku.com)
   - Create account

2. **Create New App**
   - Dashboard → **"New"** → **"Create new app"**
   - Name: `timesheet-tracker`
   - Region: Choose closest

3. **Deploy**
   - Connect GitHub repository
   - Enable automatic deploys
   - Click **"Deploy Branch"**

4. **Add Buildpack**
   - Settings → Buildpacks → Add: `heroku/nodejs`

5. **Done!**
   - URL: `https://timesheet-tracker.herokuapp.com`

---

## 🔧 Post-Deployment Configuration

### Environment Variables

Most platforms require you to set environment variables:

```
PORT=10000 (or auto-set by platform)
NODE_ENV=production
```

### Database Persistence

⚠️ **Important**: SQLite database will reset on each deployment on free tiers.

**Solutions:**
1. **Use PostgreSQL** (recommended for production)
   - Render offers free PostgreSQL
   - Railway offers PostgreSQL
   - Update server code to use PostgreSQL instead of SQLite

2. **Use External Storage**
   - Mount persistent volume (paid feature)
   - Use cloud database service

3. **Accept Reset** (for testing/demo)
   - Database resets are okay for demos
   - Add sample data on startup

---

## 🧪 Testing Your Deployment

After deployment, test these features:

1. ✅ Login page loads
2. ✅ Can create employees
3. ✅ Can add activities
4. ✅ Can export to Excel
5. ✅ Notifications work
6. ✅ Activity history shows

---

## 🐛 Troubleshooting

### "Application Error" or 500 Error
- Check deployment logs
- Verify all dependencies in package.json
- Ensure `npm start` works locally

### Database Not Working
- Check if SQLite is supported on platform
- Consider switching to PostgreSQL for production

### Static Files Not Loading
- Verify `client/dist` folder is in repository
- Check build logs for errors
- Ensure `express.static` path is correct

### Port Issues
- Use `process.env.PORT` (already configured)
- Don't hardcode port 3000

---

## 📊 Recommended: Render.com

For this application, **Render.com** is the best choice because:

✅ Free tier available
✅ Automatic deployments from GitHub
✅ Easy setup (no CLI needed)
✅ Good performance
✅ Free SSL certificate
✅ Custom domains (on paid tier)

---

## 🔄 Continuous Deployment

Once set up, any push to GitHub automatically deploys:

```bash
# Make changes locally
git add .
git commit -m "Update feature"
git push origin main

# Platform automatically deploys! 🚀
```

---

## 📝 Next Steps

1. Choose a platform (Render recommended)
2. Follow the steps above
3. Test your deployment
4. Share your live URL!
5. (Optional) Set up custom domain

---

## 🆘 Need Help?

- **Render Docs**: https://render.com/docs
- **Railway Docs**: https://docs.railway.app
- **Vercel Docs**: https://vercel.com/docs

---

**Your app is ready to deploy! Choose a platform and follow the steps above.** 🚀
