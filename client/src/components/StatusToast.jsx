import { useEffect, useState } from 'react';

function StatusToast({ message, type = 'success' }) {
    const [show, setShow] = useState(false);

    useEffect(() => {
        setTimeout(() => setShow(true), 10);
    }, []);

    return (
        <div className={`status-toast ${type} ${show ? 'show' : ''}`}>
            {message}
        </div>
    );
}

export default StatusToast;
