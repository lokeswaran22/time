// Simple Modal System - No Overlaps, Clean and Working
(function () {
    'use strict';

    console.log('🔧 Simple Modal System Loading...');

    let currentOpenModal = null;

    // Close all modals
    function closeAllModals() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.style.display = 'none';
        });
        currentOpenModal = null;
        document.body.style.overflow = '';
        console.log('✅ All modals closed');
    }

    // Open a specific modal
    function openModal(modalId) {
        // Close any open modal first
        closeAllModals();

        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
            currentOpenModal = modalId;
            console.log('✅ Opened modal:', modalId);
        }
    }

    // Initialize when DOM is ready
    function init() {
        // Close all modals on page load
        closeAllModals();

        // Add click handlers to all close buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', closeAllModals);
        });

        // Close modal when clicking outside
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', function (e) {
                if (e.target === modal) {
                    closeAllModals();
                }
            });
        });

        // Close on ESC key
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && currentOpenModal) {
                closeAllModals();
            }
        });

        console.log('✅ Modal system initialized');
    }

    // Expose functions globally
    window.closeAllModals = closeAllModals;
    window.openModal = openModal;

    // Initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
