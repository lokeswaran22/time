function DateSelector({ currentDate, onDateChange }) {
    const formatDateForInput = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const changeDate = (days) => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + days);
        onDateChange(newDate);
    };

    const setToday = () => {
        onDateChange(new Date());
    };

    const handleDateInputChange = (e) => {
        const selectedDate = new Date(e.target.value + 'T00:00:00');
        if (!isNaN(selectedDate.getTime())) {
            onDateChange(selectedDate);
        }
    };

    return (
        <div className="date-selector-card">
            <div className="date-selector">
                <h2>Daily Timesheet</h2>
                <div className="date-controls">
                    <button className="btn btn-sm btn-secondary" onClick={() => changeDate(-1)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M15 18l-6-6 6-6" />
                        </svg>
                    </button>
                    <button className="btn btn-sm btn-secondary" onClick={setToday}>Today</button>
                    <input
                        type="date"
                        className="date-input"
                        value={formatDateForInput(currentDate)}
                        onChange={handleDateInputChange}
                    />
                    <button className="btn btn-sm btn-secondary" onClick={() => changeDate(1)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 18l6-6-6-6" />
                        </svg>
                    </button>
                </div>
            </div>
            <br />
            <br />
        </div>
    );
}

export default DateSelector;
