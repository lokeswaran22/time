# Timesheet Tracker - React Application

This is the React frontend for the Timesheet Tracker application, converted from vanilla JavaScript to React.

## Project Structure

```
client/
├── src/
│   ├── components/
│   │   ├── Header.jsx              # Header with logo and action buttons
│   │   ├── DateSelector.jsx        # Date navigation component
│   │   ├── TimesheetTable.jsx      # Main timesheet table
│   │   ├── ActivityTracker.jsx     # Recent activity feed
│   │   ├── Preloader.jsx           # Loading screen
│   │   ├── StatusToast.jsx         # Toast notifications
│   │   ├── EmployeeModal.jsx       # Add/Edit employee modal
│   │   ├── ActivityModal.jsx       # Add/Edit activity modal
│   │   └── EmployeeActionModal.jsx # Leave/Permission modal
│   ├── App.jsx                     # Main application component
│   ├── main.jsx                    # React entry point
│   ├── style.css                   # Main styles (from original app)
│   └── reminder.css                # Reminder styles (from original app)
├── public/
│   └── images/                     # Logo and images
└── index.html                      # HTML template

```

## Features

✅ **Fully Converted to React**
- All vanilla JavaScript converted to React components
- State management using React hooks (useState, useEffect)
- Component-based architecture for better maintainability

✅ **Preserved Functionality**
- Employee management (add, edit, delete)
- Activity tracking per time slot
- Leave and permission marking
- Activity history/tracker
- Excel export
- Date navigation

✅ **Modern Development**
- Vite for fast development and building
- Hot Module Replacement (HMR)
- ESLint for code quality
- Proxy configuration for API calls

## Getting Started

### Prerequisites
- Node.js installed
- Backend server running on port 3000

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The production build will be in the `dist/` folder.

## Backend Integration

The React app communicates with the existing Express backend running on port 3000. The Vite dev server is configured to proxy all `/api` requests to `http://localhost:3000`.

**Make sure your backend server is running before starting the React app:**

```bash
# In the parent directory (e:\lokii\Ts)
node server.js
```

## Key Differences from Vanilla JS Version

1. **Component-Based**: UI is split into reusable React components
2. **State Management**: Uses React hooks instead of class-based state
3. **Declarative**: React's declarative approach vs imperative DOM manipulation
4. **Virtual DOM**: React efficiently updates only what's changed
5. **Development Experience**: Hot reload, better debugging, component dev tools

## API Endpoints Used

- `GET /api/employees` - Fetch all employees
- `POST /api/employees` - Add/update employee
- `DELETE /api/employees/:id` - Delete employee
- `GET /api/activities` - Fetch all activities
- `POST /api/activities` - Add/update activity
- `DELETE /api/activities` - Clear activity
- `GET /api/activity-log` - Fetch activity history
- `POST /api/activity-log` - Log activity
- `DELETE /api/activity-log` - Clear activity history
- `GET /api/export` - Export to Excel

## Development Tips

- Use React DevTools browser extension for debugging
- Check browser console for any errors
- Ensure backend is running before starting frontend
- All styles are preserved from the original application

## Troubleshooting

**Issue**: API calls failing
- **Solution**: Ensure backend server is running on port 3000

**Issue**: Images not loading
- **Solution**: Check that images are in `public/images/` folder

**Issue**: Styles not applying
- **Solution**: Verify `style.css` and `reminder.css` are in `src/` folder

## License

© 2025 Pristonix - All Rights Reserved
