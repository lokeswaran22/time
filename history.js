class HistoryManager {
    constructor() {
        this.activities = [];
        this.employees = [];
        this.filteredActivities = [];
        this.init();
    }

    async init() {
        // Security Check: Only Admin can access this page
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        if (currentUser.role !== 'admin') {
            alert('Access Denied: Administrator privileges required.');
            window.location.href = 'index.html'; // Redirect to main page (which handles employee view)
            return;
        }

        this.showLoading(true);
        await this.loadData();
        this.setupEventListeners();
        this.renderTable();
        this.showLoading(false);
    }

    async loadData() {
        try {
            const [empRes, actRes] = await Promise.all([
                fetch('/api/users'), // Endpoint is /api/users, not /api/employees
                fetch('/api/activities') // Check if this supports returning all data
            ]);

            if (!empRes.ok || !actRes.ok) throw new Error('Failed to fetch data');

            this.employees = await empRes.json();
            const activitiesMap = await actRes.json();

            this.processActivities(activitiesMap);
        } catch (error) {
            console.error('Error loading data:', error);
            alert('Failed to load history data');
        }
    }

    processActivities(activitiesMap) {
        this.activities = [];
        // Ensure ID is string for map lookup
        const empMap = new Map(this.employees.map(e => [String(e.id), e.name]));

        // Flatten the nested structure: dateKey -> employeeId -> timeSlot -> activity[]
        Object.entries(activitiesMap).forEach(([dateKey, empActivities]) => {
            Object.entries(empActivities).forEach(([empId, slots]) => {
                const empName = empMap.get(String(empId)) || 'Unknown Employee';

                Object.entries(slots).forEach(([timeSlot, activityOrArray]) => {
                    // Normalize to array to handle both single object and array of objects
                    const acts = Array.isArray(activityOrArray) ? activityOrArray : [activityOrArray];

                    acts.forEach(act => {
                        this.activities.push({
                            date: dateKey,
                            employeeName: empName,
                            timeSlot: timeSlot,
                            ...act, // Spread type, description, pagesDone, etc.
                            // Create a search string for easier filtering
                            searchStr: `${empName} ${act.description || ''} ${act.type}`.toLowerCase()
                        });
                    });
                });
            });
        });

        // Sort by date descending, then time slot
        this.activities.sort((a, b) => {
            if (a.date !== b.date) return b.date.localeCompare(a.date);
            return this.compareTimeSlots(a.timeSlot, b.timeSlot);
        });

        this.filteredActivities = [...this.activities];
    }

    compareTimeSlots(slotA, slotB) {
        // Simple comparison based on start time
        const getStartTime = (slot) => {
            const start = slot.split('-')[0].trim();
            const [time, period] = start.split(':'); // This might fail if format is different, but assuming 9:00 format
            // Actually the format is '9:00-10:00', '01:00-01:40' etc.
            // Let's just use the index from a standard array if possible, or simple string compare
            return start;
        };
        return slotA.localeCompare(slotB);
    }

    setupEventListeners() {
        const searchInput = document.getElementById('searchFilter');
        const dateInput = document.getElementById('dateFilter');
        const typeInput = document.getElementById('typeFilter');
        const resetBtn = document.getElementById('resetFilters');

        const filterHandler = () => this.applyFilters();

        searchInput.addEventListener('input', filterHandler);
        dateInput.addEventListener('change', filterHandler);
        typeInput.addEventListener('change', filterHandler);

        resetBtn.addEventListener('click', () => {
            searchInput.value = '';
            dateInput.value = '';
            typeInput.value = '';
            this.applyFilters();
        });
    }

    applyFilters() {
        const search = document.getElementById('searchFilter').value.toLowerCase();
        const date = document.getElementById('dateFilter').value;
        const type = document.getElementById('typeFilter').value;

        this.filteredActivities = this.activities.filter(act => {
            const matchesSearch = !search || act.searchStr.includes(search);
            const matchesDate = !date || act.date === date;
            const matchesType = !type || act.type === type;

            return matchesSearch && matchesDate && matchesType;
        });

        this.renderTable();
    }

    renderTable() {
        const tbody = document.getElementById('historyBody');
        const noData = document.getElementById('noDataState');

        tbody.innerHTML = '';

        if (this.filteredActivities.length === 0) {
            noData.style.display = 'block';
            return;
        }

        noData.style.display = 'none';

        // Limit to first 500 items for performance if needed, or implement pagination later
        // For now, let's show all but maybe chunk it if it's huge. 
        // Assuming reasonable size for now.

        this.filteredActivities.forEach(act => {
            const row = document.createElement('tr');

            const formattedDate = new Date(act.date).toLocaleDateString(undefined, {
                weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
            });

            const timestamp = act.timestamp ? new Date(act.timestamp).toLocaleString() : '-';

            row.innerHTML = `
                <td>${formattedDate}</td>
                <td style="font-weight: 500;">${act.employeeName}</td>
                <td>${act.timeSlot}</td>
                <td><span class="badge ${act.type}">${act.type}</span></td>
                <td>${act.description || '-'}</td>
                <td>${act.totalPages || '-'}</td>
                <td>${act.pagesDone || '-'}</td>
                <td style="color: var(--text-muted); font-size: 0.8em;">${timestamp}</td>
            `;
            tbody.appendChild(row);
        });
    }

    showLoading(show) {
        document.getElementById('loadingState').style.display = show ? 'block' : 'none';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new HistoryManager();
});
