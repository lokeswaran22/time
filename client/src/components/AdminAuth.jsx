import { useState } from 'react';
import '../style.css';
import '../login.css';

function AdminAuth({ onSuccess }) {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    // Admin password - in production, this should be in environment variables
    const ADMIN_PASSWORD = 'admin@2025';

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        if (password === ADMIN_PASSWORD) {
            // Store admin session
            sessionStorage.setItem('adminAuth', 'true');
            sessionStorage.setItem('adminAuthTime', Date.now().toString());
            onSuccess();
        } else {
            setError('Incorrect admin password. Access denied.');
            setPassword('');
        }
    };

    return (
        <div className="login-container">
            <div className="login-box" style={{ maxWidth: '420px' }}>
                <div className="login-header" style={{ textAlign: 'center' }}>
                    <img
                        src="/images/logogo.jpg"
                        alt="Pristonix"
                        width="120"
                        height="80"
                        style={{
                            borderRadius: '12px',
                            marginBottom: '1rem',
                            boxShadow: '0 8px 24px rgba(212, 175, 55, 0.25)'
                        }}
                    />
                    <h1>Admin Access</h1>
                    <p>Enter Admin Password</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    {error && <div className="error-message">⚠️ {error}</div>}

                    <div className="admin-auth-info">
                        <div className="info-box">
                            <h4>🔒 Protected Area</h4>
                            <p>This area is restricted to administrators only. Please enter the admin password to continue.</p>
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="adminPassword">
                            Admin Password <span className="required">*</span>
                        </label>
                        <input
                            type="password"
                            id="adminPassword"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter admin password"
                            required
                            autoFocus
                        />
                    </div>

                    <button type="submit" className="btn-primary btn-login">
                        🔓 Unlock Admin Panel
                    </button>
                </form>

                <div className="login-footer">
                    <p>© 2025 Pristonix - All Rights Reserved</p>
                </div>
            </div>
        </div>
    );
}

export default AdminAuth;
