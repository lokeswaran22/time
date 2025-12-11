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

echo Starting Server...
echo Open http://localhost:3000 in your browser.
echo.
node server.js
pause
