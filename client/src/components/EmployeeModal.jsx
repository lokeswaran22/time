import { useState, useEffect } from 'react';

function EmployeeModal({ employee, onClose, onSave }) {
    const [name, setName] = useState('');

    useEffect(() => {
        if (employee) {
            setName(employee.name);
        } else {
            setName('');
        }
    }, [employee]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name.trim()) {
            alert('Please enter an employee name');
            return;
        }
        onSave(name);
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
                    <h3>{employee ? 'Edit Employee' : 'Add Employee'}</h3>
                    <button className="modal-close" onClick={onClose}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="modal-body">
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="employeeName">Employee Name</label>
                            <input
                                type="text"
                                id="employeeName"
                                className="form-input"
                                placeholder="Enter employee name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                autoFocus
                            />
                        </div>
                        <div className="form-actions">
                            <button type="button" className="btn btn-secondary" onClick={onClose}>
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary">
                                Save Employee
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default EmployeeModal;
