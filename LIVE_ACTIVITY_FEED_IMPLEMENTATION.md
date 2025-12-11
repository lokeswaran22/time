# Live Activity Feed Implementation Guide

## Overview
This document explains how to add a live activity feed to your timesheet application that shows recent changes with employee names, activity types, descriptions, and timestamps.

## What You Need to Add

### 1. HTML Structure (Add after the date selector in index.html)

Add this code after line 80 (after the `</div>` closing the date-selector-card):

```html
<!-- Live Activity Feed -->
<div class="activity-feed-card">
    <div class="activity-feed-header" id="activityFeedToggle">
        <div class="activity-feed-title">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
            </svg>
            <h3>Live Activity Feed</h3>
            <span class="activity-badge" id="activityCount">0</span>
        </div>
        <button class="toggle-btn" id="feedToggleBtn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M6 9l6 6 6-6"/>
            </svg>
        </button>
    </div>
    <div class="activity-feed-content" id="activityFeedContent">
        <div class="activity-feed-list" id="activityFeedList">
            <!-- Activity items will be dynamically added here -->
        </div>
    </div>
</div>
```

### 2. CSS Styles (Add to style.css at the end)

```css
/* ==========================================
   LIVE ACTIVITY FEED
   ========================================== */
.activity-feed-card {
    background: var(--bg-primary);
    border-radius: var(--border-radius-lg);
    padding: 0;
    margin-bottom: var(--spacing-xl);
    box-shadow: var(--shadow-md);
    overflow: hidden;
    animation: slideDown 0.4s ease-out;
}

.activity-feed-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-lg);
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    cursor: pointer;
    transition: all var(--transition-base);
}

.activity-feed-header:hover {
    background: linear-gradient(135deg, #5568d3 0%, #6a4190 100%);
}

.activity-feed-title {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
}

.activity-feed-title h3 {
    font-size: var(--font-size-lg);
    font-weight: 700;
    margin: 0;
}

.activity-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 24px;
    height: 24px;
    padding: 0 8px;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 12px;
    font-size: var(--font-size-xs);
    font-weight: 700;
}

.toggle-btn {
    width: 32px;
    height: 32px;
    border-radius: var(--border-radius);
    border: none;
    background: rgba(255, 255, 255, 0.2);
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all var(--transition-base);
}

.toggle-btn:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(1.1);
}

.toggle-btn svg {
    transition: transform var(--transition-base);
}

.toggle-btn.collapsed svg {
    transform: rotate(-90deg);
}

.activity-feed-content {
    max-height: 400px;
    overflow-y: auto;
    transition: max-height var(--transition-slow);
}

.activity-feed-content.collapsed {
    max-height: 0;
    overflow: hidden;
}

.activity-feed-list {
    padding: var(--spacing-md);
}

.activity-feed-item {
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-md);
    padding: var(--spacing-md);
    margin-bottom: var(--spacing-sm);
    background: var(--bg-secondary);
    border-radius: var(--border-radius);
    border-left: 4px solid;
    transition: all var(--transition-base);
    animation: slideInRight 0.3s ease-out;
}

@keyframes slideInRight {
    from {
        opacity: 0;
        transform: translateX(-20px);
    }
    to {
        opacity: 1;
        transform: translateX(0);
    }
}

.activity-feed-item:hover {
    transform: translateX(4px);
    box-shadow: var(--shadow-sm);
}

.activity-feed-item.type-work {
    border-left-color: var(--activity-work);
}

.activity-feed-item.type-break {
    border-left-color: var(--activity-break);
}

.activity-feed-item.type-lunch {
    border-left-color: var(--activity-lunch);
}

.activity-feed-item.type-meeting {
    border-left-color: var(--activity-meeting);
}

.activity-feed-icon {
    flex-shrink: 0;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    color: white;
    font-size: var(--font-size-sm);
}

.activity-feed-icon.type-work {
    background: var(--activity-work);
}

.activity-feed-icon.type-break {
    background: var(--activity-break);
}

.activity-feed-icon.type-lunch {
    background: var(--activity-lunch);
}

.activity-feed-icon.type-meeting {
    background: var(--activity-meeting);
}

.activity-feed-details {
    flex: 1;
}

.activity-feed-employee {
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 2px;
}

.activity-feed-description {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    margin-bottom: 4px;
}

.activity-feed-meta {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    font-size: var(--font-size-xs);
    color: var(--text-muted);
}

.activity-feed-time {
    display: flex;
    align-items: center;
    gap: 4px;
}

.activity-feed-empty {
    text-align: center;
    padding: var(--spacing-xl);
    color: var(--text-muted);
}
```

### 3. JavaScript Functions (Add to script.js)

Add these functions to your script.js file:

```javascript
// Activity Feed Management
const activityFeed = [];
const MAX_FEED_ITEMS = 50;

function addToActivityFeed(employeeName, activityType, description, timeSlot, dateKey) {
    const now = new Date();
    const feedItem = {
        id: Date.now(),
        employeeName,
        activityType,
        description,
        timeSlot,
        dateKey,
        timestamp: now.toISOString(),
        timeAgo: formatTimeAgo(now)
    };
    
    // Add to beginning of array
    activityFeed.unshift(feedItem);
    
    // Keep only last MAX_FEED_ITEMS
    if (activityFeed.length > MAX_FEED_ITEMS) {
        activityFeed.pop();
    }
    
    updateActivityFeedDisplay();
}

function formatTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}

function updateActivityFeedDisplay() {
    const feedList = document.getElementById('activityFeedList');
    const activityCount = document.getElementById('activityCount');
    
    if (!feedList) return;
    
    activityCount.textContent = activityFeed.length;
    
    if (activityFeed.length === 0) {
        feedList.innerHTML = `
            <div class="activity-feed-empty">
                <p>No recent activities</p>
            </div>
        `;
        return;
    }
    
    feedList.innerHTML = activityFeed.map(item => {
        const icon = getActivityIcon(item.activityType);
        const desc = item.description || getDefaultDescription(item.activityType);
        
        return `
            <div class="activity-feed-item type-${item.activityType}">
                <div class="activity-feed-icon type-${item.activityType}">
                    ${icon}
                </div>
                <div class="activity-feed-details">
                    <div class="activity-feed-employee">${item.employeeName}</div>
                    <div class="activity-feed-description">${desc}</div>
                    <div class="activity-feed-meta">
                        <div class="activity-feed-time">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                            ${item.timeAgo}
                        </div>
                        <span>•</span>
                        <span>${item.timeSlot}</span>
                        <span>•</span>
                        <span>${formatDate(new Date(item.timestamp))}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function getActivityIcon(type) {
    const icons = {
        work: '💼',
        break: '☕',
        lunch: '🍽️',
        meeting: '👥'
    };
    return icons[type] || '📝';
}

function getDefaultDescription(type) {
    const descriptions = {
        work: 'Working on tasks',
        break: 'Taking a break',
        lunch: 'Lunch time',
        meeting: 'In a meeting'
    };
    return descriptions[type] || 'Activity';
}

function formatDate(date) {
    const options = { month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// Toggle activity feed
function initializeActivityFeed() {
    const toggleBtn = document.getElementById('feedToggleBtn');
    const feedContent = document.getElementById('activityFeedContent');
    const feedHeader = document.getElementById('activityFeedToggle');
    
    if (toggleBtn && feedContent) {
        feedHeader.addEventListener('click', () => {
            feedContent.classList.toggle('collapsed');
            toggleBtn.classList.toggle('collapsed');
        });
    }
    
    // Update time ago every minute
    setInterval(() => {
        activityFeed.forEach(item => {
            item.timeAgo = formatTimeAgo(new Date(item.timestamp));
        });
        updateActivityFeedDisplay();
    }, 60000);
}

// Call this when the page loads
document.addEventListener('DOMContentLoaded', () => {
    initializeActivityFeed();
});
```

### 4. Integration with Existing Code

Modify your existing `saveActivity` function to call `addToActivityFeed`:

```javascript
// In your existing saveActivity function, add this line:
async function saveActivity(employeeId, timeSlot, type, description) {
    // ... existing code ...
    
    // After successfully saving, add to activity feed
    const employee = employees.find(e => e.id === employeeId);
    if (employee) {
        addToActivityFeed(
            employee.name,
            type,
            description,
            timeSlot,
            currentDateKey
        );
    }
    
    // ... rest of existing code ...
}
```

## Features

✅ **Real-time Updates**: Shows activities as they're added  
✅ **Collapsible Panel**: Click header to expand/collapse  
✅ **Activity Count Badge**: Shows total number of recent activities  
✅ **Time Ago Format**: "Just now", "5m ago", "2h ago", etc.  
✅ **Color-coded by Type**: Work, Break, Lunch, Meeting  
✅ **Auto-refresh**: Time ago updates every minute  
✅ **Smooth Animations**: Slide-in effects for new items  
✅ **Limit to 50 Items**: Keeps the feed performant  

## Testing

1. Add or edit an activity
2. Check the Live Activity Feed panel
3. You should see the new activity appear at the top
4. The timestamp should show "Just now"
5. The activity count badge should increment

## Troubleshooting

If the feed doesn't appear:
1. Check browser console for errors
2. Verify HTML was added in the correct location
3. Ensure CSS file is loaded
4. Check that JavaScript functions are defined
5. Make sure `initializeActivityFeed()` is called on page load
