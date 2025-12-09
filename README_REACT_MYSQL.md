# React + MySQL Timesheet Application

This application has been converted to a full-stack React application using a MySQL database.

## Prerequisites

1.  **MySQL Server**: You must have MySQL installed and running.
    *   Download: [MySQL Community Server](https://dev.mysql.com/downloads/mysql/)
    *   OR use [XAMPP](https://www.apachefriends.org/) (easier).
2.  **Node.js**: Installed on your system.

## Setup

1.  **Configure Database**:
    *   Open the `.env` file in the root directory.
    *   Update the `DB_USER` and `DB_PASSWORD` to match your MySQL installation.
    *   Default is `root` with no password (common for XAMPP).

2.  **Start the Application**:
    *   Double-click `start-react-mysql.bat`.
    *   This will:
        *   Start the Backend Server (connects to MySQL).
        *   Start the React Frontend.

## Troubleshooting

*   **"FATAL ERROR: Could not connect to MySQL Database"**:
    *   Make sure your MySQL service is running.
    *   Check your username and password in `.env`.
*   **Frontend not loading**:
    *   Check the "Frontend" terminal window for errors.
    *   Try running `cd client` and `npm install` manually if needed.

## Architecture

*   **Backend**: Node.js + Express + MySQL2 (`server.js`)
*   **Frontend**: React + Vite (`client/`)
*   **Database**: MySQL (`timesheet_db`)
