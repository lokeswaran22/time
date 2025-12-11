import { useState, useEffect } from 'react';
import '../style.css';
import '../reminder.css';
import '../activity-tracker.css';
import '../daily-timesheet.css';
import Header from '../components/Header';
import DateSelector from '../components/DateSelector';
import TimesheetTable from '../components/TimesheetTable';
import ActivityTracker from '../components/ActivityTracker';
import EmployeeModal from '../components/EmployeeModal';
import ActivityModal from '../components/ActivityModal';
import EmployeeActionModal from '../components/EmployeeActionModal';
import Preloader from '../components/Preloader';
import ReminderSystem from '../components/ReminderSystem';
import StatusToast from '../components/StatusToast';
import ConfirmModal from '../components/ConfirmModal';

function Dashboard() {
    const [employees, setEmployees] = useState([]);
    const [activities, setActivities] = useState({});
    const [currentDate, setCurrentDate] = useState(new Date());
    const [showEmployeeModal, setShowEmployeeModal] = useState(false);
    const [showActivityModal, setShowActivityModal] = useState(false);
    const [showEmployeeActionModal, setShowEmployeeActionModal] = useState(false);
    const [editingEmployeeId, setEditingEmployeeId] = useState(null);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
    const [statusMessage, setStatusMessage] = useState(null);
    const [activityLog, setActivityLog] = useState([]);
    const [isAdmin, setIsAdmin] = useState(false);
    const [confirmModal, setConfirmModal] = useState({
        show: false,
        title: '',
        message: '',
        onConfirm: () => { },
        isDangerous: false
    });

    const timeSlots = [
        '9:00-10:00', '10:00-11:00', '11:00-11:10', '11:10-12:00',
        '12:00-01:00', '01:00-01:40', '01:40-03:00', '03:00-03:50',
        '03:50-04:00', '04:00-05:00', '05:00-06:00', '06:00-07:00', '07:00-08:00'
    ];

    // Helper function to get current username
    const getCurrentUsername = () => {
        const user = localStorage.getItem('user');
        if (user) {
            const userData = JSON.parse(user);
            return userData.username || '';
        }
        return '';
    };

    // Load data on mount
    useEffect(() => {
        loadData();

        // Check if user has admin access
        const adminAuth = sessionStorage.getItem('adminAuth');
        const adminAuthTime = sessionStorage.getItem('adminAuthTime');

        if (adminAuth === 'true' && adminAuthTime) {
            const authTime = parseInt(adminAuthTime);
            const now = Date.now();
            const thirtyMinutes = 30 * 60 * 1000;

            if (now - authTime < thirtyMinutes) {
                setIsAdmin(true);
            }
        }
    }, []);

    const loadData = async () => {
        try {
            const [empRes, actRes] = await Promise.all([
                fetch('/api/employees?t=' + Date.now()),
                fetch('/api/activities?t=' + Date.now())
            ]);

            if (!empRes.ok || !actRes.ok) throw new Error('Failed to fetch data');

            const employeesData = await empRes.json();
            const activitiesData = await actRes.json();

            setEmployees(employeesData);
            setActivities(activitiesData);
        } catch (e) {
            console.error('Error loading data:', e);
            showStatus('Error connecting to server', 'error');
        }
    };

    const loadActivityLog = async () => {
        try {
            const response = await fetch('/api/activity-log?limit=200');
            if (!response.ok) throw new Error('Failed to load activity log');
            const logs = await response.json();
            setActivityLog(Array.isArray(logs) ? logs : []);
        } catch (error) {
            console.error('Error loading activity log:', error);
        }
    };

    useEffect(() => {
        loadActivityLog();
    }, []);

    const showStatus = (message, type = 'success') => {
        setStatusMessage({ message, type });
        setTimeout(() => setStatusMessage(null), 2500);
    };

    const formatDateForInput = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const getDateKey = (date) => formatDateForInput(date);

    const addEmployee = async (name) => {
        const employee = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
            name: name.trim(),
            createdAt: new Date().toISOString()
        };

        try {
            const res = await fetch('/api/employees', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(employee)
            });

            if (res.ok) {
                setEmployees([...employees, employee]);

                // Log action
                await fetch('/api/activity-log', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        dateKey: getDateKey(currentDate),
                        employeeName: name.trim(),
                        activityType: 'other',
                        description: 'New employee added',
                        timeSlot: '-',
                        action: 'added',
                        editedBy: getCurrentUsername(),
                        timestamp: new Date().toISOString()
                    })
                });
                loadActivityLog();

                showStatus('Employee saved');
            }
        } catch (e) {
            console.error('Error adding employee:', e);
            showStatus('Error saving employee', 'error');
        }
    };

    const updateEmployee = async (id, name) => {
        const employee = employees.find(emp => emp.id === id);
        if (employee) {
            employee.name = name.trim();
            try {
                const res = await fetch('/api/employees', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(employee)
                });

                if (res.ok) {
                    setEmployees([...employees]);

                    // Log action
                    await fetch('/api/activity-log', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            dateKey: getDateKey(currentDate),
                            employeeName: name.trim(),
                            activityType: 'other',
                            description: 'Employee name updated',
                            timeSlot: '-',
                            action: 'updated',
                            editedBy: getCurrentUsername(),
                            timestamp: new Date().toISOString()
                        })
                    });
                    loadActivityLog();

                    showStatus('Employee updated');
                }
            } catch (e) {
                console.error('Error updating employee:', e);
                showStatus('Error updating employee', 'error');
            }
        }
    };

    const deleteEmployee = (id) => {
        console.log('deleteEmployee called with ID:', id);
        setConfirmModal({
            show: true,
            title: 'Delete Employee',
            message: 'Are you sure you want to delete this employee? All their activities will be removed.',
            onConfirm: () => executeDeleteEmployee(id),
            isDangerous: true
        });
    };

    const executeDeleteEmployee = async (id) => {
        try {
            const res = await fetch(`/api/employees/${id}`, { method: 'DELETE' });
            if (res.ok) {
                const empName = employees.find(e => e.id === id)?.name || 'Unknown';
                setEmployees(employees.filter(emp => emp.id !== id));

                // Log action
                await fetch('/api/activity-log', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        dateKey: getDateKey(currentDate),
                        employeeName: empName,
                        activityType: 'other',
                        description: 'Employee deleted',
                        timeSlot: '-',
                        action: 'cleared',
                        editedBy: getCurrentUsername(),
                        timestamp: new Date().toISOString()
                    })
                });
                loadActivityLog();

                showStatus('Employee deleted');
            }
        } catch (e) {
            console.error('Error deleting employee:', e);
            showStatus('Error deleting employee', 'error');
        }
        setConfirmModal(prev => ({ ...prev, show: false }));
    };

    const setActivity = async (employeeId, timeSlot, activityData) => {
        const dateKey = getDateKey(currentDate);
        const payload = {
            dateKey,
            employeeId,
            timeSlot,
            ...activityData
        };

        try {
            const res = await fetch('/api/activities', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                // Update local state
                const newActivities = { ...activities };
                if (!newActivities[dateKey]) newActivities[dateKey] = {};
                if (!newActivities[dateKey][employeeId]) newActivities[dateKey][employeeId] = {};
                newActivities[dateKey][employeeId][timeSlot] = activityData;
                setActivities(newActivities);

                // Log activity
                const employee = employees.find(emp => emp.id === employeeId);
                if (employee) {
                    await fetch('/api/activity-log', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            dateKey,
                            employeeName: employee.name,
                            activityType: activityData.type,
                            description: activityData.description,
                            timeSlot,
                            action: 'updated',
                            editedBy: getCurrentUsername(),
                            timestamp: new Date().toISOString()
                        })
                    });
                    loadActivityLog();
                }

                showStatus('Activity saved automatically');
            }
        } catch (e) {
            console.error('Error saving activity:', e);
            showStatus('Error saving activity', 'error');
        }
    };

    const clearActivity = async (employeeId, timeSlot) => {
        const dateKey = getDateKey(currentDate);

        // Get activity details before deleting
        const activity = activities[dateKey]?.[employeeId]?.[timeSlot];
        const activityDetails = activity
            ? `${activity.type.toUpperCase()}${activity.description ? ': ' + activity.description : ''}`
            : 'Activity';

        try {
            const res = await fetch('/api/activities', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dateKey, employeeId, timeSlot })
            });

            if (res.ok) {
                const newActivities = { ...activities };
                if (newActivities[dateKey] && newActivities[dateKey][employeeId]) {
                    delete newActivities[dateKey][employeeId][timeSlot];
                }
                setActivities(newActivities);

                // Log action
                const employee = employees.find(emp => emp.id === employeeId);
                if (employee) {
                    await fetch('/api/activity-log', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            dateKey,
                            employeeName: employee.name,
                            activityType: 'other',
                            description: `Cleared: ${activityDetails}`,
                            timeSlot,
                            action: 'cleared',
                            editedBy: getCurrentUsername(),
                            timestamp: new Date().toISOString()
                        })
                    });
                    loadActivityLog();
                }

                showStatus('Activity cleared');
            }
        } catch (e) {
            console.error('Error clearing activity:', e);
            showStatus('Error clearing activity', 'error');
        }
    };

    const exportToExcel = () => {
        const dateKey = getDateKey(currentDate);
        window.location.href = `/api/export?dateKey=${dateKey}`;
    };

    return (
        <>
            <Preloader />
            <ReminderSystem timeSlots={timeSlots} />

            <Header
                onAddEmployee={() => {
                    setEditingEmployeeId(null);
                    setShowEmployeeModal(true);
                }}
                onExport={exportToExcel}
                isAdmin={isAdmin}
            />


            <main className="main-content">
                <div className="container">
                    <div className="daily-timesheet-container">
                        <DateSelector
                            currentDate={currentDate}
                            onDateChange={setCurrentDate}
                        />

                        <TimesheetTable
                            employees={employees}
                            activities={activities}
                            currentDate={currentDate}
                            timeSlots={timeSlots}
                            getDateKey={getDateKey}
                            isAdmin={isAdmin}
                            onEditEmployee={(id) => {
                                setEditingEmployeeId(id);
                                setShowEmployeeModal(true);
                            }}
                            onDeleteEmployee={deleteEmployee}
                            onOpenActivity={(employeeId, timeSlot) => {
                                setSelectedEmployee(employeeId);
                                setSelectedTimeSlot(timeSlot);
                                setShowActivityModal(true);
                            }}
                            onOpenEmployeeAction={(employeeId) => {
                                setSelectedEmployee(employeeId);
                                setShowEmployeeActionModal(true);
                            }}
                        />

                        <ActivityTracker
                            activities={activityLog}
                            currentDate={currentDate}
                            isAdmin={isAdmin}
                            onClear={() => {
                                setConfirmModal({
                                    show: true,
                                    title: 'Clear History',
                                    message: 'Clear all activity history? This will permanently delete all logged activities.',
                                    onConfirm: async () => {
                                        try {
                                            await fetch('/api/activity-log', { method: 'DELETE' });
                                            setActivityLog([]);
                                        } catch (error) {
                                            console.error('Error clearing activity log:', error);
                                        }
                                        setConfirmModal(prev => ({ ...prev, show: false }));
                                    },
                                    isDangerous: true
                                });
                            }}
                        />
                    </div>
                </div>
            </main>

            {showEmployeeModal && (
                <EmployeeModal
                    employee={editingEmployeeId ? employees.find(e => e.id === editingEmployeeId) : null}
                    onClose={() => setShowEmployeeModal(false)}
                    onSave={async (name) => {
                        if (editingEmployeeId) {
                            await updateEmployee(editingEmployeeId, name);
                        } else {
                            await addEmployee(name);
                        }
                        setShowEmployeeModal(false);
                    }}
                />
            )}

            {showActivityModal && (
                <ActivityModal
                    employee={employees.find(e => e.id === selectedEmployee)}
                    timeSlot={selectedTimeSlot}
                    activity={activities[getDateKey(currentDate)]?.[selectedEmployee]?.[selectedTimeSlot]}
                    onClose={() => setShowActivityModal(false)}
                    onSave={async (activityData) => {
                        await setActivity(selectedEmployee, selectedTimeSlot, activityData);
                        setShowActivityModal(false);
                    }}
                    onClear={() => {
                        setConfirmModal({
                            show: true,
                            title: 'Clear Activity',
                            message: 'Are you sure you want to clear this activity?',
                            onConfirm: async () => {
                                await clearActivity(selectedEmployee, selectedTimeSlot);
                                setShowActivityModal(false);
                                setConfirmModal(prev => ({ ...prev, show: false }));
                            },
                            isDangerous: true
                        });
                    }}
                />
            )}

            {showEmployeeActionModal && (
                <EmployeeActionModal
                    employee={employees.find(e => e.id === selectedEmployee)}
                    timeSlots={timeSlots}
                    onClose={() => setShowEmployeeActionModal(false)}
                    onSubmit={async (actionType, startSlot, endSlot, fullDay, reason) => {
                        if (fullDay && actionType === 'leave') {
                            // Full day leave
                            const leaveActivity = {
                                type: 'leave',
                                description: 'FULL_DAY_LEAVE',
                                timestamp: new Date().toISOString()
                            };
                            await setActivity(selectedEmployee, timeSlots[0], leaveActivity);

                            // Clear other slots
                            for (let i = 1; i < timeSlots.length; i++) {
                                await clearActivity(selectedEmployee, timeSlots[i]);
                            }
                        } else {
                            // Partial leave or permission
                            const startIndex = timeSlots.indexOf(startSlot);
                            const endIndex = timeSlots.indexOf(endSlot);

                            for (let i = startIndex; i <= endIndex; i++) {
                                await setActivity(selectedEmployee, timeSlots[i], {
                                    type: actionType,
                                    description: actionType === 'permission' ? reason : `${startSlot} to ${endSlot}`,
                                    timestamp: new Date().toISOString()
                                });
                            }
                        }
                        setShowEmployeeActionModal(false);
                        showStatus(`${actionType === 'leave' ? 'Leave' : 'Permission'} marked successfully`);
                    }}
                />
            )}

            {statusMessage && (
                <StatusToast message={statusMessage.message} type={statusMessage.type} />
            )}

            {confirmModal.show && (
                <ConfirmModal
                    title={confirmModal.title}
                    message={confirmModal.message}
                    onConfirm={confirmModal.onConfirm}
                    onCancel={() => setConfirmModal(prev => ({ ...prev, show: false }))}
                    isDangerous={confirmModal.isDangerous}
                />
            )}

            <div className="footer">
                <a href="https://pristonix.com" className="foot2">Pristonix</a> © 2025 - All Right Reserved.<br /> designed
                by <b><a href="https://trojanx.in" className="foot">Trojan<span className="foot1">x</span></a></b>
            </div>
        </>
    );
}

export default Dashboard;
