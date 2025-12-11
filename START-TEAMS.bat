@echo off
echo ============================================
echo   Timesheet Tracker - Teams Edition
echo   Starting Server...
echo ============================================
echo.

REM Check if .env file exists
if not exist .env (
    echo [WARNING] .env file not found!
    echo Creating from .env.example...
    copy .env.example .env
    echo.
    echo [ACTION REQUIRED] Please edit .env file with your Azure AD credentials
    echo Press any key to continue with DEMO MODE...
    pause >nul
)

REM Check if node_modules exists
if not exist node_modules (
    echo Installing server dependencies...
    call npm install
    echo.
)

REM Check if client is built
if not exist client\dist (
    echo Building React frontend...
    cd client
    if not exist node_modules (
        echo Installing client dependencies...
        call npm install
    )
    call npm run build
    cd ..
    echo.
)

echo Starting Teams-enabled server...
echo.
echo [INFO] Access the application at: http://localhost:3000
echo [INFO] Default login: Use any email (try admin@company.com for admin access)
echo [INFO] Demo Mode: Active (configure Azure AD for Teams authentication)
echo.

node server-teams-sqlite.js

pause
