@echo off
echo ===================================================
echo   Starting Timesheet App (React + MySQL)
echo ===================================================
echo.

:: Check if .env exists
if not exist .env (
    echo [WARNING] .env file not found! Creating default...
    echo DB_HOST=localhost> .env
    echo DB_USER=root>> .env
    echo DB_PASSWORD=>> .env
    echo DB_NAME=timesheet_db>> .env
    echo PORT=3000>> .env
)

echo Starting Backend Server...
start "Backend (MySQL)" cmd /k "node server.js"

echo Waiting for backend to initialize...
timeout /t 5 /nobreak >nul

echo Starting Frontend (React)...
cd client
if not exist node_modules (
    echo Installing frontend dependencies...
    call npm install
)
start "Frontend (React)" cmd /k "npm run dev"

echo.
echo ===================================================
echo   App started!
echo   Backend: http://localhost:3000
echo   Frontend: http://localhost:5173
echo ===================================================
echo.
pause
