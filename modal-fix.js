// Modal Management Utility - Enhanced Version
// Ensures only ONE modal is open at a time

(function () {
    'use strict';

    console.log('🔧 Modal Management Utility Loading...');

    // Function to close ALL modals
    function closeAllModals() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.classList.remove('show');
            modal.style.display = 'none';
        });

        // Reset body overflow
        document.body.style.overflow = '';
        document.body.style.position = '';

        console.log('✅ All modals closed');
    }

    // Function to open a specific modal (closes others first)
    function openModal(modalId) {
        // First, close ALL modals
        closeAllModals();

        // Then open the requested modal
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('show');
            modal.style.display = 'flex';
            console.log('✅ Opened modal:', modalId);
        } else {
            console.error('❌ Modal not found:', modalId);
        }
    }

    // Close modals when clicking outside
    document.addEventListener('click', function (e) {
        if (e.target.classList.contains('modal')) {
            closeAllModals();
        }
    });

    // Close modals on ESC key
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });

    // Close modal when clicking X button
    document.addEventListener('click', function (e) {
        if (e.target.classList.contains('modal-close') ||
            e.target.closest('.modal-close')) {
            closeAllModals();
        }
    });

    // Expose globally
    window.closeAllModals = closeAllModals;
    window.openModal = openModal;

    // Auto-close all modals on page load
    window.addEventListener('DOMContentLoaded', function () {
        closeAllModals();
        console.log('✅ Page loaded - all modals closed');
    });

    // Monitor for modal opening and ensure only one is open
    const observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                const target = mutation.target;
                if (target.classList.contains('modal') && target.style.display === 'flex') {
                    // A modal is being opened, close all others
                    const modals = document.querySelectorAll('.modal');
                    modals.forEach(modal => {
                        if (modal !== target && modal.style.display === 'flex') {
                            modal.style.display = 'none';
                            modal.classList.remove('show');
                            console.log('⚠️ Auto-closed conflicting modal:', modal.id);
                        }
                    });
                }
            }
        });
    });

    // Start observing
    window.addEventListener('DOMContentLoaded', function () {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            observer.observe(modal, { attributes: true, attributeFilter: ['style'] });
        });
        console.log('✅ Modal observer started');
    });

    console.log('✅ Modal management utility loaded');
})();
