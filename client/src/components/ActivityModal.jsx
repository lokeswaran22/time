import { useState, useEffect } from 'react';

function ActivityModal({ employee, timeSlot, activity, onClose, onSave, onClear }) {
    const [activityType, setActivityType] = useState('epub');
    const [description, setDescription] = useState('');
    const [pagesDone, setPagesDone] = useState('');
    const [totalPages, setTotalPages] = useState('');
    const [startPage, setStartPage] = useState('');
    const [endPage, setEndPage] = useState('');

    useEffect(() => {
        if (activity) {
            setActivityType(activity.type);
            setDescription(activity.description || '');
            setPagesDone(activity.pagesDone || '');
            setTotalPages(activity.totalPages || '');
            setStartPage(activity.startPage || '');
            setEndPage(activity.endPage || '');
        } else {
            setActivityType('epub');
            setDescription('');
            setPagesDone('');
            setTotalPages('');
            setStartPage('');
            setEndPage('');
        }
    }, [activity]);

    // Calculate pages done when start or end page changes
    useEffect(() => {
        if (startPage && endPage) {
            const start = parseInt(startPage);
            const end = parseInt(endPage);
            if (!isNaN(start) && !isNaN(end) && end >= start) {
                setPagesDone((end - start + 1).toString());
            }
        }
    }, [startPage, endPage]);

    const showPageFields = activityType === 'proof' || activityType === 'epub' || activityType === 'calibr';

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!activityType) {
            alert('Please select an activity type');
            return;
        }

        const activityData = {
            type: activityType,
            description: (activityType === 'break' || activityType === 'lunch') ? activityType.toUpperCase() : description,
            timestamp: new Date().toISOString()
        };

        if (showPageFields) {
            if (!pagesDone) {
                alert('Please enter start and end pages');
                return;
            }
            activityData.pagesDone = pagesDone;
            if (totalPages) activityData.totalPages = totalPages;
            if (startPage) activityData.startPage = startPage;
            if (endPage) activityData.endPage = endPage;

            // Append page range to description if start and end pages are provided
            // Handle page range in description
            if (startPage && endPage) {
                const rangeText = `(p.${startPage}-${endPage})`;

                // Remove any existing page range pattern like (p.X-Y)
                let cleanDescription = description.replace(/\(p\.\d+-\d+\)/g, '').trim();

                if (cleanDescription) {
                    activityData.description = `${cleanDescription} ${rangeText}`;
                } else {
                    activityData.description = rangeText;
                }
            }
        }

        onSave(activityData);
    };

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    return (
        <div className="modal show" onClick={handleOverlayClick}>
            <div className="modal-content">
                <div className="modal-header">
                    <h3>{employee?.name} - {timeSlot}</h3>
                    <button className="modal-close" onClick={onClose}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="modal-body">
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="activityType">Activity Type</label>
                            <select
                                id="activityType"
                                className="form-input"
                                value={activityType}
                                onChange={(e) => setActivityType(e.target.value)}
                                required
                            >
                                <option value="">Select Activity</option>
                                <option value="epub">Epub Process</option>
                                <option value="proof">Proof Reading</option>
                                <option value="calibr">Calibr Process</option>
                                <option value="meeting">Meeting</option>
                                <option value="break">Break</option>
                                <option value="lunch">Lunch</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="activityDescription">Notes / Description</label>
                            <textarea
                                id="activityDescription"
                                className="form-input"
                                rows="3"
                                placeholder="Add notes about this activity..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>

                        {showPageFields && (
                            <>
                                <div className="form-group">
                                    <label htmlFor="totalPages">Total Pages (Optional)</label>
                                    <input
                                        type="number"
                                        id="totalPages"
                                        className="form-input"
                                        placeholder="Enter total pages assigned"
                                        value={totalPages}
                                        onChange={(e) => setTotalPages(e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="pagesDone">Pages Completed <span style={{ color: 'red' }}>*</span></label>
                                    <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                                        <input
                                            type="number"
                                            id="startPage"
                                            className="form-input"
                                            placeholder="Start Page"
                                            value={startPage}
                                            onChange={(e) => setStartPage(e.target.value)}
                                        />
                                        <input
                                            type="number"
                                            id="endPage"
                                            className="form-input"
                                            placeholder="End Page"
                                            value={endPage}
                                            onChange={(e) => setEndPage(e.target.value)}
                                        />
                                    </div>
                                    <input
                                        type="number"
                                        id="pagesDone"
                                        className="form-input"
                                        placeholder="Calculated Pages"
                                        value={pagesDone}
                                        readOnly
                                        style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
                                    />
                                </div>
                            </>
                        )}

                        <div className="form-actions" style={{ justifyContent: 'space-between' }}>
                            <button type="button" className="btn btn-secondary" onClick={onClose}>
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="btn"
                                onClick={onClear}
                                style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: 'white', border: 'none' }}
                            >
                                Clear
                            </button>
                            <button type="submit" className="btn btn-primary">
                                Save Activity
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default ActivityModal;
