@echo off
echo ================================================
echo   Pushing React Build Fix to GitHub
echo ================================================
echo.
echo This will add React build step to deployment
echo.
pause

echo.
echo Adding files...
git add render.yaml package.json .gitignore

echo.
echo Committing...
git commit -m "Add React build step to deployment process"

echo.
echo Pushing to GitHub...
git push origin main

echo.
echo ================================================
echo   Done! Render will rebuild with React app
echo ================================================
echo.
echo What happens next:
echo 1. Render detects the new commit
echo 2. Runs: npm install
echo 3. Builds React app: cd client && npm install && npm run build
echo 4. Starts server: npm start
echo 5. Your app will be live!
echo.
echo Check: https://pristonix-timesheet.onrender.com
echo.
pause
