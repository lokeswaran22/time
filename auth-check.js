// Authentication Check - Must be loaded first
(function () {
    'use strict';

    // Check if user is logged in
    let currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');

    // Session Expiry Check (10 Hours)
    if (currentUser && currentUser.expiry) {
        if (new Date().getTime() > currentUser.expiry) {
            localStorage.removeItem('currentUser');
            currentUser = null; // Invalidate session in memory

            if (!window.location.pathname.includes('login.html')) {
                alert('Session expired. Please login again.');
                window.location.href = '/login.html';
                return;
            }
        }
    }

    // If on login page, redirect to home if already logged in (and valid)
    if (window.location.pathname.includes('login.html')) {
        if (currentUser) {
            window.location.href = '/';
        }
        return;
    }

    // If not on login page and not logged in, redirect to login
    if (!currentUser) {
        window.location.href = '/login.html';
        return;
    }

    // Display user info in header
    window.addEventListener('DOMContentLoaded', function () {
        const userInfoDisplay = document.getElementById('userInfoDisplay');
        if (userInfoDisplay && currentUser) {
            const roleClass = currentUser.role === 'admin' ? 'admin-badge' : 'employee-badge';
            userInfoDisplay.innerHTML = `
                <span class="${roleClass}" style="
                    background: ${currentUser.role === 'admin' ? 'linear-gradient(135deg, #d4af37 0%, #aa8c2c 100%)' : 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)'};
                    color: white;
                    padding: 0.4rem 0.8rem;
                    border-radius: 6px;
                    font-size: 0.85rem;
                    font-weight: 600;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                ">
                    ${currentUser.username} (${currentUser.role})
                </span>
            `;
        }

        // Logout button is handled by script.js to avoid conflicts
    });
})();
