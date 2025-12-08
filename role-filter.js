/**
 * Role-Based View Filter
 * This script filters the timesheet table based on user role
 * - Admin: See all employees
 * - Employee: See only own row
 */

(function () {
    'use strict';

    // Get current user from localStorage
    function getCurrentUser() {
        const userStr = localStorage.getItem('currentUser');
        if (!userStr) return null;
        try {
            return JSON.parse(userStr);
        } catch (e) {
            return null;
        }
    }

    // Apply role-based filtering to the timesheet table
    function applyRoleBasedFiltering() {
        const user = getCurrentUser();
        if (!user) {
            console.log('[Role Filter] No user logged in');
            return;
        }

        console.log('[Role Filter] User:', user.username, 'Role:', user.role);

        const isAdmin = user.role === 'admin';
        const timesheetBody = document.getElementById('timesheetBody');

        if (!timesheetBody) {
            console.log('[Role Filter] Timesheet table not found yet');
            return;
        }

        if (!isAdmin && user.employeeId) {
            // Employee view: Show only their row
            console.log('[Role Filter] Filtering for employee:', user.employeeId);

            const rows = timesheetBody.querySelectorAll('tr');
            rows.forEach(row => {
                const employeeCell = row.cells[0];
                if (employeeCell) {
                    // Get employee ID from the row's data attribute or check the text
                    const rowEmployeeId = row.dataset.employeeId ||
                        employeeCell.textContent.trim().toLowerCase().replace(/\s+/g, '-');

                    if (rowEmployeeId !== user.employeeId &&
                        rowEmployeeId !== user.username.toLowerCase().replace(/\s+/g, '-')) {
                        row.style.display = 'none';
                    } else {
                        row.style.display = '';
                    }
                }
            });

            // Hide admin buttons for employees
            hideAdminButtons();
        } else {
            // Admin view: Show all rows
            console.log('[Role Filter] Admin view - showing all employees');
            const rows = timesheetBody.querySelectorAll('tr');
            rows.forEach(row => {
                row.style.display = '';
            });
        }
    }

    // Hide admin-only buttons for employees
    function hideAdminButtons() {
        const user = getCurrentUser();
        if (!user || user.role === 'admin') return;

        // Hide Add Employee button
        const addEmpBtn = document.getElementById('addEmployeeBtn');
        if (addEmpBtn) addEmpBtn.style.display = 'none';

        // Hide Admin Panel link
        const adminPanelLinks = document.querySelectorAll('a[href="history.html"]');
        adminPanelLinks.forEach(link => {
            if (link.textContent.includes('Admin Panel')) {
                link.style.display = 'none';
            }
        });

        // Hide delete buttons in employee rows
        document.querySelectorAll('.delete-employee').forEach(btn => {
            btn.style.display = 'none';
        });
    }

    // Show user info in header
    function updateUserInfo() {
        const user = getCurrentUser();
        if (!user) return;

        const userInfoDisplay = document.getElementById('userInfoDisplay');
        if (userInfoDisplay) {
            const roleBadge = user.role === 'admin' ?
                '<span style="background: var(--royal-gold); color: var(--royal-navy); padding: 2px 8px; border-radius: 4px; font-size: 0.8em; margin-left: 8px;">ADMIN</span>' :
                '<span style="background: var(--royal-blue); color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.8em; margin-left: 8px;">EMPLOYEE</span>';

            userInfoDisplay.innerHTML = `Welcome, ${user.username} ${roleBadge}`;
        }
    }

    // Initialize when DOM is ready
    function init() {
        console.log('[Role Filter] Initializing role-based filtering');

        // Update user info
        updateUserInfo();

        // Apply filtering
        applyRoleBasedFiltering();

        // Re-apply filtering when table is updated (e.g., date changed)
        const observer = new MutationObserver(() => {
            applyRoleBasedFiltering();
        });

        const timesheetBody = document.getElementById('timesheetBody');
        if (timesheetBody) {
            observer.observe(timesheetBody, {
                childList: true,
                subtree: true
            });
        }
    }

    // Wait for both DOM and page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Also run after a short delay to catch dynamically loaded content
    setTimeout(init, 500);
    setTimeout(init, 1000);
    setTimeout(init, 2000);

})();
