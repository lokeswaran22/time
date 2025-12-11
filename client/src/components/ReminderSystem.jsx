import { useEffect, useState, useRef } from 'react';

function ReminderSystem({ timeSlots }) {
    const [notifications, setNotifications] = useState([]);
    const shownRemindersRef = useRef(new Set());
    const audioContextRef = useRef(null);

    // Parse time slots to get end times
    const getNotificationTimes = () => {
        return timeSlots.map(slot => {
            // Extract end time part (e.g., "10:00" from "9:00-10:00")
            const parts = slot.split('-');
            if (parts.length !== 2) return null;

            let endTime = parts[1].trim();
            let [hourStr, minuteStr] = endTime.split(':');
            let hour = parseInt(hourStr);
            const minute = parseInt(minuteStr);

            // Convert 12-hour format to 24-hour
            // Heuristic: if hour is 1-8, assume PM (13-20). If 9-12, assume AM/PM logic needs care.
            // Based on the list provided: 9-12 are AM/Noon, 1-8 are PM.
            if (hour >= 1 && hour <= 8) {
                hour += 12;
            }

            return { hour, minute, label: slot };
        }).filter(Boolean);
    };

    useEffect(() => {
        // Request browser notification permission on mount
        if ('Notification' in window && Notification.permission !== 'granted') {
            Notification.requestPermission();
        }

        const notificationTimes = getNotificationTimes();

        const checkReminders = () => {
            const now = new Date();
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();
            const todayKey = now.toDateString();

            notificationTimes.forEach((time, index) => {
                // Unique key for this specific reminder today
                const reminderKey = `${todayKey}-${time.hour}:${time.minute}`;

                // Check if it's exactly the time (within the minute)
                if (currentHour === time.hour &&
                    currentMinute === time.minute &&
                    !shownRemindersRef.current.has(reminderKey)) {

                    const message = `Time slot ${time.label} has ended. Please fill your timesheet.`;

                    // Trigger notifications
                    triggerBrowserNotification(message);
                    triggerInAppNotification(message);
                    playNotificationSound();

                    // Mark as shown
                    shownRemindersRef.current.add(reminderKey);
                }
            });
        };

        // Check every 30 seconds
        const intervalId = setInterval(checkReminders, 30000);

        // Initial check
        checkReminders();

        return () => clearInterval(intervalId);
    }, [timeSlots]);

    const triggerBrowserNotification = (message) => {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Timesheet Reminder', {
                body: message,
                icon: '/images/logo.png', // Assuming logo exists here
                requireInteraction: true
            });
        }
    };

    const triggerInAppNotification = (message) => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, message }]);

        // Auto remove after 10 seconds
        setTimeout(() => {
            removeNotification(id);
        }, 10000);
    };

    const removeNotification = (id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const playNotificationSound = () => {
        try {
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
            }

            const ctx = audioContextRef.current;
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);

            oscillator.frequency.value = 800;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 0.5);
        } catch (e) {
            console.error('Audio notification failed', e);
        }
    };

    if (notifications.length === 0) return null;

    return (
        <div className="reminder-container" id="reminderContainer">
            {notifications.map(note => (
                <div key={note.id} className="reminder-notification">
                    <div className="reminder-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                        </svg>
                    </div>
                    <div className="reminder-content">
                        <div className="reminder-title">Timesheet Reminder</div>
                        <div className="reminder-message">{note.message}</div>
                    </div>
                    <button className="reminder-close" onClick={() => removeNotification(note.id)}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            ))}
        </div>
    );
}

export default ReminderSystem;
