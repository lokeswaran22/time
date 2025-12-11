// Reminder Notification System
class ReminderSystem {
    constructor() {
        this.container = document.getElementById('reminderContainer');
        this.checkInterval = 30 * 60 * 1000; // Check every 30 minutes
        this.reminderTimes = [
            { hour: 10, minute: 0, message: 'Good Morning! Please fill in your 9:00-10:00 timesheet.' },
            { hour: 12, minute: 0, message: 'Reminder: Update your morning activities in the timesheet.' },
            { hour: 15, minute: 0, message: 'Afternoon Check: Please update your timesheet for completed tasks.' },
            { hour: 17, minute: 0, message: 'End of Day Reminder: Complete your timesheet before leaving.' },
            { hour: 19, minute: 0, message: 'Final Reminder: Please ensure all activities are logged in the timesheet.' }
        ];
        this.shownReminders = new Set();
        this.init();
    }

    init() {
        // Check immediately on load
        this.checkReminders();

        // Set up periodic checking
        setInterval(() => this.checkReminders(), this.checkInterval);

        // Check every minute for more accurate timing
        setInterval(() => this.checkReminders(), 60 * 1000);
    }

    checkReminders() {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const today = now.toDateString();

        this.reminderTimes.forEach((reminder, index) => {
            const reminderKey = `${today}-${index}`;

            // Check if it's time for this reminder and we haven't shown it today
            if (currentHour === reminder.hour &&
                currentMinute >= reminder.minute &&
                currentMinute < reminder.minute + 5 && // 5-minute window
                !this.shownReminders.has(reminderKey)) {

                this.showReminder(reminder.message);
                this.shownReminders.add(reminderKey);
            }
        });

        // Clear old reminders at midnight
        if (currentHour === 0 && currentMinute === 0) {
            this.shownReminders.clear();
        }
    }

    showReminder(message) {
        const notification = document.createElement('div');
        notification.className = 'reminder-notification';
        notification.innerHTML = `
            <div class="reminder-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
            </div>
            <div class="reminder-content">
                <div class="reminder-title">Timesheet Reminder</div>
                <div class="reminder-message">${message}</div>
            </div>
            <button class="reminder-close" onclick="this.parentElement.remove()">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                </svg>
            </button>
        `;

        this.container.appendChild(notification);

        // Play notification sound (optional)
        this.playNotificationSound();

        // Auto-remove after 30 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.classList.add('reminder-fade-out');
                setTimeout(() => notification.remove(), 300);
            }
        }, 30000);
    }

    playNotificationSound() {
        // Create a subtle notification sound
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 800;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (e) {
            console.log('Audio notification not supported');
        }
    }

    // Manual trigger for testing
    testReminder() {
        this.showReminder('This is a test reminder. Please update your timesheet!');
    }
}

// Initialize the reminder system when DOM is loaded
// Initialize the reminder system when DOM is loaded
function initReminder() {
    try {
        if (!window.reminderSystem) {
            window.reminderSystem = new ReminderSystem();
            console.log('Reminder System initialized. Use reminderSystem.testReminder() to test.');
        }
    } catch (error) {
        console.error('Error initializing ReminderSystem:', error);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initReminder);
} else {
    initReminder();
}

// Check for incomplete timesheets
function checkIncompleteTimesheets() {
    const now = new Date();
    const currentHour = now.getHours();

    // Only check during working hours (9 AM to 8 PM)
    if (currentHour >= 9 && currentHour < 20) {
        const timesheetBody = document.getElementById('timesheetBody');
        if (timesheetBody) {
            const rows = timesheetBody.querySelectorAll('tr');
            let hasIncomplete = false;

            rows.forEach(row => {
                const cells = row.querySelectorAll('.time-cell');
                cells.forEach(cell => {
                    if (!cell.classList.contains('has-activity') && !cell.classList.contains('full-day-leave-cell')) {
                        hasIncomplete = true;
                    }
                });
            });

            if (hasIncomplete && window.reminderSystem) {
                // Show reminder for incomplete entries every 2 hours
                const lastCheck = localStorage.getItem('lastIncompleteCheck');
                const now = Date.now();

                if (!lastCheck || (now - parseInt(lastCheck)) > 2 * 60 * 60 * 1000) {
                    window.reminderSystem.showReminder('You have incomplete timesheet entries. Please fill them in.');
                    localStorage.setItem('lastIncompleteCheck', now.toString());
                }
            }
        }
    }
}

// Check for incomplete timesheets periodically
setInterval(checkIncompleteTimesheets, 15 * 60 * 1000); // Every 15 minutes
