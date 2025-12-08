// ==========================================
// DATA MANAGEMENT
// ==========================================

class TimesheetManager {
    constructor() {
        this.employees = [];
        this.activities = {};
        this.currentDate = new Date();
        this.editingEmployeeId = null;
        this.timeSlots = [
            '9:00-10:00',
            '10:00-11:00',
            '11:00-11:10',
            '11:10-12:00',
            '12:00-01:00',
            '01:00-01:40',
            '01:40-03:00',
            '03:00-03:50',
            '03:50-04:00',
            '04:00-05:00',
            '05:00-06:00',
            '06:00-07:00',
            '07:00-08:00'
        ];
        this.init();
    }

    async init() {
        console.log('TimesheetManager initializing...');
        this.setupEventListeners();
        this.setDateInput();
        await this.loadData();
        await this.syncEmployees();
        this.renderTimesheet();
        this.handlePreloader();
        console.log('TimesheetManager initialization complete');
    }

    handlePreloader() {
        const preloader = document.getElementById('preloader');
        if (!preloader) return;

        // Check if this is a refresh (page already loaded in this session)
        const hasLoadedBefore = sessionStorage.getItem('hasLoadedBefore');

        if (hasLoadedBefore) {
            // Skip preloader animation on refresh
            preloader.style.display = 'none';
        } else {
            // First load - show preloader with animation
            sessionStorage.setItem('hasLoadedBefore', 'true');
            setTimeout(() => {
                preloader.classList.add('hide');
                setTimeout(() => {
                    preloader.style.display = 'none';
                }, 800); // Match CSS transition duration
            }, 1500);
        }
    }

    // API Methods
    async loadData() {
        try {
            const [empRes, actRes] = await Promise.all([
                fetch('/api/employees?t=' + Date.now()),
                fetch('/api/activities?t=' + Date.now())
            ]);

            if (!empRes.ok || !actRes.ok) throw new Error('Failed to fetch data');

            this.employees = await empRes.json();
            console.log('Loaded employees:', this.employees.length, this.employees);
            this.activities = await actRes.json();
        } catch (e) {
            console.error('Error loading data:', e);
            this.showStatus('Error connecting to server', 'error');
        }
    }

    async syncEmployees() {
        const allowedEmployees = [
            'Anitha', 'Asha', 'Aswini', 'Balaji', 'Dhivya', 'Dharma',
            'Jegan', 'Kamal', 'Kumaran', 'Loki', 'Mani', 'Nandhini', 'Sakthi',
            'Sandhiya', 'Sangeetha', 'Vivek', 'Yogesh'
        ];

        console.log('Syncing employees...');

        // 1. Remove unauthorized employees - SPECIFIC FIX
        const empToDelete = this.employees.find(emp => emp.name === 'Dhivyaharini');
        if (empToDelete) {
            console.log('Removing Dhivyaharini as requested');
            await this.deleteEmployee(empToDelete.id, true);
        }

        /* 
        // General removal logic - DISABLED to prevent data loss
        const allowedSet = new Set(allowedEmployees);
        const employeesToRemove = this.employees.filter(emp => !allowedSet.has(emp.name));

        for (const emp of employeesToRemove) {
            console.log('Removing unauthorized employee:', emp.name);
            await this.deleteEmployee(emp.id, true); // true = skip confirm/render
        }
        */

        // 2. Remove duplicates - keep only first occurrence of each name
        const seen = new Set();
        const duplicates = [];

        for (const emp of this.employees) {
            if (seen.has(emp.name)) {
                duplicates.push(emp);
            } else {
                seen.add(emp.name);
            }
        }

        for (const emp of duplicates) {
            console.log('Removing duplicate:', emp.name, emp.id);
            await this.deleteEmployee(emp.id, true);
        }

        // 3. Reload employees after cleanup
        await this.loadData();

        // 4. Add missing employees
        for (const name of allowedEmployees) {
            if (!this.employees.some(emp => emp.name === name)) {
                console.log('Adding missing employee:', name);
                await this.addEmployee(name, true); // true = skip render
            }
        }

        // 5. Final reload
        await this.loadData();
        console.log('Sync complete. Total employees:', this.employees.length);
    }

    // Date Methods
    setDateInput() {
        const dateInput = document.getElementById('dateInput');
        dateInput.value = this.formatDateForInput(this.currentDate);
    }

    formatDateForInput(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    formatDateForDisplay(date) {
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    getDateKey(date) {
        return this.formatDateForInput(date);
    }

    // Employee Methods
    async addEmployee(name, username, password, skipRender = false) {
        const employee = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
            name: name.trim(),
            username: username,
            password: password,
            createdAt: new Date().toISOString()
        };

        try {
            const res = await fetch('/api/employees', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(employee)
            });

            if (res.ok) {
                // We don't store username/password in local state for security, just the employee record
                const { username, password, ...safeEmployee } = employee;
                this.employees.push(safeEmployee);
                if (!skipRender) this.renderTimesheet();
                this.showStatus('Employee saved');
            } else {
                const data = await res.json();
                alert(data.error || 'Error saving employee');
            }
        } catch (e) {
            console.error('Error adding employee:', e);
            this.showStatus('Error saving employee', 'error');
        }
    }

    async updateEmployee(id, name, username, password) {
        const employee = this.employees.find(emp => emp.id === id);
        if (employee) {
            employee.name = name.trim();
            const payload = { ...employee };
            if (username) payload.username = username;
            if (password) payload.password = password;

            try {
                const res = await fetch('/api/employees', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (res.ok) {
                    this.renderTimesheet();
                    this.showStatus('Employee updated');
                }
            } catch (e) {
                console.error('Error updating employee:', e);
                this.showStatus('Error updating employee', 'error');
            }
        }
    }

    showConfirmModal(title, message, onConfirm, confirmText = 'Delete', confirmClass = 'btn-danger') {
        const modal = document.getElementById('confirmModal');
        if (!modal) {
            if (confirm(message)) onConfirm();
            return;
        }

        document.getElementById('confirmModalTitle').textContent = title;
        document.getElementById('confirmModalMessage').textContent = message;

        const confirmBtn = document.getElementById('confirmOkBtn');
        confirmBtn.textContent = confirmText;

        // Reset classes and add the requested class
        confirmBtn.className = 'btn';
        confirmBtn.classList.add(confirmClass);

        this.pendingConfirmAction = onConfirm;
        modal.classList.add('show');
    }

    async deleteEmployee(id, skipConfirm = false) {
        if (skipConfirm) {
            await this.executeDeleteEmployee(id, true);
        } else {
            this.showConfirmModal(
                'Delete Employee',
                'Are you sure you want to delete this employee? This action cannot be undone and will remove all their activities.',
                () => this.executeDeleteEmployee(id)
            );
        }
    }

    async executeDeleteEmployee(id, skipRender = false) {
        try {
            const res = await fetch(`/api/employees/${id}`, { method: 'DELETE' });
            if (res.ok) {
                this.employees = this.employees.filter(emp => emp.id !== id);
                // Also remove from local activities cache
                Object.keys(this.activities).forEach(dateKey => {
                    if (this.activities[dateKey][id]) {
                        delete this.activities[dateKey][id];
                    }
                });
                if (!skipRender) this.renderTimesheet();
                this.showStatus('Employee deleted');
            } else {
                this.showStatus('Failed to delete employee', 'error');
            }
        } catch (e) {
            console.error('Error deleting employee:', e);
            this.showStatus('Error deleting employee', 'error');
        }
    }

    // Activity Methods
    getActivity(employeeId, timeSlot, date = this.currentDate) {
        const dateKey = this.getDateKey(date);
        if (!this.activities[dateKey]) return null;
        if (!this.activities[dateKey][employeeId]) return null;
        return this.activities[dateKey][employeeId][timeSlot] || null;
    }

    async setActivity(employeeId, timeSlot, activityData, date = this.currentDate) {
        const dateKey = this.getDateKey(date);
        const payload = {
            dateKey,
            employeeId,
            timeSlot,
            ...activityData
        };

        try {
            console.log('Sending activity payload:', payload);
            const res = await fetch('/api/activities', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            console.log('Server response status:', res.status);

            if (res.ok) {
                // Update local state
                if (!this.activities[dateKey]) this.activities[dateKey] = {};
                if (!this.activities[dateKey][employeeId]) this.activities[dateKey][employeeId] = {};
                this.activities[dateKey][employeeId][timeSlot] = activityData;
                console.log('Local state updated for', dateKey, employeeId, timeSlot);

                // Log to activity tracker
                const employee = this.employees.find(emp => emp.id === employeeId);
                if (employee && window.activityTracker) {
                    console.log('Logging activity to tracker:', employee.name, activityData.type);
                    window.activityTracker.addActivity(
                        employee.name,
                        activityData.type,
                        activityData.description,
                        timeSlot,
                        'updated'
                    );
                } else {
                    console.warn('Cannot log to tracker:', { employee: !!employee, tracker: !!window.activityTracker });
                }

                this.renderTimesheet();
                this.showStatus('Activity saved automatically');
            }
        } catch (e) {
            console.error('Error saving activity:', e);
            this.showStatus('Error saving activity', 'error');
        }
    }

    async clearActivity(employeeId, timeSlot, date = this.currentDate) {
        const dateKey = this.getDateKey(date);

        try {
            const res = await fetch('/api/activities', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dateKey, employeeId, timeSlot })
            });

            if (res.ok) {
                // Get employee name before clearing
                const employee = this.employees.find(emp => emp.id === employeeId);
                const activity = this.activities[dateKey]?.[employeeId]?.[timeSlot];

                if (this.activities[dateKey] && this.activities[dateKey][employeeId]) {
                    delete this.activities[dateKey][employeeId][timeSlot];
                }

                // Log to activity tracker
                if (employee && activity && window.activityTracker) {
                    console.log('Logging cleared activity to tracker:', employee.name);
                    window.activityTracker.addActivity(
                        employee.name,
                        activity.type,
                        activity.description,
                        timeSlot,
                        'cleared'
                    );
                } else {
                    console.warn('Cannot log clear to tracker:', { employee: !!employee, activity: !!activity, tracker: !!window.activityTracker });
                }

                this.renderTimesheet();
                this.showStatus('Activity cleared');
            }
        } catch (e) {
            console.error('Error clearing activity:', e);
            this.showStatus('Error clearing activity', 'error');
        }
    }

    // UI Helpers
    showStatus(message, type = 'success') {
        const existingToast = document.querySelector('.status-toast');
        if (existingToast) existingToast.remove();

        const toast = document.createElement('div');
        toast.className = `status-toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('show');
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            }, 2000);
        }, 10);
    }

    renderTimesheet() {
        console.log('=== RENDER TIMESHEET CALLED ===');
        try {
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
            const isEmployee = currentUser.role !== 'admin';

            // Remove critical debug overlay
            const dbg = document.getElementById('debug-overlay');
            if (dbg) dbg.remove();

            // Sort employees
            this.employees.sort((a, b) => a.name.localeCompare(b.name));

            const tbody = document.getElementById('timesheetBody');
            const emptyState = document.getElementById('emptyState');
            const timesheetContainer = document.querySelector('.timesheet-container');
            const table = document.querySelector('.timesheet-table');
            const thead = table ? table.querySelector('thead') : null;

            if (this.employees.length === 0) {
                if (emptyState) emptyState.classList.add('show');
                if (timesheetContainer) timesheetContainer.style.display = 'none';
                return;
            }

            if (emptyState) emptyState.classList.remove('show');
            if (timesheetContainer) timesheetContainer.style.display = 'block';

            tbody.innerHTML = '';

            // Failsafe: Ensure timeSlots are populated
            if (!this.timeSlots || this.timeSlots.length === 0) {
                this.timeSlots = [
                    '9:00-10:00', '10:00-11:00', '11:00-11:10', '11:10-12:00',
                    '12:00-01:00', '01:00-01:40', '01:40-03:00', '03:00-03:50',
                    '03:50-04:00', '04:00-05:00', '05:00-06:00', '06:00-07:00', '07:00-08:00'
                ];
            }

            // Centralized View Handling for Employees
            const mainContainer = document.querySelector('.main-content');
            if (isEmployee) {
                if (mainContainer) mainContainer.classList.add('employee-view-centered');
            } else {
                if (mainContainer) mainContainer.classList.remove('employee-view-centered');
            }

            // === EMPLOYEE HORIZONTAL VIEW ===
            if (isEmployee) {
                // Show standard thead for Horizontal View
                if (thead) thead.style.display = '';

                // Find current employee record
                let employee = null;
                console.log('DEBUG: Finding Employee. currentUser:', currentUser);

                if (currentUser.employeeId) {
                    employee = this.employees.find(e => String(e.id) === String(currentUser.employeeId));
                }

                if (!employee && currentUser.username) {
                    const usernameLower = currentUser.username.toLowerCase();
                    employee = this.employees.find(e => {
                        if (e.username && e.username.toLowerCase() === usernameLower) return true;
                        if (e.name && e.name.toLowerCase() === usernameLower) return true;
                        if (e.name && e.name.replace(/\s+/g, '').toLowerCase() === usernameLower) return true;
                        if (e.name && e.name.split(' ')[0].toLowerCase() === usernameLower) return true;
                        return false;
                    });
                }

                if (!employee) {
                    console.error('DEBUG: Employee Not Found');
                    tbody.innerHTML = `
                        <tr>
                            <td colspan="16" style="padding: 2rem; text-align: center; color: #666;">
                                <div style="font-size: 1.2rem; margin-bottom: 0.5rem; color:red;">⚠️ Employee Record Not Found</div>
                                <div style="font-size: 0.9rem;">Could not link logged-in user <strong>${currentUser.username || 'Unknown'}</strong> to an employee profile.</div>
                            </td>
                        </tr>`;
                    return;
                }

                // Render Single Horizontal Row
                const row = document.createElement('tr');

                // Name Cell
                const nameCell = document.createElement('td');
                nameCell.className = 'sticky-col';
                nameCell.textContent = employee.name;
                nameCell.style.fontWeight = 'bold';
                nameCell.style.color = 'white';
                row.appendChild(nameCell);

                const isOnLeave = this.isEmployeeOnFullDayLeave(employee.id);
                let proofTotal = 0, epubTotal = 0, calibrTotal = 0;

                if (!isOnLeave) {
                    this.timeSlots.forEach(slot => {
                        const act = this.getActivity(employee.id, slot);
                        if (act && act.pagesDone) {
                            const pages = parseInt(act.pagesDone) || 0;
                            if (act.type === 'proof') proofTotal += pages;
                            else if (act.type === 'epub') epubTotal += pages;
                            else if (act.type === 'calibr') calibrTotal += pages;
                        }
                    });
                }

                const createTotalCell = (value, className) => {
                    const cell = document.createElement('td');
                    cell.className = className;
                    cell.textContent = isOnLeave ? '-' : (value > 0 ? value : '-');
                    cell.style.textAlign = 'center';
                    if (value > 0) cell.style.fontWeight = 'bold';
                    return cell;
                };

                row.appendChild(createTotalCell(proofTotal, 'sub-col proof-col'));
                row.appendChild(createTotalCell(epubTotal, 'sub-col epub-col'));
                row.appendChild(createTotalCell(calibrTotal, 'sub-col calibr-col'));

                if (isOnLeave) {
                    const leaveCell = document.createElement('td');
                    leaveCell.colSpan = this.timeSlots.length + 1;
                    leaveCell.className = 'full-day-leave-cell';
                    leaveCell.innerHTML = `
                        <div class="full-day-leave">
                            <span class="leave-badge">LEAVE</span>
                            <button class="clear-leave-btn" onclick="event.stopPropagation(); window.timesheetManager.clearFullDayLeave('${employee.id}')">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M18 6L6 18M6 6l12 12"/>
                                </svg>
                            </button>
                        </div>
                    `;
                    row.appendChild(leaveCell);
                } else {
                    this.timeSlots.forEach(slot => {
                        const cell = document.createElement('td');
                        cell.appendChild(this.createActivityCell(employee.id, slot));
                        row.appendChild(cell);
                    });

                    const actionsHeader = document.querySelector('.timesheet-table th:last-child');
                    if (actionsHeader) actionsHeader.style.display = 'none';
                }
                tbody.appendChild(row);

            } else {
                // === ADMIN HORIZONTAL VIEW ===
                if (thead) thead.style.display = '';

                this.employees.forEach(employee => {
                    const row = document.createElement('tr');

                    // Name Cell
                    const nameCell = document.createElement('td');
                    nameCell.className = 'sticky-col';
                    nameCell.textContent = employee.name;
                    nameCell.style.cursor = 'pointer';
                    nameCell.onclick = () => this.openEmployeeActionModal(employee.id, employee.name);
                    row.appendChild(nameCell);

                    const isOnLeave = this.isEmployeeOnFullDayLeave(employee.id);
                    let proofTotal = 0, epubTotal = 0, calibrTotal = 0;

                    if (!isOnLeave) {
                        this.timeSlots.forEach(slot => {
                            const act = this.getActivity(employee.id, slot);
                            if (act && act.pagesDone) {
                                const pages = parseInt(act.pagesDone) || 0;
                                if (act.type === 'proof') proofTotal += pages;
                                else if (act.type === 'epub') epubTotal += pages;
                                else if (act.type === 'calibr') calibrTotal += pages;
                            }
                        });
                    }

                    const createTotalCell = (value, className) => {
                        const cell = document.createElement('td');
                        cell.className = className;
                        cell.textContent = isOnLeave ? '-' : (value > 0 ? value : '-');
                        cell.style.textAlign = 'center';
                        if (value > 0) cell.style.fontWeight = 'bold';
                        return cell;
                    };

                    row.appendChild(createTotalCell(proofTotal, 'sub-col proof-col'));
                    row.appendChild(createTotalCell(epubTotal, 'sub-col epub-col'));
                    row.appendChild(createTotalCell(calibrTotal, 'sub-col calibr-col'));

                    if (isOnLeave) {
                        const leaveCell = document.createElement('td');
                        leaveCell.colSpan = this.timeSlots.length + 1;
                        leaveCell.className = 'full-day-leave-cell';
                        leaveCell.innerHTML = `
                        <div class="full-day-leave">
                            <span class="leave-badge">LEAVE</span>
                            <button class="clear-leave-btn" onclick="event.stopPropagation(); window.timesheetManager.clearFullDayLeave('${employee.id}')">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M18 6L6 18M6 6l12 12"/>
                                </svg>
                            </button>
                        </div>
                    `;
                        row.appendChild(leaveCell);
                    } else {
                        this.timeSlots.forEach(slot => {
                            const cell = document.createElement('td');
                            cell.appendChild(this.createActivityCell(employee.id, slot));
                            row.appendChild(cell);
                        });

                        // Admin Actions
                        const actionsCell = document.createElement('td');
                        actionsCell.className = 'actions-col';
                        actionsCell.innerHTML = `
                            <div class="action-buttons">
                                <button class="icon-btn edit" data-action="edit" data-employee-id="${employee.id}" title="Edit"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                                <button class="icon-btn delete" data-action="delete" data-employee-id="${employee.id}" title="Delete"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
                            </div>
                    `;
                        row.appendChild(actionsCell);
                    }
                    tbody.appendChild(row);
                });
                const actionsHeader = document.querySelector('.timesheet-table th:last-child');
                if (actionsHeader) actionsHeader.style.display = '';
            }
        } catch (e) {
            console.error('CRITICAL RENDER ERROR:', e);
            alert('CRITICAL ERROR RENDER: ' + e.message);
        }
    }

    createActivityCell(employeeId, timeSlot) {
        const activity = this.getActivity(employeeId, timeSlot);
        const div = document.createElement('div');
        div.className = 'activity-cell';
        div.onclick = () => this.openActivityModal(employeeId, timeSlot);

        if (activity) {
            div.classList.add('has-activity', `type-${activity.type}`);
            const showDescription = activity.type !== 'break' && activity.type !== 'lunch';
            const descriptionHtml = showDescription && activity.description
                ? `<div class="activity-description">${activity.description}</div>`
                : '';


            let timestampHtml = '';
            if (activity.timestamp) {
                const time = new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                timestampHtml = `<div class="activity-timestamp" style="font-size: 0.7em; color: #666; text-align: right; margin-top: 4px;">Updated: ${time}</div>`;
            }

            div.innerHTML = `
                <div class="activity-type-badge ${activity.type}">${activity.type}</div>
                ${descriptionHtml}
                ${timestampHtml}
            `;
        } else {
            div.classList.add('empty');
            // Check for admin role to hide "+ Add Activity" text
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
            if (currentUser.role === 'admin') {
                div.innerHTML = ''; // Empty for cleaner admin view
                div.style.cursor = 'default'; // Optional: if you want to prevent clicks or show standard cursor
                div.onclick = null; // Remove click handler for admin on empty cells
            } else {
                div.innerHTML = '<span>+ Add Activity</span>';
            }
        }
        return div;
    }

    closeEmployeeModal() {
        const modal = document.getElementById('employeeModal');
        modal.classList.remove('show');
        this.editingEmployeeId = null;
    }

    openEmployeeActionModal(employeeId, employeeName) {
        console.log('Opening Action Modal for:', employeeId, employeeName);
        const modal = document.getElementById('employeeActionModal');
        const title = document.getElementById('employeeActionTitle');
        const hiddenInput = document.getElementById('actionEmployeeId');

        this.selectedEmployeeId = employeeId;
        if (hiddenInput) {
            hiddenInput.value = employeeId;
            console.log('Set hidden input value to:', employeeId);
        } else {
            console.error('Hidden input actionEmployeeId not found!');
        }

        title.textContent = `Select an action for ${employeeName}: `;

        modal.classList.add('show');
    }

    closeEmployeeActionModal() {
        const modal = document.getElementById('employeeActionModal');
        const hiddenInput = document.getElementById('actionEmployeeId');

        modal.classList.remove('show');
        this.selectedEmployeeId = null;
        if (hiddenInput) hiddenInput.value = '';
    }

    // prevent admin from editing employee name
    openEmployeeModal(employeeId = null) {
        // ADMIN READ-ONLY CHECK for Employee Name
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

        // If admin tries to edit, allow it (Admin manages users). 
        // If employee tries to edit themselves? Usually blocked by UI, but good to check.

        const modal = document.getElementById('employeeModal');
        const modalTitle = document.getElementById('modalTitle');
        const employeeNameInput = document.getElementById('employeeName');

        this.editingEmployeeId = employeeId;

        if (employeeId) {
            const employee = this.employees.find(emp => emp.id === employeeId);
            modalTitle.textContent = 'Edit Employee';
            employeeNameInput.value = employee.name;
        } else {
            modalTitle.textContent = 'Add Employee';
            employeeNameInput.value = '';
        }

        modal.classList.add('show');
        employeeNameInput.focus();
    }

    openActivityModal(employeeId, timeSlot) {
        console.log('openActivityModal called with:', { employeeId, timeSlot });

        const modal = document.getElementById('activityModal');
        const activity = this.getActivity(employeeId, timeSlot);
        const employee = this.employees.find(emp => emp.id === employeeId);

        if (!employee) {
            console.error('Employee not found for ID:', employeeId);
            alert('Error: Employee not found');
            return;
        }

        // Set values in hidden inputs
        const empInput = document.getElementById('activityEmployeeId');
        const slotInput = document.getElementById('activityTimeSlot');

        empInput.value = employeeId;
        slotInput.value = timeSlot;

        // Backup: Set values on the form dataset as well
        const form = document.getElementById('activityForm');
        form.dataset.employeeId = employeeId;
        form.dataset.timeSlot = timeSlot;

        console.log('Set hidden inputs:', {
            empInputValue: empInput.value,
            slotInputValue: slotInput.value,
            formDataset: form.dataset
        });

        document.getElementById('activityModalTitle').textContent =
            `${employee.name} - ${timeSlot} `;

        if (activity) {
            document.getElementById('activityType').value = activity.type;
            const cleanDesc = (activity.description || '').split(' (Pages:')[0]; // Remove auto-appended page info for editing
            document.getElementById('activityDescription').value = cleanDesc;

            if (activity.type === 'proof' || activity.type === 'epub' || activity.type === 'calibr') {
                document.getElementById('startPage').value = activity.startPage || '';
                document.getElementById('endPage').value = activity.endPage || '';

                // Trigger Calc
                if (activity.startPage && activity.endPage) {
                    const total = Math.max(0, activity.endPage - activity.startPage + 1);
                    document.getElementById('calculatedTotal').textContent = total;
                } else {
                    document.getElementById('calculatedTotal').textContent = '0';
                }
            } else {
                document.getElementById('startPage').value = '';
                document.getElementById('endPage').value = '';
                document.getElementById('calculatedTotal').textContent = '0';
            }
        } else {
            document.getElementById('activityType').value = 'epub';
            document.getElementById('activityDescription').value = '';
            document.getElementById('startPage').value = '';
            document.getElementById('endPage').value = '';
            document.getElementById('calculatedTotal').textContent = '0';
        }

        this.updateActivityDescVisibility();

        // ADMIN READ-ONLY CHECK
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const saveBtn = document.querySelector('#activityForm button[type="submit"]');
        const clearBtn = document.getElementById('clearActivityBtn');
        const inputs = modal.querySelectorAll('input, select, textarea');

        // Logic: If Admin AND target != Admin's own ID -> Read Only
        // Note: Admin's own employee ID usually matches their username or special ID.
        // Safer check: If role is admin, simply block editing others.

        let isReadOnly = false;
        if (currentUser.role === 'admin' && currentUser.employeeId !== employeeId) {
            isReadOnly = true;
        }

        if (isReadOnly) {
            document.getElementById('activityModalTitle').textContent += ' (Read Only)';
            saveBtn.style.display = 'none';
            if (clearBtn) clearBtn.style.display = 'none';
            inputs.forEach(input => input.disabled = true);
        } else {
            saveBtn.style.display = 'block';
            if (clearBtn) clearBtn.style.display = 'block';
            inputs.forEach(input => input.disabled = false);
        }

        modal.classList.add('show');
        if (!isReadOnly) document.getElementById('activityDescription').focus();
    }

    closeActivityModal() {
        const modal = document.getElementById('activityModal');
        modal.classList.remove('show');
    }

    updateActivityDescVisibility() {
        const activityType = document.getElementById('activityType').value;
        const pageRangeGroup = document.getElementById('pageRangeGroup');

        if (activityType === 'proof' || activityType === 'epub' || activityType === 'calibr') {
            pageRangeGroup.style.display = 'block';
        } else {
            pageRangeGroup.style.display = 'none';
        }
    }

    // Form Handlers
    async handleEmployeeSubmit(e) {
        e.preventDefault();
        const name = document.getElementById('employeeName').value.trim();
        const username = document.getElementById('employeeUsername').value.trim();
        const password = document.getElementById('employeePassword').value.trim();

        if (!name) {
            alert('Please enter an employee name');
            return;
        }

        try {
            if (this.editingEmployeeId) {
                // For update, we might only update name, or also credentials if provided
                await this.updateEmployee(this.editingEmployeeId, name, username, password);
            } else {
                if (!username || !password) {
                    alert('Please enter username and password for the new employee');
                    return;
                }
                await this.addEmployee(name, username, password);
            }
            this.closeEmployeeModal();
        } catch (error) {
            console.error('Error processing employee form:', error);
        }
    }

    async handleActivitySubmit(e) {
        e.preventDefault();
        console.log('handleActivitySubmit called');

        let employeeId = document.getElementById('activityEmployeeId').value;
        let timeSlot = document.getElementById('activityTimeSlot').value;

        // Fallback to dataset if inputs are empty
        if (!employeeId || !timeSlot) {
            console.warn('Hidden inputs empty, checking dataset backup...');
            const form = document.getElementById('activityForm');
            if (!employeeId) employeeId = form.dataset.employeeId;
            if (!timeSlot) timeSlot = form.dataset.timeSlot;
        }

        const type = document.getElementById('activityType').value;
        const description = document.getElementById('activityDescription').value.trim();

        console.log('Form Data (Resolved):', { employeeId, timeSlot, type, description });

        if (!employeeId || !timeSlot) {
            console.error('Missing employeeId or timeSlot even after backup check');
            alert('Error: Missing employee or time slot information. Please close the modal and try again.');
            return;
        }

        if (!type) {
            alert('Please select an activity type');
            return;
        }

        const activityData = {
            type: type,
            description: (type === 'break' || type === 'lunch') ? type.toUpperCase() : description,
            timestamp: new Date().toISOString()
        };

        if (type === 'proof' || type === 'epub' || type === 'calibr') {
            const startPage = document.getElementById('startPage').value;
            const endPage = document.getElementById('endPage').value;

            if (startPage && endPage) {
                const start = parseInt(startPage);
                const end = parseInt(endPage);
                const total = Math.max(0, end - start + 1);

                activityData.startPage = start;
                activityData.endPage = end;
                activityData.pagesDone = total; // This is the value used for Totals Column

                // Append info to Description
                const pageInfo = ` (Pages: ${start} - ${end}, Total: ${total})`;
                if (!activityData.description.includes('Pages:')) {
                    activityData.description += pageInfo;
                }
            }
        }

        try {
            console.log('Calling setActivity with:', activityData);
            await this.setActivity(employeeId, timeSlot, activityData);
            this.closeActivityModal();
        } catch (error) {
            console.error('Error processing activity form:', error);
            alert('Error saving activity: ' + error.message);
        }
    }

    handleClearActivity() {
        let employeeId = document.getElementById('activityEmployeeId').value;
        let timeSlot = document.getElementById('activityTimeSlot').value;

        // Fallback to dataset if inputs are empty
        if (!employeeId || !timeSlot) {
            console.warn('Hidden inputs empty in clear handler, checking dataset backup...');
            const form = document.getElementById('activityForm');
            if (!employeeId) employeeId = form.dataset.employeeId;
            if (!timeSlot) timeSlot = form.dataset.timeSlot;
        }

        if (!employeeId || !timeSlot) {
            alert('Error: Could not identify activity to clear.');
            return;
        }

        if (confirm('Are you sure you want to clear this activity?')) {
            this.clearActivity(employeeId, timeSlot);
            this.closeActivityModal();
        }
    }

    isEmployeeOnFullDayLeave(employeeId) {
        const firstSlot = this.timeSlots[0];
        const activity = this.getActivity(employeeId, firstSlot);
        return activity && activity.type === 'leave' && activity.description === 'FULL_DAY_LEAVE';
    }

    async executeFullDayLeave(employeeId) {
        const dateKey = this.getDateKey(this.currentDate);

        // Mark only the first time slot with a special full day leave marker
        const leaveActivity = {
            type: 'leave',
            description: 'FULL_DAY_LEAVE',
            timestamp: new Date().toISOString()
        };

        try {
            await this.setActivity(employeeId, this.timeSlots[0], leaveActivity);

            // Clear all other time slots
            for (let i = 1; i < this.timeSlots.length; i++) {
                await this.clearActivity(employeeId, this.timeSlots[i]);
            }

            this.renderTimesheet();
            this.closeEmployeeActionModal();
            this.showStatus('Employee marked as Full Day Leave', 'success');
        } catch (error) {
            console.error('Error marking full day leave:', error);
            this.showStatus('Failed to mark full day leave', 'error');
        }
    }

    async clearFullDayLeave(employeeId) {
        if (!confirm('Clear Full Day Leave for this employee?')) return;

        try {
            await this.clearActivity(employeeId, this.timeSlots[0]);
            this.renderTimesheet();
            this.showStatus('Full Day Leave cleared', 'success');
        } catch (error) {
            console.error('Error clearing full day leave:', error);
            this.showStatus('Failed to clear full day leave', 'error');
        }
    }

    showTimeSelectionForm(actionType) {
        console.log('Showing time selection for:', actionType);
        console.log('Current selectedEmployeeId:', this.selectedEmployeeId);

        // Restore ID from hidden input if missing
        if (!this.selectedEmployeeId) {
            const hiddenInput = document.getElementById('actionEmployeeId');
            if (hiddenInput && hiddenInput.value) {
                this.selectedEmployeeId = hiddenInput.value;
                console.log('Restored selectedEmployeeId from hidden input:', this.selectedEmployeeId);
            }
        }

        this.currentActionType = actionType;

        // Hide action buttons, show time selection form
        document.getElementById('actionButtons').style.display = 'none';
        document.getElementById('timeSelectionForm').style.display = 'block';

        // Update title
        const title = actionType === 'leave' ? 'Mark Leave' : 'Mark Permission';
        document.getElementById('timeSelectionTitle').textContent = title;

        // Show/hide full day checkbox (only for leave)
        const fullDayGroup = document.getElementById('fullDayGroup');
        if (actionType === 'leave') {
            fullDayGroup.style.display = 'block';
        } else {
            fullDayGroup.style.display = 'none';
        }

        // Show/hide permission reason (only for permission)
        const permissionReasonGroup = document.getElementById('permissionReasonGroup');
        if (actionType === 'permission') {
            permissionReasonGroup.style.display = 'block';
        } else {
            permissionReasonGroup.style.display = 'none';
        }

        // Populate time slot dropdowns
        this.populateTimeSlotDropdowns();

        // Reset form
        document.getElementById('fullDayCheck').checked = false;
        document.getElementById('startSlot').disabled = false;
        document.getElementById('endSlot').disabled = false;
        document.getElementById('permissionReason').value = '';
    }

    hideTimeSelectionForm() {
        document.getElementById('actionButtons').style.display = 'flex';
        document.getElementById('timeSelectionForm').style.display = 'none';
        this.currentActionType = null;
    }

    populateTimeSlotDropdowns() {
        const startSlot = document.getElementById('startSlot');
        const endSlot = document.getElementById('endSlot');

        // Clear existing options
        startSlot.innerHTML = '';
        endSlot.innerHTML = '';

        // Populate with time slots
        this.timeSlots.forEach((slot, index) => {
            const startOption = document.createElement('option');
            startOption.value = slot;
            startOption.textContent = slot;
            startSlot.appendChild(startOption);

            const endOption = document.createElement('option');
            endOption.value = slot;
            endOption.textContent = slot;
            endSlot.appendChild(endOption);
        });

        // Set default: start at first slot, end at last slot
        startSlot.value = this.timeSlots[0];
        endSlot.value = this.timeSlots[this.timeSlots.length - 1];
    }

    async handleLeavePermissionSubmit() {
        console.log('Submitting leave/permission...');
        const fullDayCheck = document.getElementById('fullDayCheck').checked;
        const startSlot = document.getElementById('startSlot').value;
        const endSlot = document.getElementById('endSlot').value;
        const permissionReason = document.getElementById('permissionReason').value.trim();

        // Ensure we have the employee ID
        if (!this.selectedEmployeeId) {
            const hiddenInput = document.getElementById('actionEmployeeId');
            if (hiddenInput && hiddenInput.value) {
                this.selectedEmployeeId = hiddenInput.value;
                console.log('Restored selectedEmployeeId from hidden input in submit:', this.selectedEmployeeId);
            }
        }

        console.log('Final selectedEmployeeId for submit:', this.selectedEmployeeId);

        if (!this.selectedEmployeeId) {
            console.error('No employee selected for leave/permission submit');
            this.showStatus('No employee selected', 'error');
            return;
        }

        // Validate time range
        const startIndex = this.timeSlots.indexOf(startSlot);
        const endIndex = this.timeSlots.indexOf(endSlot);

        if (startIndex > endIndex) {
            this.showStatus('End time must be after start time', 'error');
            return;
        }

        // For permission, require a reason
        if (this.currentActionType === 'permission' && !permissionReason) {
            this.showStatus('Please enter a reason for permission', 'error');
            return;
        }

        try {
            if (this.currentActionType === 'leave' && fullDayCheck) {
                // Full day leave
                await this.executeFullDayLeave(this.selectedEmployeeId);
            } else {
                // Partial leave or permission
                const activityType = this.currentActionType; // 'leave' or 'permission'
                const description = this.currentActionType === 'permission'
                    ? permissionReason
                    : `${startSlot} to ${endSlot} `;

                // Mark all slots in the range
                for (let i = startIndex; i <= endIndex; i++) {
                    const slot = this.timeSlots[i];
                    await this.setActivity(this.selectedEmployeeId, slot, {
                        type: activityType,
                        description: description,
                        timestamp: new Date().toISOString()
                    });
                }

                this.renderTimesheet();
                this.showStatus(`${activityType === 'leave' ? 'Leave' : 'Permission'} marked successfully`, 'success');
            }

            this.closeEmployeeActionModal();
        } catch (error) {
            console.error('Error marking leave/permission:', error);
            this.showStatus('Failed to mark leave/permission', 'error');
        }
    }
    changeDate(days) {
        this.currentDate.setDate(this.currentDate.getDate() + days);
        this.setDateInput();
        this.renderTimesheet();
    }

    setToday() {
        this.currentDate = new Date();
        this.setDateInput();
        this.renderTimesheet();
    }

    handleDateChange(e) {
        const selectedDate = new Date(e.target.value + 'T00:00:00');
        if (!isNaN(selectedDate.getTime())) {
            this.currentDate = selectedDate;
            this.renderTimesheet();
        }
    }

    // Export Methods
    exportToExcel() {
        const dateKey = this.getDateKey(this.currentDate);
        window.location.href = `/api/export?dateKey=${dateKey}`;
    }

    editEmployee(id) {
        this.openEmployeeModal(id);
    }

    // Event Listeners Setup
    setupEventListeners() {
        console.log('Setting up event listeners...');

        // Employee Modal
        const addEmployeeBtn = document.getElementById('addEmployeeBtn');
        if (addEmployeeBtn) {
            console.log('addEmployeeBtn found, attaching listener');
            addEmployeeBtn.addEventListener('click', () => {
                console.log('Add Employee clicked');
                this.openEmployeeModal();
            });
        } else { console.error('addEmployeeBtn not found'); }

        const closeModal = document.getElementById('closeModal');
        if (closeModal) {
            closeModal.addEventListener('click', () => {
                this.closeEmployeeModal();
            });
        }

        const cancelBtn = document.getElementById('cancelBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.closeEmployeeModal();
            });
        }

        // Employee Action Modal
        const closeEmployeeActionModal = document.getElementById('closeEmployeeActionModal');
        if (closeEmployeeActionModal) {
            closeEmployeeActionModal.addEventListener('click', () => {
                this.closeEmployeeActionModal();
            });
        }

        const cancelActionBtn = document.getElementById('cancelActionBtn');
        if (cancelActionBtn) {
            cancelActionBtn.addEventListener('click', () => {
                this.closeEmployeeActionModal();
            });
        }

        // Leave and Permission Option Buttons
        const markLeaveOptionBtn = document.getElementById('markLeaveOptionBtn');
        if (markLeaveOptionBtn) {
            markLeaveOptionBtn.addEventListener('click', () => {
                this.showTimeSelectionForm('leave');
            });
        }

        const markPermissionOptionBtn = document.getElementById('markPermissionOptionBtn');
        if (markPermissionOptionBtn) {
            markPermissionOptionBtn.addEventListener('click', () => {
                this.showTimeSelectionForm('permission');
            });
        }

        // Back to Actions Button
        const backToActionsBtn = document.getElementById('backToActionsBtn');
        if (backToActionsBtn) {
            backToActionsBtn.addEventListener('click', () => {
                this.hideTimeSelectionForm();
            });
        }

        // Confirm Action Button
        const confirmActionBtn = document.getElementById('confirmActionBtn');
        if (confirmActionBtn) {
            confirmActionBtn.addEventListener('click', () => {
                this.handleLeavePermissionSubmit();
            });
        }

        // Full Day Checkbox
        const fullDayCheck = document.getElementById('fullDayCheck');
        if (fullDayCheck) {
            fullDayCheck.addEventListener('change', (e) => {
                const startSlot = document.getElementById('startSlot');
                const endSlot = document.getElementById('endSlot');
                if (e.target.checked) {
                    startSlot.disabled = true;
                    endSlot.disabled = true;
                } else {
                    startSlot.disabled = false;
                    endSlot.disabled = false;
                }
            });
        }

        const employeeForm = document.getElementById('employeeForm');
        if (employeeForm) {
            console.log('employeeForm found, attaching listener');
            employeeForm.addEventListener('submit', (e) => {
                console.log('Employee form submitted');
                this.handleEmployeeSubmit(e);
            });
        } else { console.error('employeeForm not found'); }

        // Activity Modal
        const closeActivityModal = document.getElementById('closeActivityModal');
        if (closeActivityModal) {
            console.log('Found closeActivityModal');
            closeActivityModal.addEventListener('click', () => {
                console.log('Close Activity Modal clicked');
                this.closeActivityModal();
            });
        } else { console.error('closeActivityModal not found'); }

        const cancelActivityBtn = document.getElementById('cancelActivityBtn');
        if (cancelActivityBtn) {
            console.log('Found cancelActivityBtn');
            cancelActivityBtn.addEventListener('click', () => {
                console.log('Cancel Activity clicked');
                this.closeActivityModal();
            });
        } else { console.error('cancelActivityBtn not found'); }

        const clearActivityBtn = document.getElementById('clearActivityBtn');
        if (clearActivityBtn) {
            console.log('Found clearActivityBtn');
            clearActivityBtn.addEventListener('click', () => {
                console.log('Clear Activity clicked');
                this.handleClearActivity();
            });
        } else { console.error('clearActivityBtn not found'); }

        const activityForm = document.getElementById('activityForm');
        if (activityForm) {
            console.log('activityForm found, attaching listener');
            activityForm.addEventListener('submit', (e) => {
                console.log('Activity form submitted');
                this.handleActivitySubmit(e);
            });
        } else { console.error('activityForm not found'); }

        const activityType = document.getElementById('activityType');
        if (activityType) {
            activityType.addEventListener('change', () => {
                this.updateActivityDescVisibility();
            });
        }

        const prevDay = document.getElementById('prevDay');
        if (prevDay) {
            prevDay.addEventListener('click', () => {
                this.changeDate(-1);
            });
        }

        const nextDay = document.getElementById('nextDay');
        if (nextDay) {
            nextDay.addEventListener('click', () => {
                this.changeDate(1);
            });
        }

        const todayBtn = document.getElementById('todayBtn');
        if (todayBtn) {
            todayBtn.addEventListener('click', () => {
                this.setToday();
            });
        }

        const dateInput = document.getElementById('dateInput');
        if (dateInput) {
            dateInput.addEventListener('change', (e) => {
                this.handleDateChange(e);
            });
        }

        // Page Calculator Listeners
        const startPageInput = document.getElementById('startPage');
        const endPageInput = document.getElementById('endPage');
        const calcSpan = document.getElementById('calculatedTotal');

        const calculatePages = () => {
            const start = parseInt(startPageInput.value) || 0;
            const end = parseInt(endPageInput.value) || 0;
            if (start && end) {
                const total = Math.max(0, end - start + 1); // Inclusive count
                calcSpan.textContent = total;
            } else {
                calcSpan.textContent = '0';
            }
        };

        if (startPageInput) startPageInput.addEventListener('input', calculatePages);
        if (endPageInput) endPageInput.addEventListener('input', calculatePages);

        // Export
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportToExcel();
            });
        }

        // Close modals on overlay click
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.closeEmployeeModal();
                    this.closeActivityModal();
                }
            });
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeEmployeeModal();
                this.closeActivityModal();
            }
        });

        // Confirm Modal Listeners
        const confirmOkBtn = document.getElementById('confirmOkBtn');
        if (confirmOkBtn) {
            confirmOkBtn.addEventListener('click', () => {
                if (this.pendingConfirmAction) {
                    this.pendingConfirmAction();
                    this.pendingConfirmAction = null;
                } else if (this.pendingDeleteId) { // Legacy fallback if needed during transition
                    this.executeDeleteEmployee(this.pendingDeleteId);
                    this.pendingDeleteId = null;
                }
                const modal = document.getElementById('confirmModal');
                if (modal) modal.classList.remove('show');
            });
        }

        const confirmCancelBtn = document.getElementById('confirmCancelBtn');
        if (confirmCancelBtn) {
            confirmCancelBtn.addEventListener('click', () => {
                this.pendingDeleteId = null;
                this.pendingConfirmAction = null;
                const modal = document.getElementById('confirmModal');
                if (modal) modal.classList.remove('show');
            });
        }

        // Logout Button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showConfirmModal(
                    'Logout',
                    'Are you sure you want to logout?',
                    () => {
                        localStorage.removeItem('currentUser');
                        sessionStorage.clear();
                        window.location.href = 'login.html';
                    },
                    'Logout',
                    'btn-danger'
                );
            });
        }

        // Event delegation for dynamically generated action buttons
        document.addEventListener('click', (e) => {
            console.log('Document click detected on:', e.target.tagName, e.target.className);
            // Handle Edit/Delete buttons in the table
            const actionBtn = e.target.closest('[data-action]');
            if (actionBtn) {
                const action = actionBtn.dataset.action;
                const employeeId = actionBtn.dataset.employeeId;

                console.log('Action button found:', action, 'EmployeeID:', employeeId);

                if (action === 'edit') {
                    console.log('Triggering edit...');
                    this.editEmployee(employeeId);
                } else if (action === 'delete') {
                    console.log('Triggering delete...');
                    this.deleteEmployee(employeeId);
                }
                return;
            } else {
                console.log('No action button found in ancestor path');
            }
        });
    }
}


// Removing duplicate initApp logic. ActivityTracker follows.

class ActivityTracker {
    constructor() {
        this.activities = [];
        this.maxItems = 50;
        this.init();
    }

    async init() {
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const trackerCard = document.querySelector('.activity-tracker-card');

        // Show activity tracker for both admin and employees
        if (trackerCard) trackerCard.style.display = 'block';

        this.setupClearButton();
        await this.loadActivities();
        this.updateDisplay();
    }

    async loadActivities() {
        try {
            const response = await fetch('/api/activity-log?limit=' + this.maxItems);
            if (!response.ok) throw new Error('Failed to load activity log');

            const logs = await response.json();
            if (!Array.isArray(logs)) {
                console.error('Activity logs is not an array:', logs);
                this.activities = [];
                return;
            }

            // Get current user to filter activities
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
            const isAdmin = currentUser.role === 'admin';
            const currentUsername = currentUser.username;

            // Filter activities based on role
            let filteredLogs = logs;
            if (!isAdmin && currentUsername) {
                // For employees, show only their own activities
                filteredLogs = logs.filter(log => log.employeeName === currentUsername);
            }

            this.activities = filteredLogs.map(log => ({
                id: log.id,
                employeeName: log.employeeName,
                activityType: log.activityType,
                description: log.description,
                timeSlot: log.timeSlot,
                action: log.action,
                editedBy: log.editedBy,
                timestamp: log.timestamp,
                timeAgo: this.formatTimeAgo(new Date(log.createdAt))
            }));
        } catch (error) {
            console.error('Error loading activity log:', error);
        }
    }

    setupClearButton() {
        const clearBtn = document.getElementById('clearTrackerBtn');
        if (clearBtn) {
            // Check Role
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
            if (currentUser.role !== 'admin') {
                clearBtn.style.display = 'none';
                return;
            }

            clearBtn.addEventListener('click', () => {
                const doClear = async () => {
                    try {
                        const response = await fetch('/api/activity-log', {
                            method: 'DELETE'
                        });
                        if (!response.ok) throw new Error('Failed to clear activity log');

                        this.activities = [];
                        this.updateDisplay();
                    } catch (error) {
                        console.error('Error clearing activity log:', error);
                        alert('Failed to clear activity history');
                    }
                };

                if (window.timesheetManager && window.timesheetManager.showConfirmModal) {
                    window.timesheetManager.showConfirmModal(
                        'Clear Activity History',
                        'Are you sure you want to clear all activity history? This triggers a permanent delete.',
                        doClear,
                        'Clear History',
                        'btn-danger'
                    );
                } else {
                    if (confirm('Clear all activity history? This will permanently delete all logged activities.')) {
                        doClear();
                    }
                }
            });
        }
    }

    async addActivity(employeeName, activityType, description, timeSlot, action = 'updated') {
        console.log('ActivityTracker.addActivity called:', { employeeName, activityType, timeSlot });

        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        const editedBy = currentUser ? currentUser.username : 'Unknown';

        const now = new Date();
        const activity = {
            employeeName,
            activityType,
            description,
            timeSlot,
            action, // 'updated', 'cleared', 'added'
            editedBy,
            timestamp: now.toISOString(),
            timeAgo: this.formatTimeAgo(now)
        };

        // Save to database
        try {
            const response = await fetch('/api/activity-log', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(activity)
            });

            if (!response.ok) throw new Error('Failed to save activity log');

            const savedActivity = await response.json();
            activity.id = savedActivity.id;

            // Add to beginning of array
            this.activities.unshift(activity);

            // Keep only last maxItems
            if (this.activities.length > this.maxItems) {
                this.activities.pop();
            }

            this.updateDisplay();
        } catch (error) {
            console.error('Error saving activity log:', error);
        }
    }

    formatTimeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);

        if (seconds < 5) return 'Just now';
        if (seconds < 60) return `${seconds}s ago`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    }

    formatExactTime(isoString) {
        const date = new Date(isoString);
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();

        return `${day} /${month}/${year} ${hours}:${minutes}:${seconds} `;
    }

    getActivityIcon(type) {
        const icons = {
            work: 'W',
            break: 'B',
            lunch: 'L',
            meeting: 'M'
        };
        return icons[type] || 'A';
    }

    getActionText(action, type) {
        if (action === 'cleared') return 'cleared activity';
        if (action === 'added') return `added ${type} `;
        return `updated ${type} `;
    }

    updateDisplay() {
        const trackerList = document.getElementById('activityTrackerList');
        if (!trackerList) {
            console.error('activityTrackerList element not found!');
            return;
        }
        console.log('Updating tracker display with', this.activities.length, 'items');

        if (this.activities.length === 0) {
            trackerList.innerHTML = `
    <div class="activity-tracker-empty">
        <p>No recent activity</p>
    </div>
    `;
            return;
        }

        trackerList.innerHTML = this.activities.map(activity => {
            const icon = this.getActivityIcon(activity.activityType);
            const actionText = this.getActionText(activity.action, activity.activityType);
            const desc = activity.description || '';
            const exactTime = this.formatExactTime(activity.timestamp);

            return `
    <div class="activity-tracker-item type-${activity.activityType}">
                    <div class="activity-tracker-icon type-${activity.activityType}">
                        ${icon}
                    </div>
                    <div class="activity-tracker-details">
                        <div class="activity-tracker-content">
                            <div class="activity-tracker-employee">${activity.employeeName}</div>
                            <div class="activity-tracker-description">${actionText}${desc ? ': ' + desc : ''}</div>
                            <div style="font-size: var(--font-size-xs); color: var(--text-muted);">
                                ${activity.timeSlot} • <span style="color: var(--royal-blue);">By: ${activity.editedBy || 'System'}</span>
                            </div>
                        </div>
                        <div class="activity-tracker-meta">
                            <div class="activity-tracker-time">${activity.timeAgo}</div>
                            <div>${exactTime}</div>
                        </div>
                    </div>
                </div>
    `;
        }).join('');
    }
}

// Initialize activity tracker
function initTracker() {
    try {
        if (!window.activityTracker) {
            window.activityTracker = new ActivityTracker();
            console.log('ActivityTracker initialized');
        }
    } catch (error) {
        console.error('Error initializing ActivityTracker:', error);
    }
}

function startApplication() {
    initTracker();
    try {
        if (!window.timesheetManager) {
            console.log('Instantiating TimesheetManager...');
            window.timesheetManager = new TimesheetManager();
        }
    } catch (e) {
        console.error('Error starting TimesheetManager:', e);
        alert('Failed to start application. Check console.');
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startApplication);
} else {
    startApplication();
}




