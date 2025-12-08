import React, { useState } from 'react';
import { useMsal } from '@azure/msal-react';
import { loginRequest, DEMO_MODE } from '../config/authConfig';
import { useAuth } from '../context/AuthContext';
import '../login.css';

export default function TeamsLogin() {
    const { instance: msalInstance } = useMsal();
    const { login } = useAuth();
    const [demoEmail, setDemoEmail] = useState('');
    const [demoName, setDemoName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Microsoft Teams login handler
    const handleTeamsLogin = async () => {
        setLoading(true);
        setError('');

        try {
            const loginResponse = await msalInstance.loginPopup(loginRequest);

            if (loginResponse) {
                const { account } = loginResponse;

                // Login to backend with Teams account
                const result = await login(
                    account.username, // email
                    account.name,     // display name
                    account.homeAccountId // Azure AD ID
                );

                if (!result.success) {
                    setError(result.error);
                }
            }
        } catch (err) {
            console.error('Teams login error:', err);
            setError('Failed to login with Microsoft Teams. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Demo/Development login handler
    const handleDemoLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!demoEmail) {
            setError('Please enter an email address');
            setLoading(false);
            return;
        }

        const displayName = demoName || demoEmail.split('@')[0];

        const result = await login(demoEmail, displayName);

        if (!result.success) {
            setError(result.error);
        }

        setLoading(false);
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <div className="logo-container">
                        <span className="logo-icon">📊</span>
                        <h1 className="logo-text">Pristonix</h1>
                    </div>
                    <h2 className="login-title">Timesheet Management</h2>
                    <p className="login-subtitle">Track your daily activities efficiently</p>
                </div>

                <div className="login-content">
                    {DEMO_MODE ? (
                        // Demo Mode Login
                        <div className="demo-login">
                            <div className="demo-notice">
                                <p>⚠️ <strong>Demo Mode</strong></p>
                                <p>Configure Azure AD credentials in .env to enable Teams authentication</p>
                            </div>

                            <form onSubmit={handleDemoLogin}>
                                <div className="form-group">
                                    <label htmlFor="email">Email Address</label>
                                    <input
                                        type="email"
                                        id="email"
                                        className="form-input"
                                        placeholder="Enter your email"
                                        value={demoEmail}
                                        onChange={(e) => setDemoEmail(e.target.value)}
                                        required
                                        autoFocus
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="name">Display Name (Optional)</label>
                                    <input
                                        type="text"
                                        id="name"
                                        className="form-input"
                                        placeholder="Your name"
                                        value={demoName}
                                        onChange={(e) => setDemoName(e.target.value)}
                                    />
                                </div>

                                {error && (
                                    <div className="error-message">
                                        {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    className="login-button demo-button"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <span className="spinner"></span>
                                            Signing in...
                                        </>
                                    ) : (
                                        <>
                                            <span className="button-icon">🔑</span>
                                            Sign In
                                        </>
                                    )}
                                </button>

                                <div className="demo-help">
                                    <p><strong>Quick Start Tips:</strong></p>
                                    <ul>
                                        <li>Use <code>admin@company.com</code> for admin access</li>
                                        <li>Any other email will create an employee account</li>
                                        <li>Your Teams name will be auto-generated from email</li>
                                    </ul>
                                </div>
                            </form>
                        </div>
                    ) : (
                        // Microsoft Teams Login
                        <div className="teams-login">
                            <div className="teams-notice">
                                <p>🔐 <strong>Secure Authentication</strong></p>
                                <p>Sign in with your Microsoft Teams account</p>
                            </div>

                            {error && (
                                <div className="error-message">
                                    {error}
                                </div>
                            )}

                            <button
                                onClick={handleTeamsLogin}
                                className="login-button teams-button"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <span className="spinner"></span>
                                        Connecting to Teams...
                                    </>
                                ) : (
                                    <>
                                        <svg className="teams-icon" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M19.5 8.25h-5.25v12h5.25A1.5 1.5 0 0021 18.75v-9a1.5 1.5 0 00-1.5-1.5z" />
                                            <path d="M12 8.25H4.5A1.5 1.5 0 003 9.75v9a1.5 1.5 0 001.5 1.5H12v-12z" />
                                            <circle cx="12" cy="6" r="3" />
                                        </svg>
                                        Sign in with Microsoft Teams
                                    </>
                                )}
                            </button>

                            <div className="teams-features">
                                <h3>Features:</h3>
                                <ul>
                                    <li>✅ Single Sign-On (SSO)</li>
                                    <li>✅ Automatic name from Teams profile</li>
                                    <li>✅ Secure authentication</li>
                                    <li>✅ Role-based access control</li>
                                </ul>
                            </div>
                        </div>
                    )}
                </div>

                <div className="login-footer">
                    <p>Developed with ❤️ for efficient timesheet management</p>
                    <p className="version">Version 2.0 - Teams Edition</p>
                </div>
            </div>
        </div>
    );
}
