import { useEffect, useState } from 'react';

function Preloader() {
    const [isVisible, setIsVisible] = useState(true);
    const [isFading, setIsFading] = useState(false);

    useEffect(() => {
        const hasLoadedBefore = sessionStorage.getItem('hasLoadedBefore');

        if (hasLoadedBefore) {
            setIsVisible(false);
        } else {
            sessionStorage.setItem('hasLoadedBefore', 'true');
            setTimeout(() => {
                setIsFading(true);
                setTimeout(() => {
                    setIsVisible(false);
                }, 800); // Match CSS transition
            }, 1500);
        }
    }, []);

    if (!isVisible) return null;

    return (
        <div id="preloader" className={isFading ? 'hide' : ''}>
            <div className="preloader-content">
                <img src="/images/logogo.jpg" alt="Loading..." className="preloader-logo" />
                <div className="loading-bar">
                    <div className="loading-progress"></div>
                </div>
            </div>
        </div>
    );
}

export default Preloader;
