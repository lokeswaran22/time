@echo off
echo ================================================
echo   Pushing Deployment Files to GitHub
echo ================================================
echo.
echo This will commit and push:
echo - Updated .gitignore
echo - Updated package.json
echo - render.yaml
echo - .env.example
echo - DEPLOYMENT.md
echo.
pause

echo.
echo Adding files...
git add .gitignore package.json render.yaml .env.example DEPLOYMENT.md

echo.
echo Committing...
git commit -m "Add deployment configuration for Render.com"

echo.
echo Pushing to GitHub...
git push origin main

echo.
echo ================================================
echo   Done! Files pushed to GitHub
echo ================================================
echo.
echo Next: Deploy on Render.com
echo 1. Go to https://render.com
echo 2. Sign in with GitHub
echo 3. Create New Web Service
echo 4. Select lokeswaran22/Timesheet
echo 5. Use Free plan
echo.
pause
