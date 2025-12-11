import { useState, useEffect } from 'react';

function EmployeeActionModal({ employee, timeSlots, onClose, onSubmit }) {
    const [showTimeSelection, setShowTimeSelection] = useState(false);
    const [actionType, setActionType] = useState(null);
    const [fullDay, setFullDay] = useState(false);
    const [startSlot, setStartSlot] = useState(timeSlots[0]);
    const [endSlot, setEndSlot] = useState(timeSlots[timeSlots.length - 1]);
    const [reason, setReason] = useState('');

    const handleActionSelect = (type) => {
        setActionType(type);
        setShowTimeSelection(true);
        setFullDay(false);
        setReason('');
    };

    const handleBack = () => {
        setShowTimeSelection(false);
        setActionType(null);
    };

    const handleSubmit = () => {
        if (actionType === 'permission' && !reason.trim()) {
            alert('Please enter a reason for permission');
            return;
        }

        const startIndex = timeSlots.indexOf(startSlot);
        const endIndex = timeSlots.indexOf(endSlot);

        if (startIndex > endIndex) {
            alert('End time must be after start time');
            return;
        }

        onSubmit(actionType, startSlot, endSlot, fullDay, reason);
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
            <div className="modal-content" style={{ maxWidth: '500px' }}>
                <div className="modal-header">
                    <h3>Employee Options</h3>
                    <button className="modal-close" onClick={onClose}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="modal-body">
                    {!showTimeSelection ? (
                        <>
                            <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                Select an action for {employee?.name}:
                            </p>
                            <div className="form-actions" style={{ flexDirection: 'column', gap: '1rem' }}>
                                <button
                                    className="btn"
                                    onClick={() => handleActionSelect('leave')}
                                    style={{ width: '100%', justifyContent: 'center', background: 'var(--activity-leave)', color: 'white', border: 'none' }}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}>
                                        <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    Mark Leave
                                </button>
                                <button
                                    className="btn"
                                    onClick={() => handleActionSelect('permission')}
                                    style={{ width: '100%', justifyContent: 'center', background: 'var(--activity-meeting)', color: 'white', border: 'none' }}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}>
                                        <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Mark Permission
                                </button>
                                <button className="btn btn-secondary" onClick={onClose} style={{ width: '100%', justifyContent: 'center' }}>
                                    Cancel
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <h4 style={{ marginBottom: '1rem', color: 'var(--royal-navy)' }}>
                                {actionType === 'leave' ? 'Mark Leave' : 'Mark Permission'}
                            </h4>

                            {actionType === 'leave' && (
                                <div className="form-group">
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={fullDay}
                                            onChange={(e) => setFullDay(e.target.checked)}
                                            style={{ width: '18px', height: '18px' }}
                                        />
                                        Full Day Leave
                                    </label>
                                </div>
                            )}

                            <div className="form-group">
                                <label htmlFor="startSlot">From</label>
                                <select
                                    id="startSlot"
                                    className="form-input"
                                    value={startSlot}
                                    onChange={(e) => setStartSlot(e.target.value)}
                                    disabled={fullDay}
                                >
                                    {timeSlots.map(slot => (
                                        <option key={slot} value={slot}>{slot}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="endSlot">To</label>
                                <select
                                    id="endSlot"
                                    className="form-input"
                                    value={endSlot}
                                    onChange={(e) => setEndSlot(e.target.value)}
                                    disabled={fullDay}
                                >
                                    {timeSlots.map(slot => (
                                        <option key={slot} value={slot}>{slot}</option>
                                    ))}
                                </select>
                            </div>

                            {actionType === 'permission' && (
                                <div className="form-group">
                                    <label htmlFor="permissionReason">Reason</label>
                                    <textarea
                                        id="permissionReason"
                                        className="form-input"
                                        rows="3"
                                        placeholder="Enter reason for permission..."
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                    />
                                </div>
                            )}

                            <div className="form-actions" style={{ justifyContent: 'space-between' }}>
                                <button type="button" className="btn btn-secondary" onClick={handleBack}>
                                    Back
                                </button>
                                <button type="button" className="btn btn-primary" onClick={handleSubmit}>
                                    Submit
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default EmployeeActionModal;
