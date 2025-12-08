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
        this.startHourlyReminder();
        await this.loadData();
        await this.syncEmployees();
        this.renderTimesheet();
        this.handlePreloader();
        console.log('TimesheetManager initialization complete');
    }

    handlePreloader() {
        const preloader = document.getElementById('preloader');
        if (!preloader) return;
        const hasLoadedBefore = sessionStorage.getItem('hasLoadedBefore');
        if (hasLoadedBefore) {
            preloader.style.display = 'none';
        } else {
            sessionStorage.setItem('hasLoadedBefore', 'true');
            setTimeout(() => {
                preloader.classList.add('hide');
                setTimeout(() => { preloader.style.display = 'none'; }, 800);
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
            this.activities = await actRes.json();
        } catch (e) {
            console.error('Error loading data:', e);
            this.showStatus('Error connecting to server', 'error');
        }
    }

    async syncEmployees() {
        // Cleanup duplicates if any
        const seen = new Set();
        const duplicates = [];
        for (const emp of this.employees) {
            if (seen.has(emp.name)) duplicates.push(emp);
            else seen.add(emp.name);
        }
        for (const emp of duplicates) {
            await this.deleteEmployee(emp.id, true);
        }
        if (duplicates.length > 0) await this.loadData();
    }

    // Date Methods
    setDateInput() {
        const dateInput = document.getElementById('dateInput');
        if (dateInput) dateInput.value = this.formatDateForInput(this.currentDate);
    }

    formatDateForInput(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
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
            const payload = { ...employee, name: name.trim() };
            if (username) payload.username = username;
            if (password) payload.password = password;
            try {
                const res = await fetch('/api/employees', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (res.ok) {
                    employee.name = name.trim();
                    this.renderTimesheet();
                    this.showStatus('Employee updated');
                }
            } catch (e) {
                this.showStatus('Error updating employee', 'error');
            }
        }
    }

    async deleteEmployee(id, skipConfirm = false) {
        const doDelete = async () => {
            try {
                const res = await fetch(`/api/employees/${id}`, { method: 'DELETE' });
                if (res.ok) {
                    this.employees = this.employees.filter(emp => emp.id !== id);
                    Object.keys(this.activities).forEach(dateKey => {
                        if (this.activities[dateKey][id]) delete this.activities[dateKey][id];
                    });
                    this.renderTimesheet();
                    this.showStatus('Employee deleted');
                }
            } catch (e) {
                this.showStatus('Error deleting employee', 'error');
            }
        };

        if (skipConfirm) {
            await doDelete();
        } else {
            this.showConfirmModal('Delete Employee', 'Are you sure?', doDelete);
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
        const payload = { dateKey, employeeId, timeSlot, ...activityData };
        try {
            const res = await fetch('/api/activities', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                if (!this.activities[dateKey]) this.activities[dateKey] = {};
                if (!this.activities[dateKey][employeeId]) this.activities[dateKey][employeeId] = {};
                this.activities[dateKey][employeeId][timeSlot] = activityData;

                const employee = this.employees.find(emp => emp.id === employeeId);
                if (employee && window.activityTracker) {
                    window.activityTracker.addActivity(employee.name, activityData.type, activityData.description, timeSlot, 'updated');
                }
                this.renderTimesheet();
                this.showStatus('Activity saved automatically');
            }
        } catch (e) {
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
                const employee = this.employees.find(emp => emp.id === employeeId);
                const activity = this.getActivity(employeeId, timeSlot);
                if (this.activities[dateKey]?.[employeeId]?.[timeSlot]) {
                    delete this.activities[dateKey][employeeId][timeSlot];
                }
                if (employee && activity && window.activityTracker) {
                    window.activityTracker.addActivity(employee.name, activity.type, activity.description, timeSlot, 'cleared');
                }
                this.renderTimesheet();
                this.showStatus('Activity cleared');
            }
        } catch (e) {
            this.showStatus('Error clearing activity', 'error');
        }
    }

    // Modal & UI Helpers
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

    openEmployeeModal(employeeId = null) {
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
        if (window.openModal) window.openModal('employeeModal');
        else modal.classList.add('show');
    }

    closeEmployeeModal() {
        if (window.closeModal) window.closeModal();
        else document.getElementById('employeeModal').classList.remove('show');
        this.editingEmployeeId = null;
    }

    openActivityModal(employeeId, timeSlot) {
        const modal = document.getElementById('activityModal');
        const activity = this.getActivity(employeeId, timeSlot);
        const employee = this.employees.find(emp => emp.id === employeeId);
        if (!employee) return;

        document.getElementById('activityEmployeeId').value = employeeId;
        document.getElementById('activityTimeSlot').value = timeSlot;
        document.getElementById('activityModalTitle').textContent = `${employee.name} - ${timeSlot}`;

        if (activity) {
            document.getElementById('activityType').value = activity.type;
            document.getElementById('activityDescription').value = (activity.description || '').split(' (Pages:')[0];
            if (['proof', 'epub', 'calibr'].includes(activity.type)) {
                document.getElementById('startPage').value = activity.startPage || '';
                document.getElementById('endPage').value = activity.endPage || '';
                document.getElementById('calculatedTotal').textContent = activity.pagesDone || '0';
            }
        } else {
            document.getElementById('activityType').value = 'epub';
            document.getElementById('activityDescription').value = '';
            document.getElementById('startPage').value = '';
            document.getElementById('endPage').value = '';
            document.getElementById('calculatedTotal').textContent = '0';
        }

        this.updateActivityDescVisibility();

        // Admin Read-Only Check
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const saveBtn = document.querySelector('#activityForm button[type="submit"]');
        const clearBtn = document.getElementById('clearActivityBtn');
        const inputs = modal.querySelectorAll('input, select, textarea');
        let isReadOnly = (currentUser.role === 'admin' && currentUser.employeeId !== employeeId);

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

        if (window.openModal) window.openModal('activityModal');
        else modal.classList.add('show');
    }

    closeActivityModal() {
        if (window.closeModal) window.closeModal();
        else document.getElementById('activityModal').classList.remove('show');
    }

    openEmployeeActionModal(employeeId, employeeName) {
        document.getElementById('actionEmployeeId').value = employeeId;
        this.selectedEmployeeId = employeeId;
        document.getElementById('employeeActionTitle').textContent = `Select an action for ${employeeName}:`;
        if (window.openModal) window.openModal('employeeActionModal');
        else document.getElementById('employeeActionModal').classList.add('show');
    }

    closeEmployeeActionModal() {
        if (window.closeModal) window.closeModal();
        else document.getElementById('employeeActionModal').classList.remove('show');
    }

    updateActivityDescVisibility() {
        const activityType = document.getElementById('activityType').value;
        const pageRangeGroup = document.getElementById('pageRangeGroup');
        pageRangeGroup.style.display = ['proof', 'epub', 'calibr'].includes(activityType) ? 'block' : 'none';
    }

    // Leave & Permission Logic
    isEmployeeOnFullDayLeave(employeeId) {
        const firstSlot = this.timeSlots[0];
        const activity = this.getActivity(employeeId, firstSlot);
        return activity && activity.type === 'leave' && activity.description === 'FULL_DAY_LEAVE';
    }

    async executeFullDayLeave(employeeId) {
        try {
            await this.setActivity(employeeId, this.timeSlots[0], {
                type: 'leave', description: 'FULL_DAY_LEAVE', timestamp: new Date().toISOString()
            });
            for (let i = 1; i < this.timeSlots.length; i++) {
                await this.clearActivity(employeeId, this.timeSlots[i]);
            }
            this.renderTimesheet();
            this.closeEmployeeActionModal();
            this.showStatus('Full Day Leave Marked', 'success');
        } catch (e) { this.showStatus('Failed to mark leave', 'error'); }
    }

    async clearFullDayLeave(employeeId) {
        if (confirm('Clear Full Day Leave?')) {
            await this.clearActivity(employeeId, this.timeSlots[0]);
            this.renderTimesheet();
        }
    }

    showTimeSelectionForm(actionType) {
        this.currentActionType = actionType;
        document.getElementById('actionButtons').style.display = 'none';
        document.getElementById('timeSelectionForm').style.display = 'block';
        document.getElementById('timeSelectionTitle').textContent = actionType === 'leave' ? 'Mark Leave' : 'Mark Permission';

        document.getElementById('fullDayGroup').style.display = actionType === 'leave' ? 'block' : 'none';
        document.getElementById('permissionReasonGroup').style.display = actionType === 'permission' ? 'block' : 'none';

        this.populateTimeSlotDropdowns();
    }

    hideTimeSelectionForm() {
        document.getElementById('actionButtons').style.display = 'flex';
        document.getElementById('timeSelectionForm').style.display = 'none';
    }

    populateTimeSlotDropdowns() {
        const startSlot = document.getElementById('startSlot');
        const endSlot = document.getElementById('endSlot');
        startSlot.innerHTML = '';
        endSlot.innerHTML = '';
        this.timeSlots.forEach(slot => {
            startSlot.appendChild(new Option(slot, slot));
            endSlot.appendChild(new Option(slot, slot));
        });
        startSlot.value = this.timeSlots[0];
        endSlot.value = this.timeSlots[this.timeSlots.length - 1];
    }

    async handleLeavePermissionSubmit() {
        const fullDayCheck = document.getElementById('fullDayCheck').checked;
        const startSlot = document.getElementById('startSlot').value;
        const endSlot = document.getElementById('endSlot').value;
        const permissionReason = document.getElementById('permissionReason').value.trim();

        if (this.currentActionType === 'leave' && fullDayCheck) {
            await this.executeFullDayLeave(this.selectedEmployeeId);
        } else {
            const startIndex = this.timeSlots.indexOf(startSlot);
            const endIndex = this.timeSlots.indexOf(endSlot);
            if (startIndex > endIndex) { return this.showStatus('End time must be after start', 'error'); }

            const desc = this.currentActionType === 'permission' ? permissionReason : `${startSlot} to ${endSlot}`;
            for (let i = startIndex; i <= endIndex; i++) {
                await this.setActivity(this.selectedEmployeeId, this.timeSlots[i], {
                    type: this.currentActionType, description: desc, timestamp: new Date().toISOString()
                });
            }
            this.renderTimesheet();
            this.closeEmployeeActionModal();
        }
    }

    // Render Logic
    renderTimesheet() {
        try {
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
            const isEmployee = currentUser.role !== 'admin';
            this.employees.sort((a, b) => a.name.localeCompare(b.name));

            const tbody = document.getElementById('timesheetBody');
            const emptyState = document.getElementById('emptyState');
            const timesheetContainer = document.querySelector('.timesheet-container');

            if (this.employees.length === 0) {
                if (emptyState) emptyState.classList.add('show');
                if (timesheetContainer) timesheetContainer.style.display = 'none';
                return;
            }
            if (emptyState) emptyState.classList.remove('show');
            if (timesheetContainer) timesheetContainer.style.display = 'block';

            tbody.innerHTML = '';

            // Layout based on role
            const mainContainer = document.querySelector('.main-content');
            if (isEmployee && mainContainer) mainContainer.classList.add('employee-view-centered');
            else if (mainContainer) mainContainer.classList.remove('employee-view-centered');

            const employeesToRender = isEmployee
                ? this.employees.filter(e => e.id === currentUser.employeeId || e.username === currentUser.username)
                : this.employees;

            employeesToRender.forEach(employee => {
                const row = document.createElement('tr');
                const nameCell = document.createElement('td');
                nameCell.className = 'sticky-col';
                nameCell.textContent = employee.name;
                nameCell.onclick = () => !isEmployee && this.openEmployeeActionModal(employee.id, employee.name);
                if (!isEmployee) nameCell.style.cursor = 'pointer';
                row.appendChild(nameCell);

                const isOnLeave = this.isEmployeeOnFullDayLeave(employee.id);
                let proofTotal = 0, epubTotal = 0, calibrTotal = 0;

                if (!isOnLeave) {
                    this.timeSlots.forEach(slot => {
                        const act = this.getActivity(employee.id, slot);
                        if (act && act.pagesDone) {
                            const p = parseInt(act.pagesDone) || 0;
                            if (act.type === 'proof') proofTotal += p;
                            if (act.type === 'epub') epubTotal += p;
                            if (act.type === 'calibr') calibrTotal += p;
                        }
                    });
                }

                const createTotal = (val, cls) => {
                    const td = document.createElement('td');
                    td.className = cls;
                    td.textContent = val > 0 ? val : '-';
                    if (val > 0) td.style.fontWeight = 'bold';
                    return td;
                };
                row.appendChild(createTotal(proofTotal, 'sub-col proof-col'));
                row.appendChild(createTotal(epubTotal, 'sub-col epub-col'));
                row.appendChild(createTotal(calibrTotal, 'sub-col calibr-col'));

                if (isOnLeave) {
                    const leaveCell = document.createElement('td');
                    leaveCell.colSpan = this.timeSlots.length + 1;
                    leaveCell.className = 'full-day-leave-cell';
                    leaveCell.innerHTML = `<span class="leave-badge">LEAVE</span>`;
                    if (!isEmployee) {
                        leaveCell.innerHTML += `<button onclick="window.timesheetManager.clearFullDayLeave('${employee.id}')">X</button>`;
                    }
                    row.appendChild(leaveCell);
                } else {
                    this.timeSlots.forEach(slot => {
                        const cell = document.createElement('td');
                        cell.appendChild(this.createActivityCell(employee.id, slot));
                        row.appendChild(cell);
                    });
                    if (!isEmployee) {
                        const actionsCell = document.createElement('td');
                        actionsCell.innerHTML = `<button onclick="window.timesheetManager.editEmployee('${employee.id}')">Edit</button> <button onclick="window.timesheetManager.deleteEmployee('${employee.id}')">Del</button>`;
                        row.appendChild(actionsCell);
                    }
                }
                tbody.appendChild(row);
            });
        } catch (e) {
            console.error('Render Error', e);
        }
    }

    createActivityCell(employeeId, timeSlot) {
        const activity = this.getActivity(employeeId, timeSlot);
        const div = document.createElement('div');
        div.className = 'activity-cell';
        div.onclick = () => this.openActivityModal(employeeId, timeSlot);

        if (activity) {
            div.classList.add('has-activity', `type-${activity.type}`);
            div.innerHTML = `<div class="activity-type-badge ${activity.type}">${activity.type}</div>`;
            if (activity.description && activity.type !== 'break' && activity.type !== 'lunch') {
                div.innerHTML += `<div class="activity-description">${activity.description}</div>`;
            }
        } else {
            div.classList.add('empty');
            div.innerHTML = '<span>+ Add</span>';
        }
        return div;
    }

    showConfirmModal(title, msg, onConfirm) {
        if (confirm(`${title}\n${msg}`)) onConfirm();
    }

    // Handlers
    async handleEmployeeSubmit(e) {
        e.preventDefault();
        const name = document.getElementById('employeeName').value;
        const user = document.getElementById('employeeUsername').value;
        const pass = document.getElementById('employeePassword').value;
        if (this.editingEmployeeId) await this.updateEmployee(this.editingEmployeeId, name, user, pass);
        else await this.addEmployee(name, user, pass);
        this.closeEmployeeModal();
    }

    async handleActivitySubmit(e) {
        e.preventDefault();
        const empId = document.getElementById('activityEmployeeId').value;
        const slot = document.getElementById('activityTimeSlot').value;
        const type = document.getElementById('activityType').value;

        let desc = document.getElementById('activityDescription').value;
        let pagesDone = 0;

        if (['proof', 'epub', 'calibr'].includes(type)) {
            const start = parseInt(document.getElementById('startPage').value) || 0;
            const end = parseInt(document.getElementById('endPage').value) || 0;
            pagesDone = Math.max(0, end - start + 1);
            desc += ` (Pages: ${start} - ${end}, Total: ${pagesDone})`;
        }

        await this.setActivity(empId, slot, { type, description: desc, pagesDone, timestamp: new Date().toISOString() });
        this.closeActivityModal();
    }

    handleClearActivity() {
        const empId = document.getElementById('activityEmployeeId').value;
        const slot = document.getElementById('activityTimeSlot').value;
        if (confirm('Clear activity?')) {
            this.clearActivity(empId, slot);
            this.closeActivityModal();
        }
    }

    // Hourly Reminder
    startHourlyReminder() {
        if ("Notification" in window && Notification.permission !== "granted") {
            Notification.requestPermission();
        }
        setInterval(() => this.checkAndNotify(), 60000);
    }

    checkAndNotify() {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

        // Helper to convert slot string time to 24h
        const parseTime = (timeStr) => {
            const [hStr, mStr] = timeStr.split(':');
            let h = parseInt(hStr);
            const m = parseInt(mStr);
            if (h < 9) h += 12; // PM adjustment for 1-8
            return { h, m };
        };

        const isEndOfSlot = this.timeSlots.some(slot => {
            const parts = slot.split('-');
            if (parts.length !== 2) return false;
            const endTimeStr = parts[1].trim(); // e.g. "10:00"
            const { h, m } = parseTime(endTimeStr);
            return h === currentHour && m === currentMinute;
        });

        if (isEndOfSlot) {
            const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            this.showStatus(`⏰ It's ${timeString}. Please update your timesheet!`, 'info');
            if (Notification.permission === "granted") {
                new Notification("Timesheet Reminder", { body: `It's ${timeString}. Time to log your activity.` });
            }
        }
    }

    setupEventListeners() {
        // Modal Triggers
        const addBtn = document.getElementById('addEmployeeBtn');
        if (addBtn) addBtn.addEventListener('click', () => this.openEmployeeModal());

        document.getElementById('closeModal')?.addEventListener('click', () => this.closeEmployeeModal());
        document.getElementById('cancelBtn')?.addEventListener('click', () => this.closeEmployeeModal());
        document.getElementById('employeeForm')?.addEventListener('submit', (e) => this.handleEmployeeSubmit(e));

        // Activity Modal
        document.getElementById('closeActivityModal')?.addEventListener('click', () => this.closeActivityModal());
        document.getElementById('cancelActivityBtn')?.addEventListener('click', () => this.closeActivityModal());
        document.getElementById('activityForm')?.addEventListener('submit', (e) => this.handleActivitySubmit(e));
        document.getElementById('clearActivityBtn')?.addEventListener('click', () => this.handleClearActivity());

        document.getElementById('activityType')?.addEventListener('change', () => this.updateActivityDescVisibility());

        // Employee Action Modal (Leave, Permission) - RESTORED
        document.getElementById('closeEmployeeActionModal')?.addEventListener('click', () => this.closeEmployeeActionModal());

        const markLeave = document.getElementById('markLeaveOptionBtn');
        if (markLeave) markLeave.addEventListener('click', () => this.showTimeSelectionForm('leave'));

        const markPerm = document.getElementById('markPermissionOptionBtn');
        if (markPerm) markPerm.addEventListener('click', () => this.showTimeSelectionForm('permission'));

        document.getElementById('backToActionsBtn')?.addEventListener('click', () => this.hideTimeSelectionForm());
        document.getElementById('confirmActionBtn')?.addEventListener('click', () => this.handleLeavePermissionSubmit());

        // Navigation
        document.getElementById('prevDay')?.addEventListener('click', () => { this.currentDate.setDate(this.currentDate.getDate() - 1); this.setDateInput(); this.renderTimesheet(); });
        document.getElementById('nextDay')?.addEventListener('click', () => { this.currentDate.setDate(this.currentDate.getDate() + 1); this.setDateInput(); this.renderTimesheet(); });
        document.getElementById('todayBtn')?.addEventListener('click', () => { this.currentDate = new Date(); this.setDateInput(); this.renderTimesheet(); });
        document.getElementById('dateInput')?.addEventListener('change', (e) => { this.currentDate = new Date(e.target.value); this.renderTimesheet(); });

        // Export
        document.getElementById('exportBtn')?.addEventListener('click', () => window.location.href = `/api/export?dateKey=${this.getDateKey(this.currentDate)}`);

        // Logout
        document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('Logout?')) { localStorage.removeItem('currentUser'); window.location.href = 'login.html'; }
        });
    }
}

class ActivityTracker {
    constructor() {
        this.activities = [];
        this.maxItems = 50;
        this.init();
    }
    async init() {
        const tracker = document.querySelector('.activity-tracker-card');
        if (tracker) tracker.style.display = 'block';
        await this.loadActivities();
        this.updateDisplay();
    }
    async loadActivities() {
        const res = await fetch('/api/activity-log?limit=50');
        if (res.ok) this.activities = await res.json();
    }
    async addActivity(employeeName, activityType, description, timeSlot, action) {
        const act = { employeeName, activityType, description, timeSlot, action, timestamp: new Date().toISOString() };
        await fetch('/api/activity-log', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(act) });
        this.activities.unshift(act);
        this.updateDisplay();
    }
    updateDisplay() {
        const list = document.getElementById('activityTrackerList');
        if (!list) return;
        if (this.activities.length === 0) { list.innerHTML = '<p>No activity</p>'; return; }
        list.innerHTML = this.activities.map(a => `
            <div class="activity-tracker-item">
                <div class="activity-tracker-content">
                    <strong>${a.employeeName}</strong> ${a.action} ${a.activityType} <br>
                    <small>${a.timeSlot} - ${a.description || ''}</small>
                </div>
            </div>
        `).join('');
    }
}

// Init
window.timesheetManager = new TimesheetManager();
window.activityTracker = new ActivityTracker();
