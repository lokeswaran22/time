// Authentication Check - Must be loaded first
(function () {
    'use strict';

    // Check if user is logged in
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');

    // If on login page, redirect to home if already logged in
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

        // Setup logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function () {
                if (confirm('Are you sure you want to logout?')) {
                    localStorage.removeItem('currentUser');
                    window.location.href = '/login.html';
                }
            });
        }
    });
})();
