function TimesheetTable({
    employees,
    activities,
    currentDate,
    timeSlots,
    getDateKey,
    onEditEmployee,
    onDeleteEmployee,
    onOpenActivity,
    onOpenEmployeeAction,
    isAdmin
}) {
    const dateKey = getDateKey(currentDate);
    const sortedEmployees = [...employees].sort((a, b) => a.name.localeCompare(b.name));

    const getActivity = (employeeId, timeSlot) => {
        return activities[dateKey]?.[employeeId]?.[timeSlot] || null;
    };

    const isEmployeeOnFullDayLeave = (employeeId) => {
        const firstSlot = timeSlots[0];
        const activity = getActivity(employeeId, firstSlot);
        return activity && activity.type === 'leave' && activity.description === 'FULL_DAY_LEAVE';
    };

    const calculateTotals = (employeeId) => {
        let proofTotal = 0;
        let epubTotal = 0;
        let calibrTotal = 0;

        if (!isEmployeeOnFullDayLeave(employeeId)) {
            timeSlots.forEach(slot => {
                const act = getActivity(employeeId, slot);
                if (act && act.pagesDone) {
                    const pages = parseInt(act.pagesDone) || 0;
                    if (act.type === 'proof') proofTotal += pages;
                    else if (act.type === 'epub') epubTotal += pages;
                    else if (act.type === 'calibr') calibrTotal += pages;
                }
            });
        }

        return { proofTotal, epubTotal, calibrTotal };
    };

    const renderActivityCell = (employeeId, timeSlot) => {
        const activity = getActivity(employeeId, timeSlot);

        if (activity) {
            const showDescription = activity.type !== 'break' && activity.type !== 'lunch';

            return (
                <div
                    className={`activity-cell has-activity type-${activity.type}`}
                    onClick={() => onOpenActivity(employeeId, timeSlot)}
                >
                    <div className={`activity-type-badge ${activity.type}`}>{activity.type}</div>
                    {showDescription && activity.description && (
                        <div className="activity-description">{activity.description}</div>
                    )}
                </div>
            );
        }

        return (
            <div
                className="activity-cell empty"
                onClick={() => onOpenActivity(employeeId, timeSlot)}
            >
                <span>+ Add Activity</span>
            </div>
        );
    };

    if (employees.length === 0) {
        return (
            <div className="empty-state show">
                <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
                    <circle cx="60" cy="60" r="50" stroke="url(#empty-gradient)" strokeWidth="4" opacity="0.3" />
                    <path d="M60 30v30l20 20" stroke="url(#empty-gradient)" strokeWidth="4" strokeLinecap="round" />
                    <defs>
                        <linearGradient id="empty-gradient" x1="0" y1="0" x2="120" y2="120">
                            <stop offset="0%" stopColor="#d4af37" />
                            <stop offset="100%" stopColor="#1e3a8a" />
                        </linearGradient>
                    </defs>
                </svg>
                <h3>No Employees Added Yet</h3>
                <p>Click "Add Employee" to start tracking activities</p>
            </div>
        );
    }

    return (
        <div className="timesheet-container">
            <div className="table-wrapper">
                <table className="timesheet-table">
                    <thead>
                        <tr>
                            <th rowSpan="2">Employee Name</th>
                            <th colSpan="3" style={{ textAlign: 'center' }}>Total Pages</th>
                            {timeSlots.map(slot => (
                                <th key={slot} rowSpan="2">{slot}</th>
                            ))}
                            {isAdmin && <th rowSpan="2">Actions</th>}
                        </tr>
                        <tr>
                            <th>Proof</th>
                            <th>Epub</th>
                            <th>Calibr</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedEmployees.map(employee => {
                            const { proofTotal, epubTotal, calibrTotal } = calculateTotals(employee.id);
                            const isOnLeave = isEmployeeOnFullDayLeave(employee.id);

                            return (
                                <tr key={employee.id}>
                                    <td
                                        className="sticky-col"
                                        style={{ cursor: 'pointer' }}
                                        title="Click for options"
                                        onClick={() => onOpenEmployeeAction(employee.id)}
                                    >
                                        {employee.name}
                                    </td>

                                    <td className="sub-col proof-col" style={{ textAlign: 'center', fontWeight: proofTotal > 0 ? 'bold' : 'normal' }}>
                                        {isOnLeave ? '-' : (proofTotal > 0 ? proofTotal : '-')}
                                    </td>
                                    <td className="sub-col epub-col" style={{ textAlign: 'center', fontWeight: epubTotal > 0 ? 'bold' : 'normal' }}>
                                        {isOnLeave ? '-' : (epubTotal > 0 ? epubTotal : '-')}
                                    </td>
                                    <td className="sub-col calibr-col" style={{ textAlign: 'center', fontWeight: calibrTotal > 0 ? 'bold' : 'normal' }}>
                                        {isOnLeave ? '-' : (calibrTotal > 0 ? calibrTotal : '-')}
                                    </td>

                                    {isOnLeave ? (
                                        <td colSpan={timeSlots.length} className="full-day-leave-cell">
                                            <div className="full-day-leave">
                                                <span className="leave-badge">LEAVE</span>
                                                <button
                                                    className="clear-leave-btn"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        // Clear full day leave logic would go here
                                                    }}
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M18 6L6 18M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    ) : (
                                        timeSlots.map(timeSlot => (
                                            <td key={timeSlot}>
                                                {renderActivityCell(employee.id, timeSlot)}
                                            </td>
                                        ))
                                    )}

                                    {isAdmin && (
                                        <td className="actions-col">
                                            <div className="action-buttons">
                                                <button
                                                    className="icon-btn edit"
                                                    onClick={() => onEditEmployee(employee.id)}
                                                    title="Edit Employee"
                                                >
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    className="icon-btn delete"
                                                    onClick={() => onDeleteEmployee(employee.id)}
                                                    title="Delete Employee"
                                                >
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default TimesheetTable;
