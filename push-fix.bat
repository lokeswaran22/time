@echo off
echo ================================================
echo   Pushing Deployment Fix to GitHub
echo ================================================
echo.
echo Fixing Express 5.x compatibility issue
echo.
pause

echo.
echo Adding files...
git add server.js Procfile

echo.
echo Committing...
git commit -m "Fix Express 5.x compatibility and add Procfile for deployment"

echo.
echo Pushing to GitHub...
git push origin main

echo.
echo ================================================
echo   Done! Render will auto-deploy the fix
echo ================================================
echo.
echo The deployment should work now!
echo Check your Render dashboard for the new deployment.
echo.
pause
