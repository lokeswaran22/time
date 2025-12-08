import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

import ConfirmModal from './ConfirmModal';

function Header({ onAddEmployee, onExport, isAdmin }) {
    const navigate = useNavigate();
    const [userInfo, setUserInfo] = useState(null);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    useEffect(() => {
        const user = localStorage.getItem('user');
        if (user) {
            setUserInfo(JSON.parse(user));
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('userId');
        localStorage.removeItem('username');
        sessionStorage.removeItem('adminAuth');
        sessionStorage.removeItem('adminAuthTime');
        navigate('/login');
    };

    return (
        <>
            <header className="header">
                <div className="container">
                    <div className="header-content">
                        <div className="logo">
                            <img src="/images/logogo.jpg" alt="Pristonix" width="60" height="40" />
                            <h1 className="logo-text" style={{ marginLeft: '-12px' }}>RISTONIX</h1>
                        </div>
                        <div className="header-actions">
                            {userInfo && (
                                <div className="user-info">
                                    <span className="user-badge">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                            <circle cx="12" cy="7" r="4" />
                                        </svg>
                                        {userInfo.username}
                                    </span>
                                    <button
                                        className="btn-icon-logout"
                                        onClick={() => setShowLogoutConfirm(true)}
                                        title="Logout"
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                            <polyline points="16 17 21 12 16 7" />
                                            <line x1="21" y1="12" x2="9" y2="12" />
                                        </svg>
                                    </button>
                                </div>
                            )}
                            <button className="btn btn-secondary" onClick={onExport}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                                </svg>
                                Export to Excel
                            </button>
                            <button className="btn btn-secondary" onClick={() => navigate('/admin')}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                Admin Panel
                            </button>
                            {isAdmin && (
                                <button className="btn btn-primary" onClick={onAddEmployee}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M12 5v14M5 12h14" />
                                    </svg>
                                    Add Employee
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {showLogoutConfirm && (
                <ConfirmModal
                    title="Confirm Logout"
                    message="Are you sure you want to logout?"
                    confirmText="Logout"
                    onConfirm={handleLogout}
                    onCancel={() => setShowLogoutConfirm(false)}
                />
            )}
        </>
    );
}

export default Header;

