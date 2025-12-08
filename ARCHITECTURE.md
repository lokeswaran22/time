# React Timesheet Tracker - Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│                    REACT FRONTEND (Port 5173)                           │
│                         Vite Dev Server                                 │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │                                                                   │ │
│  │                         App.jsx                                   │ │
│  │                    (Main Container)                               │ │
│  │                                                                   │ │
│  │    • State Management (useState)                                 │ │
│  │    • Data Fetching (useEffect)                                   │ │
│  │    • Event Handlers                                              │ │
│  │    • Props Distribution                                          │ │
│  │                                                                   │ │
│  └─────────────┬─────────────────────────────────────────────────────┘ │
│                │                                                         │
│                │  Props & Callbacks                                      │
│                ▼                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                                                                  │   │
│  │                    PRESENTATION LAYER                            │   │
│  │                                                                  │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │   │
│  │  │   Header     │  │ DateSelector │  │ TimesheetTable│         │   │
│  │  │              │  │              │  │              │          │   │
│  │  │ • Logo       │  │ • Prev/Next  │  │ • Employees  │          │   │
│  │  │ • Export     │  │ • Date Picker│  │ • Time Slots │          │   │
│  │  │ • Add Emp    │  │ • Today Btn  │  │ • Activities │          │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘          │   │
│  │                                                                  │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │   │
│  │  │ ActivityTracker│ │  Preloader   │  │ StatusToast  │          │   │
│  │  │              │  │              │  │              │          │   │
│  │  │ • Recent     │  │ • Loading    │  │ • Success    │          │   │
│  │  │   Changes    │  │   Screen     │  │ • Error      │          │   │
│  │  │ • Timestamps │  │ • Logo Anim  │  │ • Info       │          │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘          │   │
│  │                                                                  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                                                                  │   │
│  │                      MODAL LAYER                                │   │
│  │                   (Conditional Rendering)                       │   │
│  │                                                                  │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │   │
│  │  │EmployeeModal │  │ActivityModal │  │EmployeeAction│          │   │
│  │  │              │  │              │  │    Modal     │          │   │
│  │  │ • Add/Edit   │  │ • Add/Edit   │  │ • Leave      │          │   │
│  │  │   Employee   │  │   Activity   │  │ • Permission │          │   │
│  │  │ • Validation │  │ • Page Count │  │ • Time Range │          │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘          │   │
│  │                                                                  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────┬───────────────────────────────────────────┘
                              │
                              │ HTTP Requests
                              │ (Proxied by Vite)
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│                    EXPRESS BACKEND (Port 3000)                          │
│                         Node.js Server                                  │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │                                                                   │ │
│  │                         REST API                                  │ │
│  │                                                                   │ │
│  │  GET    /api/employees          → Fetch all employees            │ │
│  │  POST   /api/employees          → Add/Update employee            │ │
│  │  DELETE /api/employees/:id      → Delete employee                │ │
│  │                                                                   │ │
│  │  GET    /api/activities         → Fetch all activities           │ │
│  │  POST   /api/activities         → Add/Update activity            │ │
│  │  DELETE /api/activities         → Clear activity                 │ │
│  │                                                                   │ │
│  │  GET    /api/activity-log       → Fetch activity history         │ │
│  │  POST   /api/activity-log       → Log activity                   │ │
│  │  DELETE /api/activity-log       → Clear history                  │ │
│  │                                                                   │ │
│  │  GET    /api/export             → Export to Excel                │ │
│  │                                                                   │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │                                                                   │ │
│  │                      BUSINESS LOGIC                               │ │
│  │                                                                   │ │
│  │  • Employee Management                                            │ │
│  │  • Activity Tracking                                              │ │
│  │  • Leave/Permission Handling                                      │ │
│  │  • Data Validation                                                │ │
│  │  • Excel Generation                                               │ │
│  │                                                                   │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │                                                                   │ │
│  │                     SQLITE DATABASE                               │ │
│  │                    (timesheet.db)                                 │ │
│  │                                                                   │ │
│  │  Tables:                                                          │ │
│  │  • employees        → Employee records                            │ │
│  │  • activities       → Activity data per date/slot                 │ │
│  │  • activity_log     → Activity history/audit trail                │ │
│  │                                                                   │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════

                            DATA FLOW DIAGRAM

═══════════════════════════════════════════════════════════════════════════

User Action (Click "Add Employee")
         │
         ▼
    Header.jsx
         │
         │ onClick={onAddEmployee}
         ▼
      App.jsx
         │
         │ setShowEmployeeModal(true)
         ▼
  EmployeeModal.jsx (Renders)
         │
         │ User enters name, clicks "Save"
         ▼
  EmployeeModal.jsx
         │
         │ onSave(name)
         ▼
      App.jsx
         │
         │ addEmployee(name)
         ▼
  fetch('/api/employees', { method: 'POST', body: employee })
         │
         │ HTTP POST
         ▼
  Express Backend (server.js)
         │
         │ Validate & Process
         ▼
  SQLite Database (INSERT)
         │
         │ Success Response
         ▼
      App.jsx
         │
         │ setEmployees([...employees, newEmployee])
         ▼
  TimesheetTable.jsx (Re-renders with new employee)
         │
         ▼
  User sees new employee in table ✅


═══════════════════════════════════════════════════════════════════════════

                        COMPONENT HIERARCHY

═══════════════════════════════════════════════════════════════════════════

App
├── Preloader
├── Header
├── main.main-content
│   └── div.container
│       ├── DateSelector
│       ├── TimesheetTable
│       │   └── table.timesheet-table
│       │       ├── thead (headers)
│       │       └── tbody
│       │           └── tr (for each employee)
│       │               ├── td.sticky-col (name)
│       │               ├── td (totals x3)
│       │               ├── td (time slots x13)
│       │               │   └── div.activity-cell
│       │               └── td.actions-col
│       │                   └── div.action-buttons
│       │                       ├── button.edit
│       │                       └── button.delete
│       └── ActivityTracker
│           └── div.activity-tracker-list
│               └── div.activity-tracker-item (for each activity)
├── EmployeeModal (conditional)
├── ActivityModal (conditional)
├── EmployeeActionModal (conditional)
├── StatusToast (conditional)
└── div.footer


═══════════════════════════════════════════════════════════════════════════

                          STATE MANAGEMENT

═══════════════════════════════════════════════════════════════════════════

App.jsx State:
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  const [employees, setEmployees] = useState([])                 │
│  const [activities, setActivities] = useState({})               │
│  const [currentDate, setCurrentDate] = useState(new Date())     │
│  const [showEmployeeModal, setShowEmployeeModal] = useState(false) │
│  const [showActivityModal, setShowActivityModal] = useState(false) │
│  const [showEmployeeActionModal, setShowEmployeeActionModal] = useState(false) │
│  const [editingEmployeeId, setEditingEmployeeId] = useState(null) │
│  const [selectedEmployee, setSelectedEmployee] = useState(null) │
│  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null) │
│  const [statusMessage, setStatusMessage] = useState(null)       │
│  const [activityLog, setActivityLog] = useState([])             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

Data Flow:
  State → Props → Child Components
  Child Components → Callbacks → State Updates → Re-render


═══════════════════════════════════════════════════════════════════════════

                        TECHNOLOGY STACK

═══════════════════════════════════════════════════════════════════════════

Frontend:
  • React 18.3.1        → UI Library
  • Vite 7.2.6          → Build Tool & Dev Server
  • ESLint              → Code Quality

Backend:
  • Node.js             → Runtime
  • Express 5.1.0       → Web Framework
  • SQLite3 5.1.7       → Database
  • XLSX 0.18.5         → Excel Export
  • CORS 2.8.5          → Cross-Origin Support

Styling:
  • Vanilla CSS         → Custom Styles
  • Google Fonts        → Playfair Display + Inter
  • CSS Variables       → Theming
  • Flexbox/Grid        → Layout

Development:
  • Hot Module Replacement (HMR)
  • API Proxy (Vite → Express)
  • React DevTools
  • Browser Console


═══════════════════════════════════════════════════════════════════════════

                      FILE SIZE COMPARISON

═══════════════════════════════════════════════════════════════════════════

Before (Vanilla JS):
  script.js              55,154 bytes  (1,430 lines)
  index.html             17,312 bytes  (341 lines)
  ─────────────────────────────────────
  Total:                 72,466 bytes

After (React):
  App.jsx                ~12,000 bytes  (~380 lines)
  TimesheetTable.jsx     ~7,000 bytes   (~180 lines)
  ActivityModal.jsx      ~6,000 bytes   (~150 lines)
  EmployeeActionModal.jsx ~6,500 bytes  (~170 lines)
  ActivityTracker.jsx    ~4,500 bytes   (~110 lines)
  EmployeeModal.jsx      ~2,800 bytes   (~70 lines)
  DateSelector.jsx       ~2,400 bytes   (~60 lines)
  Header.jsx             ~1,400 bytes   (~35 lines)
  Preloader.jsx          ~1,200 bytes   (~30 lines)
  StatusToast.jsx        ~600 bytes     (~15 lines)
  ─────────────────────────────────────
  Total:                 ~44,400 bytes  (~1,200 lines)

Benefits:
  ✅ Better organized
  ✅ Easier to maintain
  ✅ Reusable components
  ✅ Smaller individual files
  ✅ Better separation of concerns


═══════════════════════════════════════════════════════════════════════════
