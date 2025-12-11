@echo off
echo ========================================
echo  Timesheet Tracker - React Version
echo ========================================
echo.
echo Starting Backend Server...
echo.

cd /d "%~dp0"
start "Backend Server" cmd /k "node server.js"

timeout /t 3 /nobreak >nul

echo.
echo Starting React Frontend...
echo.

cd client
start "React Frontend" cmd /k "npm run dev"

echo.
echo ========================================
echo  Both servers are starting!
echo ========================================
echo.
echo Backend:  http://localhost:3000
echo Frontend: http://localhost:5173
echo.
echo Press any key to exit this window...
echo (The servers will keep running)
pause >nul
