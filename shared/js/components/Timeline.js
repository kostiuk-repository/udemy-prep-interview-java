/**
 * Timeline Component - Sidebar with Sections and Progress Tracking
 * Lesson Builder System
 */

import { EventBus, Events } from '../core/EventBus.js';
import { LessonStorage } from '../core/Storage.js';

class TimelineClass {
    constructor() {
        this.container = null;
        this.overlayContainer = null;
        this.config = null;
        this.state = {
            isOpen: false,
            sections: [],
            completed: new Set(),
            currentSection: null
        };
        this.elements = {};
    }

    /**
     * Initialize the Timeline component
     * @param {Object} config
     * @param {HTMLElement} config.container - Sidebar container
     * @param {HTMLElement} [config.overlayContainer] - Overlay element
     * @param {Array} config.sections - Section configurations
     * @param {string} config.lessonId - Lesson identifier
     * @returns {TimelineClass}
     */
    init(config) {
        this.container = config.container;
        this.overlayContainer = config.overlayContainer;
        this.config = config;
        this.state.sections = config.sections || [];

        // Load saved progress
        this._loadProgress();

        this._render();
        this._bindEvents();
        this._setupEventBusListeners();

        return this;
    }

    /**
     * Load progress from storage
     * @private
     */
    _loadProgress() {
        const completed = LessonStorage.getProgress(this.config.lessonId);
        this.state.completed = new Set(completed);
    }

    /**
     * Render Timeline HTML
     * @private
     */
    _render() {
        const progressCount = this.state.completed.size;
        const totalCount = this.state.sections.length;

        this.container.innerHTML = `
            <div class="sidebar-header">
                <h3>📋 Timeline</h3>
                <div class="sidebar-progress" id="progressIndicator">
                    Completed: ${progressCount}/${totalCount} sections
                </div>
            </div>
            <div class="timeline-items">
                ${this.state.sections.map((section, index) => this._renderItem(section, index)).join('')}
            </div>
        `;

        if (this.overlayContainer) {
            this.overlayContainer.className = 'sidebar-overlay';
        }

        // Cache element references
        this.elements = {
            progressIndicator: this.container.querySelector('#progressIndicator'),
            items: this.container.querySelectorAll('.timeline-item'),
            checkboxes: this.container.querySelectorAll('.timeline-checkbox')
        };
    }

    /**
     * Render a single timeline item
     * @private
     * @param {Object} section - Section config
     * @param {number} index - Section index
     * @returns {string} HTML string
     */
    _renderItem(section, index) {
        const isCompleted = this.state.completed.has(section.id);
        const isActive = this.state.currentSection === section.id;

        return `
            <div class="timeline-item${isCompleted ? ' completed' : ''}${isActive ? ' active' : ''}" 
                 data-section="${section.id}" 
                 data-index="${index}">
                <input type="checkbox" 
                       class="timeline-checkbox" 
                       data-section="${section.id}"
                       ${isCompleted ? 'checked' : ''}>
                <div class="timeline-content">
                    <div class="timeline-time">${section.timing || ''}</div>
                    <div class="timeline-title">${section.title}</div>
                    <div class="timeline-desc">${section.description || ''}</div>
                </div>
            </div>
        `;
    }

    /**
     * Bind event listeners
     * @private
     */
    _bindEvents() {
        // Timeline item clicks
        this.container.addEventListener('click', (e) => {
            const item = e.target.closest('.timeline-item');
            const checkbox = e.target.closest('.timeline-checkbox');

            if (checkbox) {
                // Handle checkbox change
                e.stopPropagation();
                const sectionId = checkbox.dataset.section;
                this._handleCheckboxChange(sectionId, checkbox.checked);
            } else if (item) {
                // Handle item click (navigate to section)
                const sectionId = item.dataset.section;
                this._handleSectionClick(sectionId);
            }
        });

        // Overlay click to close
        if (this.overlayContainer) {
            this.overlayContainer.addEventListener('click', () => {
                this.close();
            });
        }

        // Keyboard support
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.state.isOpen) {
                this.close();
            }
        });
    }

    /**
     * Setup EventBus listeners
     * @private
     */
    _setupEventBusListeners() {
        // Listen for section visibility
        EventBus.on(Events.SECTION_VISIBLE, ({ sectionId }) => {
            this._setActiveSection(sectionId);
        });
    }

    /**
     * Handle checkbox change
     * @private
     * @param {string} sectionId
     * @param {boolean} checked
     */
    _handleCheckboxChange(sectionId, checked) {
        if (checked) {
            this.state.completed.add(sectionId);
        } else {
            this.state.completed.delete(sectionId);
        }

        // Update item styling
        const item = this.container.querySelector(`[data-section="${sectionId}"]`);
        if (item) {
            item.classList.toggle('completed', checked);
        }

        // Update progress indicator
        this._updateProgress();

        // Emit event
        EventBus.emit(Events.TIMELINE_CHECKBOX_CHANGED, { sectionId, checked });
    }

    /**
     * Handle section click
     * @private
     * @param {string} sectionId
     */
    _handleSectionClick(sectionId) {
        EventBus.emit(Events.TIMELINE_SECTION_CLICKED, { sectionId });
    }

    /**
     * Set the active section (highlight in timeline)
     * @private
     * @param {string} sectionId
     */
    _setActiveSection(sectionId) {
        this.state.currentSection = sectionId;

        // Remove active class from all items
        this.elements.items.forEach(item => {
            item.classList.remove('active');
        });

        // Add active class to current item
        const activeItem = this.container.querySelector(`[data-section="${sectionId}"]`);
        if (activeItem) {
            activeItem.classList.add('active');
        }
    }

    /**
     * Update progress indicator
     * @private
     */
    _updateProgress() {
        const progressCount = this.state.completed.size;
        const totalCount = this.state.sections.length;

        if (this.elements.progressIndicator) {
            this.elements.progressIndicator.textContent =
                `Completed: ${progressCount}/${totalCount} sections`;
        }
    }

    /**
     * Open the sidebar
     */
    open() {
        this.state.isOpen = true;
        this.container.classList.add('open');
        if (this.overlayContainer) {
            this.overlayContainer.classList.add('show');
        }
    }

    /**
     * Close the sidebar
     */
    close() {
        this.state.isOpen = false;
        this.container.classList.remove('open');
        if (this.overlayContainer) {
            this.overlayContainer.classList.remove('show');
        }
        EventBus.emit(Events.TIMELINE_CLOSED, {});
    }

    /**
     * Toggle the sidebar
     */
    toggle() {
        if (this.state.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    /**
     * Set a section as completed
     * @param {string} sectionId
     * @param {boolean} isCompleted
     */
    setCompleted(sectionId, isCompleted) {
        const checkbox = this.container.querySelector(
            `.timeline-checkbox[data-section="${sectionId}"]`
        );

        if (checkbox) {
            checkbox.checked = isCompleted;
            this._handleCheckboxChange(sectionId, isCompleted);
        }
    }

    /**
     * Navigate to a section
     * @param {string} sectionId
     */
    goToSection(sectionId) {
        this._handleSectionClick(sectionId);
    }

    /**
     * Get completion status
     * @returns {{completed: number, total: number, percentage: number}}
     */
    getProgress() {
        const completed = this.state.completed.size;
        const total = this.state.sections.length;
        return {
            completed,
            total,
            percentage: total > 0 ? Math.round((completed / total) * 100) : 0
        };
    }

    /**
     * Destroy the component
     */
    destroy() {
        if (this.container) {
            this.container.innerHTML = '';
            this.container.classList.remove('open');
        }
        if (this.overlayContainer) {
            this.overlayContainer.classList.remove('show');
        }
        this.elements = {};
        this.state = {
            isOpen: false,
            sections: [],
            completed: new Set(),
            currentSection: null
        };
    }
}

// Create singleton instance
export const Timeline = new TimelineClass();

// Also export the class
export { TimelineClass };
