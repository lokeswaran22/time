# Running the React Application

This guide will help you run the newly converted React version of the Timesheet Tracker.

## Quick Start

### Step 1: Start the Backend Server

The backend server must be running first. Open a terminal in the root directory (`e:\lokii\Ts`):

```bash
node server.js
```

You should see:
```
Server running on http://localhost:3000
```

**Keep this terminal open** - the backend must stay running.

### Step 2: Start the React Frontend

Open a **new terminal** and navigate to the client folder:

```bash
cd client
npm run dev
```

You should see:
```
VITE v7.2.6  ready in XXX ms
➜  Local:   http://localhost:5173/
```

### Step 3: Open in Browser

Open your browser and go to: **http://localhost:5173**

## What Changed?

### ✅ Converted to React
- **Before**: Vanilla JavaScript with DOM manipulation
- **After**: React components with declarative UI

### ✅ Modern Development
- **Vite**: Lightning-fast dev server with HMR
- **Component-based**: Modular, reusable components
- **Better DX**: React DevTools, better error messages

### ✅ Same Functionality
All features from the original app are preserved:
- ✅ Employee management
- ✅ Activity tracking
- ✅ Leave/Permission marking
- ✅ Activity history
- ✅ Excel export
- ✅ Date navigation
- ✅ All modals and forms

## Architecture

```
┌─────────────────────────────────────┐
│   React Frontend (Port 5173)        │
│   - Vite Dev Server                 │
│   - React Components                │
│   - State Management (Hooks)        │
└──────────────┬──────────────────────┘
               │ API Proxy (/api/*)
               ▼
┌─────────────────────────────────────┐
│   Express Backend (Port 3000)       │
│   - REST API                        │
│   - SQLite Database                 │
│   - Business Logic                  │
└─────────────────────────────────────┘
```

## Component Structure

```
App.jsx (Main Container)
├── Preloader.jsx
├── Header.jsx
├── DateSelector.jsx
├── TimesheetTable.jsx
│   └── Activity Cells (inline)
├── ActivityTracker.jsx
├── EmployeeModal.jsx (conditional)
├── ActivityModal.jsx (conditional)
├── EmployeeActionModal.jsx (conditional)
└── StatusToast.jsx (conditional)
```

## Development Workflow

### Making Changes

1. **Edit React components** in `client/src/components/`
2. **Changes auto-reload** thanks to Vite HMR
3. **Check browser console** for any errors
4. **Use React DevTools** for debugging

### Styling

- Main styles: `client/src/style.css`
- Reminder styles: `client/src/reminder.css`
- Changes to CSS auto-reload

### Backend Changes

If you modify the backend (`server.js`):
1. Stop the backend server (Ctrl+C)
2. Restart it: `node server.js`
3. Frontend will reconnect automatically

## Building for Production

When ready to deploy:

```bash
cd client
npm run build
```

This creates optimized files in `client/dist/`.

To preview the production build:

```bash
npm run preview
```

## Troubleshooting

### Port Already in Use

**Error**: `Port 5173 is already in use`

**Solution**: 
```bash
# Kill the process using port 5173
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

### Backend Not Running

**Error**: API calls fail with network errors

**Solution**: Make sure backend is running on port 3000

### Images Not Loading

**Error**: Logo/images show broken

**Solution**: 
```bash
# Copy images again
cd client
xcopy /E /I /Y ..\images public\images
```

### Styles Not Applied

**Error**: App looks unstyled

**Solution**:
```bash
# Copy CSS files again
cd client
copy ..\style.css src\
copy ..\reminder.css src\
```

## Comparing with Original

### Original (Vanilla JS)
- File: `index.html` + `script.js`
- Run: Open `index.html` in browser (with server running)
- Size: ~55KB JavaScript

### React Version
- Files: Multiple components in `client/src/`
- Run: `npm run dev` (development) or `npm run build` (production)
- Benefits: Better organization, maintainability, developer experience

## Next Steps

### Recommended Enhancements

1. **Add TypeScript** for type safety
2. **Add React Router** for multi-page navigation
3. **Add React Query** for better data fetching
4. **Add Testing** with Vitest and React Testing Library
5. **Add State Management** (Redux/Zustand) if app grows

### Migration Path

You can run both versions simultaneously:
- **Original**: `http://localhost:3000/index.html`
- **React**: `http://localhost:5173`

This allows you to compare and ensure feature parity.

## Support

For issues or questions:
1. Check browser console for errors
2. Check terminal for server errors
3. Verify both servers are running
4. Review this guide

---

**Happy Coding! 🚀**

The app is now fully converted to React while maintaining all original functionality.
