/**
 * Section Component - Section Block Wrapper
 * Lesson Builder System
 */

import { EventBus, Events } from '../core/EventBus.js';

/**
 * Section factory and utilities
 */
export const Section = {
    /**
     * Create a section DOM element from config
     * @param {Object} config - Section configuration
     * @param {string} config.id - Section identifier
     * @param {string} config.title - Section title
     * @param {string} [config.timing] - Timing string (e.g., "00:00 - 00:30")
     * @param {string} [config.type] - Section type (e.g., "opening", "core-content")
     * @param {string} [config.description] - Section description
     * @param {Object} [config.visual] - Visual configuration
     * @param {Object} [config.audio] - Audio configuration
     * @param {Object} [config.production] - Production notes
     * @returns {HTMLElement}
     */
    create(config) {
        const section = document.createElement('div');
        section.className = 'section';
        section.id = `section-${config.id}`;
        section.dataset.sectionId = config.id;

        section.innerHTML = `
            <!-- Section Header -->
            <div class="section-header">
                <div class="section-title">
                    ${config.timing ? `<span class="timing">${config.timing}</span>` : ''}
                    <h2>${config.title}</h2>
                </div>
                ${config.type ? `<span class="section-type">${this._formatType(config.type)}</span>` : ''}
            </div>

            <!-- Section Description -->
            ${config.description ? `
                <div class="section-description" data-collapsible="description">
                    <h3>Purpose:</h3>
                    <p>${config.description}</p>
                </div>
            ` : ''}

            <!-- Visual Content Container -->
            ${config.visual ? `
                <div class="visual-content" data-visual="${config.id}">
                    <div class="visual-header">
                        <h3>📊 Visual: ${config.visual.title || config.title}</h3>
                        <div class="visual-controls">
                            <button class="btn btn-success" data-export-visual="png">⬇ Export PNG</button>
                            <button class="btn btn-success" data-export-visual="svg">⬇ Export SVG</button>
                        </div>
                    </div>
                    <div class="animation-container" id="${config.visual.id}-container">
                        <!-- Visual will be rendered here -->
                    </div>
                    ${config.visual.steps && config.visual.steps > 1 ? `
                        <div class="step-navigation" data-visual-nav="${config.visual.id}">
                            <!-- StepNavigator will populate this -->
                        </div>
                    ` : ''}
                </div>
            ` : ''}

            <!-- Audio Content Container -->
            ${config.audio ? `
                <div class="audio-section" data-audio="${config.id}">
                    <div class="audio-header" data-toggle="script">
                        <h3>
                            <span class="collapse-icon">▼</span>
                            🎙️ Voice Script (${config.audio.estimatedDuration || 30} seconds)
                        </h3>
                        <div class="audio-controls">
                            <button class="btn btn-primary" data-action="copy-script">📋 Copy</button>
                        </div>
                    </div>
                    <div class="script-content" data-script-content>
                        <div class="script-text" data-script-text>${config.audio.script || ''}</div>
                        <div class="word-count">
                            Word count: ~${config.audio.wordCount || this._countWords(config.audio.script)} | 
                            Estimated duration: ${config.audio.estimatedDuration || 30} seconds
                        </div>
                    </div>
                    <div class="audio-player-container">
                        <audio class="audio-player" controls preload="metadata">
                            <source src="${config.audio.file || ''}" type="audio/mpeg">
                            Your browser does not support the audio element.
                        </audio>
                        <div class="audio-info">
                            <span data-audio-duration>Duration: --:--</span>
                            <button class="btn btn-success" data-action="download-audio">⬇ Download Audio</button>
                        </div>
                    </div>
                </div>
            ` : ''}

            <!-- Production Notes -->
            ${config.production ? `
                <div class="production-notes">
                    <h4>📹 Production Notes for Editor:</h4>
                    <ul>
                        ${config.production.pacing ? `<li><strong>Pacing:</strong> ${config.production.pacing}</li>` : ''}
                        ${config.production.music ? `<li><strong>Music:</strong> ${config.production.music}</li>` : ''}
                        ${config.production.broll ? `<li><strong>B-Roll:</strong> ${config.production.broll.join(', ')}</li>` : ''}
                        ${config.production.transitions ? `<li><strong>Transition:</strong> ${config.production.transitions.type} (${config.production.transitions.duration}s)</li>` : ''}
                    </ul>
                </div>
            ` : ''}
        `;

        return section;
    },

    /**
     * Format section type for display
     * @private
     * @param {string} type
     * @returns {string}
     */
    _formatType(type) {
        return type.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    },

    /**
     * Count words in text
     * @private
     * @param {string} text
     * @returns {number}
     */
    _countWords(text) {
        if (!text) return 0;
        return text.trim().split(/\s+/).filter(word => word.length > 0).length;
    },

    /**
     * Scroll a section into view
     * @param {string} sectionId - Section ID
     * @param {string} [behavior='smooth'] - Scroll behavior
     */
    scrollIntoView(sectionId, behavior = 'smooth') {
        const element = document.getElementById(`section-${sectionId}`);
        if (element) {
            element.scrollIntoView({ behavior, block: 'start' });
        }
    },

    /**
     * Get section element by ID
     * @param {string} sectionId
     * @returns {HTMLElement|null}
     */
    getElement(sectionId) {
        return document.getElementById(`section-${sectionId}`);
    },

    /**
     * Toggle description visibility
     * @param {string} sectionId
     * @returns {boolean} New collapsed state
     */
    toggleDescription(sectionId) {
        const section = this.getElement(sectionId);
        if (!section) return false;

        const description = section.querySelector('.section-description');
        if (description) {
            const isCollapsed = description.classList.toggle('collapsed');
            EventBus.emit(Events.SECTION_DESCRIPTION_TOGGLED, {
                sectionId,
                collapsed: isCollapsed
            });
            return isCollapsed;
        }
        return false;
    },

    /**
     * Check if section is in viewport
     * @param {string} sectionId
     * @returns {boolean}
     */
    isInViewport(sectionId) {
        const element = this.getElement(sectionId);
        if (!element) return false;

        const rect = element.getBoundingClientRect();
        return (
            rect.top < window.innerHeight &&
            rect.bottom > 0
        );
    }
};
