// Force close all modals - Enhanced version
(function () {
    'use strict';

    console.log('🔧 Forcing all modals to close...');

    // Method 1: Remove all modal elements
    const modals = document.querySelectorAll('.modal, [class*="modal"]');
    modals.forEach(modal => {
        modal.remove();
        console.log('✅ Removed modal:', modal.id || modal.className);
    });

    // Method 2: Remove any overlay/backdrop
    const overlays = document.querySelectorAll('.modal-overlay, .overlay, [style*="position: fixed"]');
    overlays.forEach(overlay => {
        if (overlay.style.position === 'fixed' && overlay.style.zIndex) {
            overlay.remove();
            console.log('✅ Removed overlay');
        }
    });

    // Method 3: Reset body overflow
    document.body.style.overflow = '';
    document.body.style.position = '';

    // Method 4: Remove any inline styles that might be blocking
    document.querySelectorAll('[style]').forEach(el => {
        if (el.style.display === 'none' && el.classList.contains('modal')) {
            el.remove();
        }
    });

    console.log('✅ All modals force-closed!');

    // Reload the page to ensure clean state
    setTimeout(() => {
        console.log('🔄 Reloading page for clean state...');
        window.location.reload();
    }, 500);
})();
