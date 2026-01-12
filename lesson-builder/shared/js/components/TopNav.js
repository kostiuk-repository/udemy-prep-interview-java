/**
 * TopNav Component - Header with Burger Menu and Export Options
 * Lesson Builder System
 */

import { EventBus, Events } from '../core/EventBus.js';

class TopNavClass {
    constructor() {
        this.container = null;
        this.config = null;
        this.state = {
            menuOpen: false,
            exportMenuOpen: false
        };
        this.elements = {};
    }

    /**
     * Initialize the TopNav component
     * @param {Object} config
     * @param {HTMLElement} config.container - Container element
     * @param {string} config.title - Lesson title
     * @param {string} config.lessonId - Lesson identifier
     * @returns {TopNavClass}
     */
    init(config) {
        this.container = config.container;
        this.config = config;

        this._render();
        this._bindEvents();

        return this;
    }

    /**
     * Render TopNav HTML
     * @private
     */
    _render() {
        this.container.innerHTML = `
            <div class="top-nav">
                <div class="nav-left">
                    <button class="burger-menu" id="burgerMenu" aria-label="Toggle menu">
                        <div class="burger-line"></div>
                        <div class="burger-line"></div>
                        <div class="burger-line"></div>
                    </button>
                    <div class="nav-title" id="navTitle">${this.config.title}</div>
                </div>
                <div class="nav-right">
                    <div class="export-dropdown">
                        <button class="export-btn" id="exportBtn">
                            📦 Export
                            <span style="font-size: 0.75rem;">▼</span>
                        </button>
                        <div class="export-menu" id="exportMenu">
                            <button data-export="all">
                                <span>📁</span> Full Lesson Package
                            </button>
                            <button data-export="scripts">
                                <span>🎙️</span> All Voice Scripts
                            </button>
                            <button data-export="production">
                                <span>📹</span> Production Guide
                            </button>
                            <button data-export="timing">
                                <span>⏱️</span> Timing JSON
                            </button>
                            <button data-export="assets">
                                <span>🎨</span> All Assets (ZIP)
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Cache element references
        this.elements = {
            nav: this.container.querySelector('.top-nav'),
            burgerMenu: this.container.querySelector('#burgerMenu'),
            navTitle: this.container.querySelector('#navTitle'),
            exportBtn: this.container.querySelector('#exportBtn'),
            exportMenu: this.container.querySelector('#exportMenu')
        };
    }

    /**
     * Bind event listeners
     * @private
     */
    _bindEvents() {
        // Burger menu click
        this.elements.burgerMenu.addEventListener('click', () => {
            this._toggleMenu();
        });

        // Export button click
        this.elements.exportBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this._toggleExportMenu();
        });

        // Export menu options
        this.elements.exportMenu.addEventListener('click', (e) => {
            const button = e.target.closest('button[data-export]');
            if (button) {
                const exportType = button.dataset.export;
                this._handleExport(exportType);
                this._closeExportMenu();
            }
        });

        // Close export menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.export-dropdown')) {
                this._closeExportMenu();
            }
        });

        // Keyboard support
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this._closeExportMenu();
            }
        });
    }

    /**
     * Toggle burger menu state
     * @private
     */
    _toggleMenu() {
        this.state.menuOpen = !this.state.menuOpen;
        this.elements.burgerMenu.classList.toggle('open', this.state.menuOpen);
        EventBus.emit(Events.MENU_TOGGLE, { open: this.state.menuOpen });
    }

    /**
     * Set menu open state
     * @param {boolean} open
     */
    setMenuOpen(open) {
        this.state.menuOpen = open;
        this.elements.burgerMenu.classList.toggle('open', open);
    }

    /**
     * Toggle export menu
     * @private
     */
    _toggleExportMenu() {
        this.state.exportMenuOpen = !this.state.exportMenuOpen;
        this.elements.exportMenu.classList.toggle('show', this.state.exportMenuOpen);
    }

    /**
     * Open export menu
     */
    openExportMenu() {
        this.state.exportMenuOpen = true;
        this.elements.exportMenu.classList.add('show');
    }

    /**
     * Close export menu
     * @private
     */
    _closeExportMenu() {
        this.state.exportMenuOpen = false;
        this.elements.exportMenu.classList.remove('show');
    }

    /**
     * Handle export selection
     * @private
     * @param {string} type - Export type
     */
    _handleExport(type) {
        EventBus.emit(Events.EXPORT_SELECTED, { type, lessonId: this.config.lessonId });
    }

    /**
     * Update the displayed title
     * @param {string} newTitle
     */
    setTitle(newTitle) {
        this.config.title = newTitle;
        if (this.elements.navTitle) {
            this.elements.navTitle.textContent = newTitle;
        }
    }

    /**
     * Destroy the component
     */
    destroy() {
        if (this.container) {
            this.container.innerHTML = '';
        }
        this.elements = {};
        this.state = { menuOpen: false, exportMenuOpen: false };
    }
}

// Create singleton instance
export const TopNav = new TopNavClass();

// Also export the class
export { TopNavClass };
