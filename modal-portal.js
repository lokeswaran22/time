/**
 * Portal-Style Modal System (Vanilla JS)
 * Works like React Portals - renders modals at document root level
 * Prevents overlapping, ensures clean open/close
 * Includes Adapter to work with legacy script.js
 */

class ModalPortal {
    constructor() {
        this.activeModal = null;
        this.modalContainer = null;
        this.init();
    }

    init() {
        // Create portal container at document root if not exists
        if (!document.getElementById('modal-portal')) {
            this.modalContainer = document.createElement('div');
            this.modalContainer.id = 'modal-portal';
            this.modalContainer.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 9999;
                pointer-events: none;
            `;
            document.body.appendChild(this.modalContainer);
        } else {
            this.modalContainer = document.getElementById('modal-portal');
        }

        // Setup event listeners
        this.setupEventListeners();

        console.log('✅ Modal Portal System Initialized');
    }

    setupEventListeners() {
        // ESC key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.activeModal) {
                this.close();
            }
        });

        // Delegate click events for modal triggers
        document.addEventListener('click', (e) => {
            // Close button
            if (e.target.closest('.modal-close, .close-modal')) {
                e.preventDefault();
                this.close();
                return;
            }

            // Cancel button
            if (e.target.closest('[id*="cancel"], [id*="Cancel"]')) {
                e.preventDefault();
                const modal = e.target.closest('.modal');
                if (modal) {
                    this.close();
                    return;
                }
            }

            // Click outside modal
            // The portal container captures clicks, so we check if the target is the container itself or the modal wrapper
            if (e.target.classList.contains('modal') && this.activeModal) {
                this.close();
            }
        });
    }

    /**
     * Open a modal - Portal style
     * @param {string} modalId - ID of the modal to open
     */
    open(modalId) {
        if (this.activeModal === modalId) return; // Already open

        // Close any existing modal first
        if (this.activeModal && this.activeModal !== modalId) {
            this.close(true); // true = force close previous
        }

        const modal = document.getElementById(modalId);
        if (!modal) {
            console.error('❌ Modal not found:', modalId);
            return;
        }

        // Move modal to portal container
        this.modalContainer.appendChild(modal);

        // Enable pointer events on portal
        this.modalContainer.style.pointerEvents = 'auto';

        // Show modal
        // We add both classes: 'modal-active' (new system) and 'show' (legacy compatibility)
        modal.classList.add('modal-active');
        modal.classList.add('show');

        // Prevent body scroll
        document.body.style.overflow = 'hidden';

        this.activeModal = modalId;

        console.log('✅ Modal opened:', modalId);
    }

    /**
     * Close the active modal
     * @param {boolean} force - If true, close immediately
     */
    close(force = false) {
        if (!this.activeModal) return;

        const modal = document.getElementById(this.activeModal);
        if (modal) {
            // Hide modal
            modal.classList.remove('modal-active');
            modal.classList.remove('show');

            // Move back to original position in DOM (optional, but good for cleanup)
            // Ideally we just keep it hidden in portal or move back to body
            // Moving back to body ensures scripts looking for it there find it in expected context if position matters
            document.body.appendChild(modal);
        }

        // Disable pointer events on portal
        this.modalContainer.style.pointerEvents = 'none';

        // Restore body scroll
        document.body.style.overflow = '';

        console.log('✅ Modal closed:', this.activeModal);
        this.activeModal = null;
    }

    /**
     * Close all modals (cleanup)
     */
    closeAll() {
        const allModals = document.querySelectorAll('.modal');
        allModals.forEach(modal => {
            modal.classList.remove('modal-active');
            modal.classList.remove('show');
            if (modal.parentElement === this.modalContainer) {
                document.body.appendChild(modal);
            }
        });

        this.modalContainer.style.pointerEvents = 'none';
        document.body.style.overflow = '';
        this.activeModal = null;
        console.log('✅ All modals closed');
    }
}

// ==========================================
// LEGACY ADAPTER (Bridge script.js -> Portal)
// ==========================================
class ModalAdapter {
    constructor(portal) {
        this.portal = portal;
        this.setupObserver();
    }

    setupObserver() {
        // Watch for 'show' class changes on any modal elements in the document
        // script.js toggles 'show' class. We detect this and redirect to Portal.
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const target = mutation.target;
                    if (target.classList.contains('modal')) {
                        const hasShow = target.classList.contains('show');
                        const isPortalActive = target.classList.contains('modal-active');

                        // Case 1: script.js added 'show', but it's not active in portal yet
                        if (hasShow && !isPortalActive) {
                            console.log('Bridge: Detected legacy open for', target.id);
                            this.portal.open(target.id);
                        }

                        // Case 2: script.js removed 'show', we should close
                        if (!hasShow && isPortalActive) {
                            console.log('Bridge: Detected legacy close for', target.id);
                            this.portal.close();
                        }
                    }
                }
            });
        });

        // Observe document body for subtree modifications (to find modals)
        // We target specific modals to avoid massive perf hit
        const modalIds = ['employeeModal', 'activityModal', 'confirmModal', 'employeeActionModal'];
        modalIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                observer.observe(el, { attributes: true, attributeFilter: ['class'] });
            }
        });

        console.log('✅ Modal Adapter (Bridge) Active');
    }
}

// Initialize portal system
let modalPortal;

function initModalPortal() {
    if (!modalPortal) {
        modalPortal = new ModalPortal();
        new ModalAdapter(modalPortal);

        // Expose global functions
        window.openModal = (modalId) => modalPortal.open(modalId);
        window.closeModal = () => modalPortal.close();
        window.closeAllModals = () => modalPortal.closeAll();

        console.log('✅ Global modal functions available');
    }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initModalPortal);
} else {
    initModalPortal();
}
