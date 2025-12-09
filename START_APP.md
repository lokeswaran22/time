# How to Run the Timesheet Application

This application now uses a local database to permanently store your data.

## Prerequisites
- Node.js installed (which you already have).

## Steps to Run

1. **Open a Terminal** in this directory (`e:\loki\Ts`).
2. **Start the Server**:
   Run the following command:
   ```bash
   node server-sqlite.js
   ```
   (Or double-click `start-sqlite.bat`)
   
   You should see: `Server running on SQLite!` and `Connected to the SQLite database.`

3. **Open the Application**:
   Open your web browser and go to:
   [http://localhost:3000](http://localhost:3000)

   **Note:** Do not open `index.html` directly by double-clicking it anymore, as it won't be able to connect to the database. You must access it through the localhost URL.

## Features
- **Permanent Storage**: All employees and activities are saved to `timesheet.db`.
- **Auto-Save**: Changes are saved automatically as you make them.
- **Status Indicators**: You'll see a small notification in the bottom right when data is saved.
