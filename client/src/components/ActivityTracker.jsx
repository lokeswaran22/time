function ActivityTracker({ activities, currentDate, onClear, isAdmin }) {
    const formatTimeAgo = (dateString) => {
        const date = new Date(dateString);
        const seconds = Math.floor((new Date() - date) / 1000);

        if (seconds < 5) return 'Just now';
        if (seconds < 60) return `${seconds}s ago`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    };

    const formatExactTime = (isoString) => {
        const date = new Date(isoString);
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    };

    const formatDate = (isoString) => {
        const date = new Date(isoString);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const formatDateKey = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const getActivityIcon = (type) => {
        const icons = {
            epub: 'E',
            proof: 'P',
            calibr: 'C',
            work: 'W',
            break: 'B',
            lunch: 'L',
            meeting: 'M',
            leave: 'L',
            permission: 'P'
        };
        return icons[type] || 'A';
    };

    const getActionText = (action, type) => {
        if (action === 'cleared') return 'cleared activity';
        if (action === 'added') return `added ${type}`;
        return `updated ${type}`;
    };

    // Group activities by date
    const groupedActivities = {};
    activities.forEach(activity => {
        // Use dateKey if available (new logs), otherwise fallback to timestamp date (old logs)
        let activityDate;
        if (activity.dateKey) {
            // Convert YYYY-MM-DD to DD/MM/YYYY
            const [year, month, day] = activity.dateKey.split('-');
            activityDate = `${day}/${month}/${year}`;
        } else {
            activityDate = formatDate(activity.timestamp || activity.createdAt);
        }

        if (!groupedActivities[activityDate]) {
            groupedActivities[activityDate] = [];
        }
        groupedActivities[activityDate].push(activity);
    });

    // Get activities for current date
    const currentDateKey = formatDateKey(currentDate);
    const currentDateFormatted = formatDate(currentDate.toISOString());
    const todayActivities = groupedActivities[currentDateFormatted] || [];

    // Get all dates sorted (newest first)
    const allDates = Object.keys(groupedActivities).sort((a, b) => {
        const dateA = new Date(a.split('/').reverse().join('-'));
        const dateB = new Date(b.split('/').reverse().join('-'));
        return dateB - dateA;
    });

    return (
        <div className="activity-tracker-card">
            <div className="activity-tracker-header">
                <div className="activity-tracker-title">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 20h9"></path>
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                    </svg>
                    <h3>Activity History</h3>
                </div>
                {isAdmin && (
                    <button className="clear-tracker-btn" onClick={onClear} title="Clear History">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 6h18"></path>
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                        </svg>
                    </button>
                )}
            </div>
            <div className="activity-tracker-list">
                {activities.length === 0 ? (
                    <div className="activity-tracker-empty">
                        <p>No activity history</p>
                    </div>
                ) : todayActivities.length === 0 ? (
                    <div className="activity-tracker-empty">
                        <p>No activities for {currentDateFormatted}</p>
                        <p style={{ fontSize: '0.85rem', marginTop: '0.5rem', opacity: 0.7 }}>
                            Change date to view other days
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Current Date Section */}
                        <div className="activity-date-group">
                            <div className="activity-date-header">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                    <line x1="16" y1="2" x2="16" y2="6"></line>
                                    <line x1="8" y1="2" x2="8" y2="6"></line>
                                    <line x1="3" y1="10" x2="21" y2="10"></line>
                                </svg>
                                <span>{currentDateFormatted}</span>
                                <span className="activity-count">({todayActivities.length})</span>
                            </div>
                            {todayActivities.map((activity, index) => {
                                console.log('Activity Item:', activity);
                                const icon = getActivityIcon(activity.activityType);
                                const actionText = getActionText(activity.action, activity.activityType);
                                let desc = activity.description || '';
                                // Clean garbage data if present
                                if (desc.trim().startsWith('< div') || desc.trim().startsWith('<div')) {
                                    desc = '';
                                }
                                const exactTime = formatExactTime(activity.timestamp || activity.createdAt);
                                const timeAgo = formatTimeAgo(activity.createdAt || activity.timestamp);

                                return (
                                    <div key={activity.id || index} className={`activity-tracker-item type-${activity.activityType}`}>
                                        <div className={`activity-tracker-icon type-${activity.activityType}`}>
                                            {icon}
                                        </div>
                                        <div className="activity-tracker-details">
                                            <div className="activity-tracker-content">
                                                <div className="activity-tracker-employee">{activity.employeeName}</div>
                                                <div className="activity-tracker-description">
                                                    {actionText}{desc ? ': ' + desc : ''}
                                                </div>
                                                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                                    <span>{activity.timeSlot}</span>
                                                    {activity.editedBy && activity.editedBy !== 'System' && activity.editedBy !== 'Unknown' && (
                                                        <>
                                                            <span>•</span>
                                                            <span className="activity-user-badge">
                                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                                                    <circle cx="12" cy="7" r="4" />
                                                                </svg>
                                                                {activity.editedBy}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="activity-tracker-meta">
                                                <div className="activity-tracker-time">{timeAgo}</div>
                                                <div>{exactTime}</div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Show other dates if available */}
                        {allDates.length > 1 && (
                            <div className="activity-other-dates">
                                <div className="activity-other-dates-hint">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <line x1="12" y1="16" x2="12" y2="12"></line>
                                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                                    </svg>
                                    <span>Activities exist for {allDates.length} date(s). Change date to view.</span>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default ActivityTracker;
