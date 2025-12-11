import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminAuth from '../components/AdminAuth';
import EmployeeModal from '../components/EmployeeModal';
import ConfirmModal from '../components/ConfirmModal';
import '../style.css';
import '../admin.css';

function AdminPanel() {
    const navigate = useNavigate();
    const [userInfo, setUserInfo] = useState(null);
    const [employees, setEmployees] = useState([]);
    const [users, setUsers] = useState([]);
    const [activityLog, setActivityLog] = useState([]);
    const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
    const [showEmployeeModal, setShowEmployeeModal] = useState(false);
    const [stats, setStats] = useState({
        totalEmployees: 0,
        totalUsers: 0,
        totalActivities: 0,
        todayActivities: 0
    });
    const [activeTab, setActiveTab] = useState('employees');
    const [sessionTimeLeft, setSessionTimeLeft] = useState(null);
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [confirmModal, setConfirmModal] = useState({
        show: false,
        title: '',
        message: '',
        onConfirm: () => { },
        isDangerous: false
    });

    // ... existing useEffect ...

    // Helper function to get current username
    const getCurrentUsername = () => {
        const user = localStorage.getItem('user');
        if (user) {
            const userData = JSON.parse(user);
            return userData.username || '';
        }
        return '';
    };

    const handleAddEmployee = async (name) => {
        console.log('Adding/Updating employee:', name);

        const employee = {
            id: editingEmployee ? editingEmployee.id : Date.now().toString() + Math.random().toString(36).substr(2, 5),
            name: name.trim(),
            email: editingEmployee ? editingEmployee.email : '',
            createdAt: editingEmployee ? editingEmployee.createdAt : new Date().toISOString()
        };

        try {
            const res = await fetch('/api/employees', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(employee)
            });

            if (res.ok) {
                // Log action
                await fetch('/api/activity-log', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        dateKey: new Date().toISOString().split('T')[0],
                        employeeName: name.trim(),
                        activityType: 'other',
                        description: editingEmployee ? 'Employee updated (Admin)' : 'New employee added (Admin)',
                        timeSlot: '-',
                        action: editingEmployee ? 'updated' : 'added',
                        editedBy: getCurrentUsername(),
                        timestamp: new Date().toISOString()
                    })
                });

                loadData();
                setShowEmployeeModal(false);
                setEditingEmployee(null);
                alert(editingEmployee ? 'Employee updated successfully' : 'Employee added successfully');
            }
        } catch (e) {
            console.error('Error saving employee:', e);
            alert('Error saving employee');
        }
    };

    const handleEditEmployee = (employee) => {
        setEditingEmployee(employee);
        setShowEmployeeModal(true);
    };

    const handleDeleteEmployee = (id) => {
        setConfirmModal({
            show: true,
            title: 'Delete Employee',
            message: 'Are you sure you want to delete this employee? All their activities will also be deleted.',
            onConfirm: () => executeDeleteEmployee(id),
            isDangerous: true
        });
    };

    const executeDeleteEmployee = async (id) => {
        try {
            const res = await fetch(`/api/employees/${id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                // Log action
                const deletedEmployee = employees.find(emp => emp.id === id);
                await fetch('/api/activity-log', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        dateKey: new Date().toISOString().split('T')[0],
                        employeeName: deletedEmployee?.name || 'Unknown',
                        activityType: 'other',
                        description: 'Employee deleted (Admin)',
                        timeSlot: '-',
                        action: 'deleted',
                        editedBy: getCurrentUsername(),
                        timestamp: new Date().toISOString()
                    })
                });

                loadData();
                alert('Employee deleted successfully');
            }
        } catch (e) {
            console.error('Error deleting employee:', e);
            alert('Error deleting employee');
        }
        setConfirmModal(prev => ({ ...prev, show: false }));
    };

    // ... existing handlers ...

    useEffect(() => {
        const user = localStorage.getItem('user');
        if (!user) {
            navigate('/login');
            return;
        }
        setUserInfo(JSON.parse(user));

        // Check admin authentication
        const adminAuth = sessionStorage.getItem('adminAuth');
        const adminAuthTime = sessionStorage.getItem('adminAuthTime');

        if (adminAuth === 'true' && adminAuthTime) {
            // Check if session is still valid (30 minutes)
            const authTime = parseInt(adminAuthTime);
            const now = Date.now();
            const thirtyMinutes = 30 * 60 * 1000;

            if (now - authTime < thirtyMinutes) {
                setIsAdminAuthenticated(true);
                loadData();
            } else {
                // Session expired
                sessionStorage.removeItem('adminAuth');
                sessionStorage.removeItem('adminAuthTime');
            }
        }

        // Cleanup function to clear admin session when leaving the page
        return () => {
            sessionStorage.removeItem('adminAuth');
            sessionStorage.removeItem('adminAuthTime');
        };
    }, [navigate]);

    // Auto-logout timer (30 minutes)
    useEffect(() => {
        let timer;
        if (isAdminAuthenticated) {
            const adminAuthTime = sessionStorage.getItem('adminAuthTime');
            // 30 minutes in milliseconds
            const sessionDuration = 30 * 60 * 1000;

            if (adminAuthTime) {
                const timePassed = Date.now() - parseInt(adminAuthTime);
                const timeRemaining = sessionDuration - timePassed;

                if (timeRemaining <= 0) {
                    // Time already up
                    setIsAdminAuthenticated(false);
                    sessionStorage.removeItem('adminAuth');
                    sessionStorage.removeItem('adminAuthTime');
                } else {
                    // Set timer for remaining time
                    timer = setTimeout(() => {
                        setIsAdminAuthenticated(false);
                        sessionStorage.removeItem('adminAuth');
                        sessionStorage.removeItem('adminAuthTime');
                        alert('Admin session expired (30 mins). Please login again.');
                    }, timeRemaining);
                }
            }
        }
        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [isAdminAuthenticated]);

    // Countdown timer display (updates every second)
    useEffect(() => {
        let interval;
        if (isAdminAuthenticated) {
            const updateCountdown = () => {
                const adminAuthTime = sessionStorage.getItem('adminAuthTime');
                if (adminAuthTime) {
                    const sessionDuration = 30 * 60 * 1000; // 30 minutes
                    const timePassed = Date.now() - parseInt(adminAuthTime);
                    const timeRemaining = sessionDuration - timePassed;

                    if (timeRemaining > 0) {
                        const minutes = Math.floor(timeRemaining / 60000);
                        const seconds = Math.floor((timeRemaining % 60000) / 1000);
                        setSessionTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
                    } else {
                        setSessionTimeLeft('0:00');
                    }
                }
            };

            updateCountdown(); // Initial update
            interval = setInterval(updateCountdown, 1000); // Update every second
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isAdminAuthenticated]);

    const handleAdminAuthSuccess = () => {
        setIsAdminAuthenticated(true);
        loadData();
    };

    const loadData = async () => {
        try {
            const [empRes, actRes] = await Promise.all([
                fetch('/api/employees'),
                fetch('/api/activity-log?limit=100')
            ]);

            if (empRes.ok) {
                const employeesData = await empRes.json();
                setEmployees(employeesData);
                setStats(prev => ({ ...prev, totalEmployees: employeesData.length }));
            }

            if (actRes.ok) {
                const logData = await actRes.json();
                setActivityLog(logData);
                setStats(prev => ({ ...prev, totalActivities: logData.length }));
            }
        } catch (error) {
            console.error('Error loading data:', error);
        }
    };


    const handleClearActivityLog = () => {
        setConfirmModal({
            show: true,
            title: 'Clear Activity Log',
            message: 'Clear all activity history? This cannot be undone.',
            onConfirm: executeClearActivityLog,
            isDangerous: true
        });
    };

    const executeClearActivityLog = async () => {
        try {
            const res = await fetch('/api/activity-log', { method: 'DELETE' });
            if (res.ok) {
                loadData();
                alert('Activity log cleared');
            }
        } catch (error) {
            alert('Error clearing activity log');
        }
        setConfirmModal(prev => ({ ...prev, show: false }));
    };

    const handleCleanupEmployees = () => {
        setConfirmModal({
            show: true,
            title: 'DELETE ALL DATA',
            message: 'WARNING: This will delete ALL employees and activities. This action cannot be undone. Are you absolutely sure?',
            onConfirm: executeCleanupEmployees,
            isDangerous: true
        });
    };

    const executeCleanupEmployees = async () => {
        try {
            const res = await fetch('/api/cleanup-employees', { method: 'POST' });
            if (res.ok) {
                loadData();
                alert('All employees deleted');
            }
        } catch (error) {
            alert('Error cleaning up employees');
        }
        setConfirmModal(prev => ({ ...prev, show: false }));
    };

    const handleLogout = () => {
        setConfirmModal({
            show: true,
            title: 'Confirm Logout',
            message: 'Are you sure you want to logout?',
            onConfirm: () => {
                localStorage.removeItem('user');
                localStorage.removeItem('userId');
                localStorage.removeItem('username');
                sessionStorage.removeItem('adminAuth');
                sessionStorage.removeItem('adminAuthTime');
                navigate('/login');
                setConfirmModal(prev => ({ ...prev, show: false }));
            },
            isDangerous: false
        });
    };

    // Show admin authentication screen if not authenticated
    if (!isAdminAuthenticated) {
        return <AdminAuth onSuccess={handleAdminAuthSuccess} />;
    }

    return (
        <div className="admin-panel">
            {/* Header */}
            <header className="admin-header">
                <div className="admin-header-content">
                    <div className="admin-logo-section">
                        <div>
                            <h1>Admin Panel</h1>
                        </div>
                    </div>
                    <div className="admin-header-actions">
                        {sessionTimeLeft && (
                            <div className="session-timer">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <polyline points="12 6 12 12 16 14" />
                                </svg>
                                <span>Session: {sessionTimeLeft}</span>
                            </div>
                        )}
                        {userInfo && (
                            <div className="user-info">
                                <span className="user-badge">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                        <circle cx="12" cy="7" r="4" />
                                    </svg>
                                    {userInfo.username}
                                </span>
                                <button className="btn-icon-logout" onClick={handleLogout} title="Logout">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                        <polyline points="16 17 21 12 16 7" />
                                        <line x1="21" y1="12" x2="9" y2="12" />
                                    </svg>
                                </button>
                            </div>
                        )}
                        <button className="btn btn-secondary" onClick={() => navigate('/')}>
                            ⏳ Timesheet
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="admin-main">
                <div className="container">
                    {/* Stats Cards */}
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-icon">👥</div>
                            <div className="stat-info">
                                <h3>{stats.totalEmployees}</h3>
                                <p>Total Employees</p>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">📝</div>
                            <div className="stat-info">
                                <h3>{stats.totalActivities}</h3>
                                <p>Activity Logs</p>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="admin-tabs">
                        <button
                            className={`tab ${activeTab === 'employees' ? 'active' : ''}`}
                            onClick={() => setActiveTab('employees')}
                        >
                            👥 Employees
                        </button>
                        <button
                            className={`tab ${activeTab === 'logs' ? 'active' : ''}`}
                            onClick={() => setActiveTab('logs')}
                        >
                            📝 Activity Logs
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div className="admin-content">
                        {activeTab === 'overview' && (
                            <div className="overview-section">
                                <h2>System Overview</h2>
                                <div className="info-grid">
                                    <div className="info-card">
                                        <h3>📊 Quick Stats</h3>
                                        <ul>
                                            <li><strong>Employees:</strong> {stats.totalEmployees}</li>
                                            <li><strong>Activity Records:</strong> {stats.totalActivities}</li>
                                            <li><strong>Database:</strong> SQLite</li>
                                            <li><strong>Status:</strong> <span className="status-active">● Online</span></li>
                                        </ul>
                                    </div>
                                    <div className="info-card">
                                        <h3>🔧 Quick Actions</h3>
                                        <div className="quick-actions">
                                            <button className="btn btn-primary" onClick={() => navigate('/')}>
                                                Go to Dashboard
                                            </button>
                                            <button className="btn btn-secondary" onClick={loadData}>
                                                Refresh Data
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'employees' && (
                            <div className="employees-section">
                                <div className="section-header">
                                    <h2>Employee Management</h2>
                                    <button className="btn btn-primary" onClick={() => setShowEmployeeModal(true)}>
                                        + Add Employee
                                    </button>
                                </div>
                                <div className="table-container">
                                    <table className="admin-table">
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Name</th>
                                                <th>Email</th>
                                                <th>Created At</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {employees.map(emp => (
                                                <tr key={emp.id}>
                                                    <td><code>{emp.id.substring(0, 8)}...</code></td>
                                                    <td><strong>{emp.name}</strong></td>
                                                    <td>{emp.email || '-'}</td>
                                                    <td>{new Date(emp.createdAt).toLocaleDateString()}</td>
                                                    <td>
                                                        <button
                                                            className="btn btn-sm btn-danger"
                                                            onClick={() => handleDeleteEmployee(emp.id)}
                                                        >
                                                            🗑️ Delete
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeTab === 'logs' && (
                            <div className="logs-section">
                                <div className="section-header">
                                    <h2>Activity Logs</h2>
                                    <button className="btn btn-danger" onClick={handleClearActivityLog}>
                                        🗑️ Clear All Logs
                                    </button>
                                </div>
                                <div className="logs-list">
                                    {activityLog.slice(0, 50).map((log, index) => (
                                        <div key={index} className="log-item">
                                            <div className="log-icon">
                                                {log.action === 'updated' ? '✏️' : log.action === 'cleared' ? '🗑️' : '➕'}
                                            </div>
                                            <div className="log-details">
                                                <strong>{log.employeeName}</strong>
                                                <span> - {log.activityType}</span>
                                                {log.description && <span>: {log.description}</span>}
                                                <div className="log-meta">
                                                    {log.timeSlot} • {new Date(log.createdAt).toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'system' && (
                            <div className="system-section">
                                <h2>System Management</h2>
                                <div className="danger-zone">
                                    <h3>⚠️ Danger Zone</h3>
                                    <p>These actions are irreversible. Use with caution.</p>
                                    <div className="danger-actions">
                                        <button className="btn btn-danger" onClick={handleCleanupEmployees}>
                                            🗑️ Delete All Employees
                                        </button>
                                        <button className="btn btn-danger" onClick={handleClearActivityLog}>
                                            🗑️ Clear Activity Log
                                        </button>
                                    </div>
                                </div>
                                <div className="system-info">
                                    <h3>📊 System Information</h3>
                                    <ul>
                                        <li><strong>Database:</strong> SQLite (timesheet.db)</li>
                                        <li><strong>Server:</strong> Node.js + Express</li>
                                        <li><strong>Frontend:</strong> React + Vite</li>
                                        <li><strong>Port:</strong> 3000</li>
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {showEmployeeModal && (
                <EmployeeModal
                    employee={editingEmployee}
                    onClose={() => {
                        setShowEmployeeModal(false);
                        setEditingEmployee(null);
                    }}
                    onSave={handleAddEmployee}
                />
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
        </div>
    );
}

export default AdminPanel;
