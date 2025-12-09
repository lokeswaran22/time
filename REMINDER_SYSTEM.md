# Timesheet Reminder System

## Overview
The timesheet reminder system automatically notifies users at specific times throughout the day to fill their timesheet.

## Features

### 1. **Multiple Daily Reminders**
The system sends reminders at:
- **10:00 AM** - Morning reminder for 9:00-10:00 slot
- **12:00 PM** - Lunch time reminder for morning activities
- **3:00 PM** - Afternoon reminder
- **5:00 PM** - End of day approaching
- **7:00 PM** - Final reminder before leaving

### 2. **Dual Notification System**
- **Browser Notifications**: Native OS notifications (requires permission)
- **In-App Notifications**: Beautiful animated notifications within the app

### 3. **Smart Features**
- **No Duplicate Notifications**: Each reminder shows only once per day
- **Auto-dismiss**: Notifications automatically disappear after 10 seconds
- **Manual Close**: Users can dismiss notifications manually
- **Sound Alert**: Subtle audio notification (optional)

## How It Works

### Browser Notifications
1. On first load, the app requests notification permission
2. If granted, reminders appear as system notifications
3. Works even when the browser tab is in the background

### In-App Notifications
- Appear in the top-right corner
- Animated slide-in effect
- Bell icon with ringing animation
- Gradient background matching app theme

## Customization

### Modify Reminder Times
Edit `reminder.js` and update the `reminderTimes` array:

```javascript
this.reminderTimes = [
    { hour: 10, minute: 0, message: "Your custom message" },
    // Add more reminders...
];
```

### Disable Sound
Comment out the `playNotificationSound()` call in the `showReminder()` method.

### Change Notification Duration
Modify the timeout value (currently 10000ms = 10 seconds):

```javascript
setTimeout(() => {
    // ...
}, 10000); // Change this value
```

## Browser Compatibility
- ✅ Chrome/Edge (full support)
- ✅ Firefox (full support)
- ✅ Safari (limited notification support)
- ⚠️ Mobile browsers (in-app notifications only)

## Privacy
- No data is sent to external servers
- All reminders run locally in the browser
- Notification permission is requested only once
