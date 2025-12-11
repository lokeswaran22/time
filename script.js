// ==========================================
// DATA MANAGEMENT
// ==========================================

class TimesheetManager {
    constructor() {
        this.employees = []; // Now refers to users with role='employee' + 'admin'
        this.activities = {};
        this.currentDate = new Date();
        this.editingUserId = null;
        this.currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

        this.timeSlots = [
            '9:00-10:00', '10:00-11:00', '11:00-11:10', '11:10-12:00',
            '12:00-01:00', '01:00-01:40', '01:40-03:00', '03:00-03:50',
            '03:50-04:00', '04:00-05:00', '05:00-06:00', '06:00-07:00', '07:00-08:00'
        ];

        // Ensure UI updates periodically for time-based styling
        setInterval(() => this.updateTimeSlotStyles(), 60000); // Check every minute
        this.init();
    }

    async init() {
        if (!this.currentUser.id) {
            window.location.href = 'login.html';
            return;
        }

        console.log('TimesheetManager initializing...');
        this.setupEventListeners();
        this.setDateInput();
        this.startHourlyReminder();
        await this.loadData();
        this.handleRoleBasedUI();
        this.renderTimesheet();
        this.handlePreloader();
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
            }, 1000);
        }
    }

    handleRoleBasedUI() {
        this.currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const isAdmin = this.currentUser.role === 'admin';

        console.log('Role UI Update via handleRoleBasedUI. Is Admin:', isAdmin);

        // Explicitly set display style based on role
        const displayStyle = isAdmin ? 'inline-flex' : 'none';

        // Hide/Show Admin Buttons
        const addBtn = document.getElementById('addEmployeeBtn');
        if (addBtn) addBtn.style.display = displayStyle;

        // Hide/Show Export (Employees shouldn't see it per requirement)
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) exportBtn.style.display = displayStyle;

        // Hide/Show Admin Panel Link
        const adminLink = document.getElementById('adminPanelLink');
        if (adminLink) adminLink.style.display = displayStyle;

        if (!isAdmin) {
            document.body.classList.add('employee-view');
        } else {
            document.body.classList.remove('employee-view');
        }
    }

    setDateInput() {
        const dateInput = document.getElementById('dateInput'); // Changed from 'dateSelect' to 'dateInput'
        if (dateInput) {
            dateInput.value = this.getDateKey(this.currentDate);

            // Listener for date change
            dateInput.onchange = (e) => {
                this.currentDate = new Date(e.target.value);
                this.loadData().then(() => this.renderTimesheet());
            };
        }
        const display = document.getElementById('currentDateDisplay');
        if (display) {
            display.textContent = this.currentDate.toLocaleDateString('en-US', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            });
        }
    }

    getDateKey(date) {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    showStatus(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: ${type === 'error' ? '#ef4444' : '#10b981'};
            color: white;
            padding: 1rem 2rem;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // API Methods
    async loadData() {
        try {
            // Fetch Users (which acts as employees list)
            // If employee, backend might still return all users, but we filter in UI
            // Admin needs all users.
            const [userRes, actRes] = await Promise.all([
                fetch('/api/users?t=' + Date.now()),
                fetch(`/api/activities?dateKey=${this.getDateKey(this.currentDate)}&t=${Date.now()}`)
            ]);

            if (!userRes.ok || !actRes.ok) throw new Error('Failed to fetch data');

            this.employees = await userRes.json();
            this.activities = await actRes.json(); // Format: { dateKey: { userId: { timeSlot: [act1, act2] } } }

            // Reload Activity Log for this date
            if (window.activityTracker) {
                window.activityTracker.loadLogs(this.getDateKey(this.currentDate));
            }

            // Validate Session - if current user does not exist in DB (e.g. after DB reset), logout
            const userExists = this.employees.some(u => u.id == this.currentUser.id);
            if (!userExists && this.employees.length > 0) {
                console.warn('Current user not found in database. Session invalid.');
                localStorage.removeItem('currentUser');
                window.location.href = 'login.html';
                return;
            }

        } catch (e) {
            console.error('Error loading data:', e);
            this.showStatus('Error connecting to server', 'error');
        }
    }

    // ... (rest of Date/User methods same)

    // Activity Methods
    getActivity(userId, timeSlot, date = this.currentDate) {
        const dateKey = this.getDateKey(date);
        // Returns Array or null
        return this.activities[dateKey]?.[userId]?.[timeSlot] || null;
    }

    async setActivity(userId, timeSlot, activityData, date = this.currentDate) {
        const dateKey = this.getDateKey(date);
        const payload = { dateKey, userId, timeSlot, ...activityData };

        console.log('Saving activity:', payload); // Debug log

        try {
            const res = await fetch('/api/activities', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                if (!this.activities[dateKey]) this.activities[dateKey] = {};
                if (!this.activities[dateKey][userId]) this.activities[dateKey][userId] = {};
                if (!this.activities[dateKey][userId][timeSlot]) this.activities[dateKey][userId][timeSlot] = [];

                // For now, simple push. Optimally we'd replace if editing.
                // Since user requested "doing two different things", we allow adding.
                // Editing existing logic requires identifying WHICH activity in slot.
                // For now, let's assume always ADD new for this step, or simple append.
                // User asked: "what if employee doing two different in single timeslot"
                this.activities[dateKey][userId][timeSlot].push(activityData);

                if (window.activityTracker) {
                    const employee = this.employees.find(emp => emp.id == userId);
                    if (employee) {
                        // Include Date in log slot display
                        const logSlot = `${dateKey} | ${timeSlot}`; // e.g. "2025-12-11 | 9:00-10:00"
                        // Pass explicit dateKey as 6th argument
                        window.activityTracker.addActivity(employee.username, activityData.type, activityData.description, logSlot, 'updated', dateKey);
                    }
                }
                this.renderTimesheet();
                this.showStatus('Activity saved successfully!');
                console.log('Activity saved successfully');
            } else {
                const errorData = await res.json();
                console.error('Failed to save activity:', errorData);
                this.showStatus('Failed to save activity: ' + (errorData.error || 'Unknown error'), 'error');
            }
        } catch (err) {
            console.error('Error saving activity:', err);
            this.showStatus('Error saving activity: ' + err.message, 'error');
        }
    }


    // ... (skip clearActivity update for brevity, assume clear wipes slot)

    // ...

    renderTimesheet() {
        const tbody = document.getElementById('timesheetBody');
        tbody.innerHTML = '';

        const isAdmin = this.currentUser.role === 'admin';

        // Filter: Admin sees all. Employee sees self.
        const usersToShow = isAdmin
            ? this.employees.filter(u => u.role !== 'admin') // List employees for admin
            : this.employees.filter(u => u.id == this.currentUser.id); // Show only self

        if (usersToShow.length === 0) {
            tbody.innerHTML = '<tr><td colspan="100%">No users found.</td></tr>';
            return;
        }

        // Sort by name
        usersToShow.sort((a, b) => a.name.localeCompare(b.name));

        usersToShow.forEach(user => {
            const row = document.createElement('tr');

            // Name Column
            const nameTd = document.createElement('td');
            nameTd.className = 'sticky-col';
            nameTd.textContent = user.name;
            if (isAdmin || user.id == this.currentUser.id) {
                nameTd.style.cursor = 'pointer';
                nameTd.onclick = () => this.openEmployeeActionModal(user.id, user.name);
            }
            row.appendChild(nameTd);

            // Activity Counters (Proof, Epub, etc)
            // Calculate totals
            let proof = 0, epub = 0, calibr = 0;
            const slots = this.activities[this.getDateKey(this.currentDate)]?.[user.id] || {};

            // Check full day leave (simplified check on first slot)
            const firstSlotActs = slots[this.timeSlots[0]]; // Array now
            const isLeave = (firstSlotActs && firstSlotActs.length > 0 && firstSlotActs[0].type === 'leave' && firstSlotActs[0].description === 'FULL_DAY_LEAVE');

            if (!isLeave) {
                // Iterate all slots
                Object.values(slots).forEach(actList => { // actList is Array
                    if (Array.isArray(actList)) {
                        actList.forEach(act => {
                            const p = parseInt(act.pagesDone) || 0;
                            if (act.type === 'proof') proof += p;
                            if (act.type === 'epub') epub += p;
                            if (act.type === 'calibr') calibr += p;
                        });
                    }
                });
            }

            // Stats Cols
            [proof, epub, calibr].forEach((val, idx) => {
                const td = document.createElement('td');
                td.className = `sub-col ${['proof', 'epub', 'calibr'][idx]}-col`;
                td.textContent = val || '-';
                if (val) td.style.fontWeight = 'bold';
                row.appendChild(td);
            });

            // Time Slots
            if (isLeave) {
                const td = document.createElement('td');
                td.colSpan = this.timeSlots.length;
                td.className = 'full-day-leave-cell';
                td.textContent = 'ON LEAVE';
                row.appendChild(td);
            } else {
                this.timeSlots.forEach(slot => {
                    const td = document.createElement('td');
                    td.appendChild(this.createActivityCell(user.id, slot));
                    row.appendChild(td);
                });
            }

            // Actions (Admin Only)
            if (isAdmin) {
                const actionTd = document.createElement('td');
                actionTd.innerHTML = `
                    <button class="icon-btn edit-btn" title="Edit User">✎</button>
                    <button class="icon-btn del-btn" title="Delete User">🗑</button>
                `;
                actionTd.querySelector('.edit-btn').onclick = () => this.openEmployeeModal(user.id);
                actionTd.querySelector('.del-btn').onclick = () => this.deleteEmployee(user.id);
                row.appendChild(actionTd);
            }

            tbody.appendChild(row);
        });
    }

    createActivityCell(userId, timeSlot) {
        const acts = this.getActivity(userId, timeSlot); // returns Array or null
        const div = document.createElement('div');
        div.className = 'activity-cell';

        // Only employees can add/edit activities (not admins)
        const isAdmin = this.currentUser.role === 'admin';
        if (!isAdmin) {
            div.onclick = () => {
                console.log('Activity cell clicked:', { userId, timeSlot, currentUserId: this.currentUser.id, role: this.currentUser.role });
                this.openActivityModal(userId, timeSlot);
            };
            div.style.cursor = 'pointer';
        } else {
            div.style.cursor = 'default';
            div.title = 'Admins cannot add activities. Only employees can.';
        }

        if (acts && acts.length > 0) {
            div.classList.add('has-activity');

            // Show ALL activities stacked
            let html = '';
            acts.forEach(act => {
                html += `<div class="activity-item type-${act.type}" style="margin-bottom: 4px; padding: 4px; border-radius: 4px; background: rgba(255,255,255,0.1);">`;
                html += `<span class="badge" style="font-size: 0.7em;">${act.type}</span>`;
                if (act.description) {
                    html += `<div class="desc" style="font-size: 0.8em; margin-top:2px;">${act.description}</div>`;
                }
                html += `</div>`;
            });
            div.innerHTML = html;
        } else {
            div.classList.add('empty');
            div.innerHTML = '<span>+</span>';
        }
        // Check if slot is past
        if (this.isTimeSlotPast(timeSlot)) {
            div.classList.add('past-slot');
        }

        return div;
    }

    isTimeSlotPast(timeSlot) {
        // Parse time slot "9:00-10:00" etc.
        // We assume the slot string format is known and stable.
        const [startStr, endStr] = timeSlot.split('-'); // e.g., ["9:00", "10:00"]
        if (!endStr) return false;

        const now = new Date();
        const endTime = this.parseTimeStr(endStr.trim());

        return now > endTime;
    }

    parseTimeStr(timeStr) {
        // Converts "10:00", "01:00" etc to a Date object for today.
        // Logic: 9, 10, 11 -> AM. 12 -> PM (noon). 1, 2, 3.. 8 -> PM.
        const [hourStr, minuteStr] = timeStr.split(':');
        let hour = parseInt(hourStr, 10);
        const minute = parseInt(minuteStr, 10);

        // Adjust for AM/PM logic specific to this shift (9AM to 8PM)
        // If hour is between 9 and 11, it's AM (keep as is).
        // If hour is 12, it's 12 PM (keep as is).
        // If hour is 1 to 8 (inclusive), it's PM (add 12).
        if (hour >= 1 && hour <= 8) {
            hour += 12;
        }
        // Note: The logic handles 12 correctly (12 PM is 12, 12 AM would be 0).

        const date = new Date();
        date.setHours(hour, minute, 0, 0);
        return date;
    }

    updateTimeSlotStyles() {
        // Re-apply styles to all activity cells based on current time
        // This avoids full re-render
        document.querySelectorAll('.activity-cell').forEach(cell => {
            // We need to know which slot it belongs to. 
            // Since we don't store it on the element, we might need to re-render or add data attribute.
            // Let's modify creation to add data-slot.
        });
        // Actually, easiest is to just re-render if it's not expensive, OR add data attribute.
        // Let's add data-slot in createActivityCell and use it here.
        // Re-implementing createActivityCell to add data attribute first.
        // Wait, I can't easily modify createActivityCell in this block without being messy.
        // Let's just re-render the timesheet table. It's safe.
        this.renderTimesheet();
    }

    // ==========================================
    // MODAL & CRUD API METHODS (Restored)
    // ==========================================

    openEmployeeModal(userId = null) {
        const modal = document.getElementById('employeeModal');
        const title = document.getElementById('employeeModalTitle');
        const form = document.getElementById('employeeForm');

        form.reset();
        this.editingUserId = userId;

        if (userId) {
            title.textContent = 'Edit Employee';
            const user = this.employees.find(u => u.id == userId);
            if (user) {
                document.getElementById('employeeName').value = user.name;
                document.getElementById('employeeUsername').value = user.username;
                // password placeholder
            }
        } else {
            title.textContent = 'Add New Employee';
        }

        // Use global openModal if available, else legacy class
        if (window.openModal) window.openModal('employeeModal');
        else modal.classList.add('show');
    }

    closeEmployeeModal() {
        if (window.closeAllModals) window.closeAllModals();
        else document.getElementById('employeeModal')?.classList.remove('show');
        this.editingUserId = null;
    }

    async addEmployee(name, username, password, role) {
        try {
            const res = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, username, password, role })
            });
            if (res.ok) {
                this.showStatus('Employee added');
                await this.loadData();
                this.renderTimesheet();
            } else {
                const data = await res.json();
                this.showStatus(data.error || 'Failed to add', 'error');
            }
        } catch (e) {
            this.showStatus('Error adding employee', 'error');
        }
    }

    async updateEmployee(id, name, username, password, role) {
        try {
            const res = await fetch(`/api/users/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, username, password, role })
            });
            if (res.ok) {
                this.showStatus('Employee updated');
                await this.loadData();
                this.renderTimesheet();
            } else {
                this.showStatus('Failed to update', 'error');
            }
        } catch (e) {
            this.showStatus('Error updating employee', 'error');
        }
    }

    async deleteEmployee(id) {
        if (!confirm('Are you sure? This will delete all history for this user.')) return;
        try {
            const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
            if (res.ok) {
                this.showStatus('Employee deleted');
                await this.loadData();
                this.renderTimesheet();
            } else {
                this.showStatus('Failed to delete', 'error');
            }
        } catch (e) {
            this.showStatus('Error deleting employee', 'error');
        }
    }

    openActivityModal(userId, timeSlot) {
        // Permission check: Employees can only edit their own activities
        const isAdmin = this.currentUser.role === 'admin';
        if (!isAdmin && userId != this.currentUser.id) {
            alert('You can only edit your own activities.');
            return;
        }

        this.editingActivityKey = { userId, timeSlot };

        const modal = document.getElementById('activityModal');
        // Populate
        document.getElementById('activityTimeSlotDisplay').textContent = timeSlot;
        document.getElementById('activityEmployeeId').value = userId;
        document.getElementById('activityTimeSlot').value = timeSlot;

        // Reset form
        document.getElementById('activityForm').reset();

        // Load existing if any
        const acts = this.getActivity(userId, timeSlot);
        if (acts && acts.length > 0) {
            const last = acts[acts.length - 1]; // Load last logic for now
            document.getElementById('activityType').value = last.type;
            document.getElementById('activityDescription').value = last.description.split(' (Pages:')[0];
            // Pages logic parse back if needed, optional
        }

        if (window.openModal) window.openModal('activityModal');
        else modal.classList.add('show');
    }

    closeActivityModal() {
        if (window.closeAllModals) window.closeAllModals();
        else document.getElementById('activityModal')?.classList.remove('show');
    }

    async clearActivity(userId, timeSlot) {
        const dateKey = this.getDateKey(this.currentDate);
        try {
            const res = await fetch('/api/activities', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dateKey, userId, timeSlot })
            });
            if (res.ok) {
                // Remove locally
                if (this.activities[dateKey]?.[userId]?.[timeSlot]) {
                    delete this.activities[dateKey][userId][timeSlot];
                }
                this.renderTimesheet();
                this.showStatus('Activity cleared');
            }
        } catch (e) {
            this.showStatus('Error clearing', 'error');
        }
    }

    openEmployeeActionModal(userId, name) {
        document.getElementById('actionEmployeeName').textContent = name;
        this.actionUserId = userId; // Store for action
        if (window.openModal) window.openModal('employeeActionModal');
    }

    closeEmployeeActionModal() {
        if (window.closeAllModals) window.closeAllModals();
        this.actionUserId = null;
    }

    showTimeSelectionForm(type) {
        this.currentActionType = type;
        const optionsDiv = document.getElementById('actionButtons');
        if (optionsDiv) optionsDiv.style.display = 'none';

        const formDiv = document.getElementById('timeSelectionForm');
        formDiv.style.display = 'block';
        document.getElementById('timeSelectionTitle').textContent = type === 'leave' ? 'Mark Leave' : 'Mark Permission';

        // Populate slots
        const startSelect = document.getElementById('startSlot');
        const endSelect = document.getElementById('endSlot');

        if (startSelect && startSelect.options.length === 0) {
            this.timeSlots.forEach(slot => {
                startSelect.add(new Option(slot, slot));
                endSelect.add(new Option(slot, slot));
            });
        }

        // Reset check and selects
        const check = document.getElementById('fullDayCheck');
        if (check) check.checked = false;
        if (startSelect) startSelect.disabled = false;
        if (endSelect) endSelect.disabled = false;
    }

    hideTimeSelectionForm() {
        // Use ID 'actionButtons' which is consistent with HTML
        const optionsDiv = document.getElementById('actionButtons');
        if (optionsDiv) optionsDiv.style.display = 'flex';
        document.getElementById('timeSelectionForm').style.display = 'none';
    }

    async handleLeavePermissionSubmit() {
        const fullDayCheck = document.getElementById('fullDayCheck');
        const isFullDay = fullDayCheck ? fullDayCheck.checked : false;

        const start = document.getElementById('startSlot').value;
        const end = document.getElementById('endSlot').value;
        const reason = document.getElementById('permissionReason').value || 'No Reason';
        const dateKey = this.getDateKey(this.currentDate);

        // Validate
        if (!isFullDay && (!start || !end)) {
            this.showStatus('Please select time range', 'error');
            return;
        }

        try {
            if (this.currentActionType === 'leave') {
                const res = await fetch('/api/leave', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: this.actionUserId,
                        startDate: dateKey,
                        endDate: dateKey,
                        reason: isFullDay ? `Full Day: ${reason}` : `${reason} (${start} - ${end})`,
                        isFullDay
                    })
                });

                if (res.ok) {
                    this.showStatus('Leave request submitted properly');

                    if (isFullDay) {
                        for (const slot of this.timeSlots) {
                            await this.setActivity(this.actionUserId, slot, {
                                type: 'leave',
                                description: `FULL_DAY_LEAVE: ${reason}`,
                                pagesDone: '0',
                                timestamp: new Date().toISOString()
                            });
                        }
                    } else {
                        const sIdx = this.timeSlots.indexOf(start);
                        const eIdx = this.timeSlots.indexOf(end);

                        if (sIdx > -1 && eIdx > -1) {
                            const rangeSlots = this.timeSlots.slice(Math.min(sIdx, eIdx), Math.max(sIdx, eIdx) + 1);
                            for (const slot of rangeSlots) {
                                await this.setActivity(this.actionUserId, slot, {
                                    type: 'leave',
                                    description: `Partial Leave: ${reason}`,
                                    pagesDone: '0',
                                    timestamp: new Date().toISOString()
                                });
                            }
                        }
                    }
                }
            } else {
                const res = await fetch('/api/permission', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: this.actionUserId,
                        dateKey,
                        startTime: start,
                        endTime: end,
                        reason
                    })
                });

                if (res.ok) {
                    this.showStatus('Permission logged');
                    // Mark slots for permission visually
                    const sIdx = this.timeSlots.indexOf(start);
                    const eIdx = this.timeSlots.indexOf(end);
                    if (sIdx > -1 && eIdx > -1) {
                        const rangeSlots = this.timeSlots.slice(Math.min(sIdx, eIdx), Math.max(sIdx, eIdx) + 1);
                        for (const slot of rangeSlots) {
                            await this.setActivity(this.actionUserId, slot, {
                                type: 'permission',
                                description: `Permission: ${reason}`,
                                pagesDone: '0',
                                timestamp: new Date().toISOString()
                            });
                        }
                    }
                }
            }
            this.closeEmployeeActionModal();
            this.renderTimesheet();
        } catch (e) {
            console.error(e);
            this.showStatus('Error submitting request', 'error');
        }
    }



    // Handler Wrappers
    async handleEmployeeSubmit(e) {
        e.preventDefault();
        const name = document.getElementById('employeeName').value;
        const user = document.getElementById('employeeUsername').value;
        const pass = document.getElementById('employeePassword').value;

        if (this.editingUserId) {
            await this.updateEmployee(this.editingUserId, name, user, pass, 'employee');
        } else {
            await this.addEmployee(name, user, pass, 'employee');
        }
        this.closeEmployeeModal();
    }

    async handleActivitySubmit(e, keepOpen = false) {
        e.preventDefault();

        // Prevent double submission
        const submitBtn = document.querySelector('button[type="submit"]');
        const addAnotherBtn = document.getElementById('addAnotherBtn');
        if (submitBtn) submitBtn.disabled = true;
        if (addAnotherBtn) addAnotherBtn.disabled = true;

        try {
            const empId = document.getElementById('activityEmployeeId').value;
            const slot = document.getElementById('activityTimeSlot').value;
            const type = document.getElementById('activityType').value;
            let desc = document.getElementById('activityDescription').value;

            if (!type) {
                this.showStatus('Please select an activity type', 'error');
                return;
            }

            // Get time range if specified
            const startTime = document.getElementById('activityStartTime')?.value;
            const endTime = document.getElementById('activityEndTime')?.value;
            if (startTime && endTime) {
                desc = `[${startTime}-${endTime}] ${desc}`;
            }

            // Calc pages
            let pagesDone = 0;
            if (['proof', 'epub', 'calibr'].includes(type)) {
                const s = parseInt(document.getElementById('startPage').value) || 0;
                const e = parseInt(document.getElementById('endPage').value) || 0;
                if (e >= s && s > 0) {
                    pagesDone = e - s + 1;
                    desc += ` (Pages: ${s}-${e}, Total: ${pagesDone})`;
                }
            }

            await this.setActivity(empId, slot, {
                type,
                description: desc,
                pagesDone: pagesDone.toString(),
                totalPages: pagesDone.toString(), // Ensure Total Pages is populated
                timestamp: new Date().toISOString()
            });

            if (keepOpen) {
                // Clear form but keep modal open for next activity
                document.getElementById('activityType').value = '';
                document.getElementById('activityDescription').value = '';
                document.getElementById('startPage').value = '';
                document.getElementById('endPage').value = '';
                document.getElementById('activityStartTime').value = '';
                document.getElementById('activityEndTime').value = '';
                document.getElementById('calculatedTotal').value = '0';
                this.showStatus('Activity saved! Add another activity for this timeslot.');
            } else {
                this.closeActivityModal();
            }
        } catch (err) {
            console.error(err);
        } finally {
            if (submitBtn) submitBtn.disabled = false;
            if (addAnotherBtn) addAnotherBtn.disabled = false;
        }
    }

    // Reminders
    // Reminders
    playReminderSound() {
        // Simple 'ding' sound (Base64 MP3) - Short pleasant chime
        const audioSrc = 'data:audio/mp3;base64,//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//tgxAAAAAA';
        // (Truncated for brevity in prompt, I will use a real short base64 in the actual file write, checking length)
        // Actually, for robustness, let's use a standard beep function or a hosted valid base64. 
        // I will use a minimal valid MP3 base64 here.
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'); // Notification chime
        audio.volume = 0.5;
        audio.play().catch(e => console.warn('Audio play prevented:', e));
    }

    startHourlyReminder() {
        if ("Notification" in window && Notification.permission !== "granted") {
            Notification.requestPermission();
        }

        // Check every minute
        setInterval(() => {
            const now = new Date();
            const currentHour = now.getHours();
            const currentMin = now.getMinutes();

            // Logic: Determine which slot just passed or is current
            // Our slots: 9-10, 10-11, 11-11:10, 11:10-12, 12-1, 1-1:40, 1:40-3, 3-3:50, 3:50-4, 4-5, 5-6, 6-7, 7-8
            // We want to alert if a slot END TIME has passed recently (e.g. within last 5 mins) and it's empty.
            // Or simple hourly check: "It's 10:05, did you fill 9-10?"

            // Helper to parsing slot string "HH:MM-HH:MM"
            // Let's implement specific checks for our known schedule to be precise

            let slotToCheck = null;

            // Simple map of "Check Time (Hour:Minute)" -> "Slot to Check"
            // We check 5 minutes after the hour/slot ends
            const checkMap = {
                '10:05': '9:00-10:00',
                '11:05': '10:00-11:00',
                '11:15': '11:00-11:10',
                '12:05': '11:10-12:00',
                '13:05': '12:00-01:00', // 1:05 PM
                '13:45': '01:00-01:40', // 1:45 PM checks 1:00-1:40
                '15:05': '01:40-03:00', // 3:05 PM
                '15:55': '03:00-03:50', // 3:55 PM
                '16:05': '03:50-04:00', // 4:05 PM
                '17:05': '04:00-05:00',
                '18:05': '05:00-06:00',
                '19:05': '06:00-07:00',
                '20:05': '07:00-08:00'
            };

            const timeKey = `${currentHour}:${currentMin.toString().padStart(2, '0')}`;
            slotToCheck = checkMap[timeKey];

            if (slotToCheck) {
                // Check if filled
                const acts = this.getActivity(this.currentUser.id, slotToCheck);
                if (!acts || acts.length === 0) {
                    // Not filled!
                    if (Notification.permission === "granted") {
                        new Notification("Timesheet Reminder 🔔", {
                            body: `Missing entry for ${slotToCheck}. Please fill your timesheet!`,
                            icon: 'images/logogo.jpg'
                        });
                        this.playReminderSound();
                    }
                }
            }

        }, 60000); // Run every minute
    }

    // Clock & Greetings
    updateClock() {
        const clock = document.getElementById('digitalClock');
        if (clock) {
            const now = new Date();
            // Indian Standard Time (IST) explicitly or Browser Local? User asked "Indian digital clock".
            // Browser local in India is IST. To be safe, we can use 'en-IN'.
            const timeStr = now.toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
            }).toUpperCase();
            clock.textContent = timeStr;
        }
    }

    showGreeting() {
        if (sessionStorage.getItem('greeted')) return;

        const hour = new Date().getHours();
        let greeting = 'Good Morning';
        let icon = '☀️';

        if (hour >= 12 && hour < 17) {
            greeting = 'Good Afternoon';
            icon = '🌤️';
        } else if (hour >= 17) {
            greeting = 'Good Evening';
            icon = '🌙';
        }

        const msg = `${greeting}, Have a Nice Day!`;

        const toast = document.createElement('div');
        toast.className = 'greeting-toast';
        toast.innerHTML = `<span class="greeting-icon">${icon}</span><span class="greeting-text">${msg}</span>`;
        document.body.appendChild(toast);

        sessionStorage.setItem('greeted', 'true');

        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 500);
        }, 4000);
    }

    setupEventListeners() {
        // Clock Init
        this.updateClock();
        setInterval(() => this.updateClock(), 1000);

        // Greeting
        this.showGreeting();

        // Activity Type Change Listener
        document.getElementById('activityType')?.addEventListener('change', (e) => {
            const type = e.target.value;
            const pageGroup = document.getElementById('pageRangeGroup');
            const descGroup = document.getElementById('activityDescription').parentElement;

            const noDetailsNeeded = ['meeting', 'break', 'lunch'].includes(type);

            if (pageGroup) pageGroup.style.display = noDetailsNeeded ? 'none' : 'block';
            if (descGroup) descGroup.style.display = noDetailsNeeded ? 'block' : 'block';
        });

        const fullDayCheck = document.getElementById('fullDayCheck');
        fullDayCheck?.addEventListener('change', (e) => {
            const isFull = e.target.checked;
            document.getElementById('startSlot').disabled = isFull;
            document.getElementById('endSlot').disabled = isFull;
        });

        // Modal Close Buttons
        document.querySelectorAll('.close-modal, .cancel-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeEmployeeModal();
                this.closeActivityModal();
                this.closeEmployeeActionModal();
            });
        });

        // Header Buttons
        document.getElementById('addEmployeeBtn')?.addEventListener('click', () => {
            if (this.currentUser.role !== 'admin') {
                alert('Access Denied: Only Admins can add employees.');
                return;
            }
            this.openEmployeeModal();
        });

        document.getElementById('exportBtn')?.addEventListener('click', () => {
            const dateKey = this.getDateKey(this.currentDate);
            window.location.href = `/api/export?dateKey=${dateKey}`;
        });

        // Specific Cancel Buttons (if class selection misses them)
        document.getElementById('cancelBtn')?.addEventListener('click', () => this.closeEmployeeModal());
        document.getElementById('cancelActivityBtn')?.addEventListener('click', () => this.closeActivityModal());


        // Forms
        document.getElementById('employeeForm')?.addEventListener('submit', (e) => this.handleEmployeeSubmit(e));
        document.getElementById('activityForm')?.addEventListener('submit', (e) => this.handleActivitySubmit(e));

        // Activity Actions
        document.getElementById('clearActivityBtn')?.addEventListener('click', () => {
            const id = document.getElementById('activityEmployeeId').value;
            const slot = document.getElementById('activityTimeSlot').value;
            if (confirm('Clear?')) {
                this.clearActivity(id, slot);
                this.closeActivityModal();
            }
        });

        // Page calculation
        const startPageInput = document.getElementById('startPage');
        const endPageInput = document.getElementById('endPage');
        const totalInput = document.getElementById('calculatedTotal');

        const calculateTotal = () => {
            const start = parseInt(startPageInput?.value) || 0;
            const end = parseInt(endPageInput?.value) || 0;
            if (start > 0 && end >= start) {
                const total = end - start + 1;
                if (totalInput) totalInput.value = total;
            } else {
                if (totalInput) totalInput.value = 0;
            }
        };

        startPageInput?.addEventListener('input', calculateTotal);
        endPageInput?.addEventListener('input', calculateTotal);

        // Add Another button
        document.getElementById('addAnotherBtn')?.addEventListener('click', async (e) => {
            e.preventDefault();
            await this.handleActivitySubmit(e, true); // Pass true to keep modal open
        });

        // Employee Action Modal Buttons (Leave/Permission)
        document.getElementById('markLeaveOptionBtn')?.addEventListener('click', () => this.showTimeSelectionForm('leave'));
        document.getElementById('markPermissionOptionBtn')?.addEventListener('click', () => this.showTimeSelectionForm('permission'));
        document.getElementById('backToActionsBtn')?.addEventListener('click', () => this.hideTimeSelectionForm());
        document.getElementById('confirmActionBtn')?.addEventListener('click', () => this.handleLeavePermissionSubmit());

        // Navigation
        document.getElementById('prevDay')?.addEventListener('click', () => {
            this.currentDate.setDate(this.currentDate.getDate() - 1);
            this.setDateInput();
            this.loadData().then(() => this.renderTimesheet());
        });

        document.getElementById('todayBtn')?.addEventListener('click', () => {
            this.currentDate = new Date();
            this.setDateInput();
            this.loadData().then(() => this.renderTimesheet());
        });

        document.getElementById('nextDay')?.addEventListener('click', () => {
            this.currentDate.setDate(this.currentDate.getDate() + 1);
            this.setDateInput();
            this.loadData().then(() => this.renderTimesheet());
        });

        // Logout - Updated with Thank You
        document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
            e.preventDefault();

            const overlay = document.getElementById('logoutOverlay');
            if (overlay) {
                overlay.style.display = 'flex';
                // Wait for animation
                setTimeout(() => {
                    localStorage.removeItem('currentUser');
                    sessionStorage.removeItem('greeted'); // Clear greet flag
                    window.location.href = 'login.html';
                }, 2000); // 2 second delay
            } else {
                localStorage.removeItem('currentUser');
                window.location.href = 'login.html';
            }
        });
    }
}

class ActivityTracker {
    constructor() {
        this.listElement = null;
        // We'll init after a short delay or find element dynamically
        setTimeout(() => this.init(), 500);
    }

    async init() {
        await this.loadLogs();
        // Poll every 30 seconds
        setInterval(() => this.loadLogs(), 30000);
    }

    async loadLogs(dateKey = null) {
        // If no specific date passed, try to get from manager
        const date = dateKey || (window.timesheetManager ? window.timesheetManager.getDateKey(window.timesheetManager.currentDate) : null);

        // Update Header to show context
        const header = document.getElementById('recentChangesHeader');
        if (header && date) {
            header.textContent = `Recent Changes (${date})`;
        }

        let url = '/api/activity-log?limit=50';
        if (date) url += `&date=${date}`;

        try {
            const res = await fetch(url);
            if (res.ok) {
                const logs = await res.json();
                this.render(logs);
            }
        } catch (e) {
            console.error('Failed to load activity log', e);
        }
    }

    render(logs) {
        // Look for the recent changes list container
        // Based on typical structure, it might be an element with id or class
        // Let's assume there's a container.
        const output = document.getElementById('activityTrackerList') || document.querySelector('.activity-tracker-list');

        if (!output) return;

        output.innerHTML = '';
        if (logs.length === 0) {
            output.innerHTML = '<div class="empty-state">No recent activity</div>';
            return;
        }

        logs.forEach(log => {
            const item = document.createElement('div');
            item.className = 'activity-tracker-item';

            // Format time
            const timeDate = new Date(log.timestamp);
            const timeStr = timeDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            // Initials removed per request
            const typeClass = `type-${(log.activityType || 'other').toLowerCase()}`;

            item.innerHTML = `
                <div style="flex: 1; min-width: 0;">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 4px;">
                        <div>
                            <span style="font-weight: 600; font-size: 0.875rem; color: var(--neutral-900);">${log.employeeName}</span>
                            <span style="font-size: 0.75rem; color: var(--neutral-500); margin-left: 6px;">
                                <span style="background: var(--neutral-100); padding: 2px 6px; border-radius: 4px; font-weight: 600; color: var(--neutral-600);">${(log.activityType || '').toUpperCase()}</span>
                            </span>
                        </div>
                        <span style="font-size: 0.75rem; color: var(--neutral-400); font-weight: 500;">${timeStr}</span>
                    </div>
                    
                    <div style="font-size: 0.8125rem; color: var(--neutral-600); margin-bottom: 4px; line-height: 1.4;">
                        ${log.description || log.action}
                    </div>

                    <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem;">
                         <span style="color: var(--primary-blue); font-weight: 500; background: rgba(37, 99, 235, 0.05); padding: 2px 6px; border-radius: 4px;">
                            ${(log.timeSlot || '').split('|').pop().trim()}
                         </span>
                         <span style="color: var(--neutral-400);">By: ${log.editedBy || 'System'}</span>
                    </div>
                </div>
            `;
            output.appendChild(item);
        });
    }

    async addActivity(name, type, desc, slot, action, dateKeyOverride = null) {
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const editorName = currentUser.name || currentUser.username || 'System';

        // Extract dateKey from slot if present (format: "YYYY-MM-DD | HH:MM-HH:MM")
        // Used for strict date filtering in backend
        let dateKey = dateKeyOverride;
        if (!dateKey) {
            if (slot && slot.includes(' | ')) {
                dateKey = slot.split(' | ')[0];
            } else {
                // Fallback for immediate safety, though setActivity should provide it.
                // If missing, it might not show in date-filtered view, which is better than showing in WRONG view.
                dateKey = new Date().toISOString().split('T')[0];
            }
        }

        try {
            await fetch('/api/activity-log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    employeeName: name,
                    activityType: type,
                    description: desc,
                    timeSlot: slot, // Keeps full display "Date | Time"
                    action: action,
                    editedBy: editorName,
                    timestamp: new Date().toISOString(),
                    dateKey: dateKey
                })
            });
            this.loadLogs(dateKey); // Reload logs for the specific date we just added to
        } catch (e) {
            console.error('Error logging activity', e);
        }
    }
}

window.timesheetManager = new TimesheetManager();
window.activityTracker = new ActivityTracker();
