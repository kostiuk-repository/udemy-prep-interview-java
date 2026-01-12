/**
 * LessonCore - Main Orchestrator
 * Lesson Builder System
 * 
 * Central module that initializes all components, manages global state,
 * and coordinates communication between components via EventBus.
 */

import { EventBus, Events } from './EventBus.js';
import { LessonStorage } from './Storage.js';
import { TopNav } from '../components/TopNav.js';
import { Timeline } from '../components/Timeline.js';
import { Section } from '../components/Section.js';
import { AudioPlayer } from '../components/AudioPlayer.js';
import { StepNavigator } from '../components/StepNavigator.js';
import { VisualBlock } from '../components/VisualBlock.js';
import { ExportManager } from '../components/ExportManager.js';

class LessonCoreClass {
    constructor() {
        this.config = null;
        this.visuals = null;
        this.initialized = false;
        this.currentSection = null;
        this.components = {
            topNav: null,
            timeline: null,
            sections: new Map(),
            audioPlayers: new Map(),
            stepNavigators: new Map(),
            visualBlocks: new Map()
        };
        this.intersectionObserver = null;
    }

    /**
     * Initialize the lesson with configuration
     * @param {Object} config - Lesson configuration
     * @param {Object} [visuals] - Visual compositions map
     */
    async init(config, visuals = {}) {
        if (this.initialized) {
            console.warn('LessonCore: Already initialized');
            return;
        }

        this.config = config;
        this.visuals = visuals;

        try {
            // 1. Initialize TopNav
            this._initTopNav();

            // 2. Initialize Timeline
            this._initTimeline();

            // 3. Initialize sections
            this._initSections();

            // 4. Setup EventBus listeners
            this._setupEventListeners();

            // 5. Setup Intersection Observer for section visibility
            this._setupIntersectionObserver();

            // 6. Initialize ExportManager
            ExportManager.init(this.config);

            // 7. Handle initial URL hash
            this._handleUrlHash();

            // 8. Mark as initialized
            this.initialized = true;
            EventBus.emit(Events.LESSON_INITIALIZED, { lessonId: config.id });

            console.log(`LessonCore: Initialized lesson "${config.title}"`);
        } catch (error) {
            console.error('LessonCore: Initialization failed:', error);
            throw error;
        }
    }

    /**
     * Initialize TopNav component
     * @private
     */
    _initTopNav() {
        const container = document.getElementById('topNav');
        if (!container) {
            console.warn('LessonCore: TopNav container not found');
            return;
        }

        this.components.topNav = TopNav.init({
            container,
            title: this.config.title,
            lessonId: this.config.id
        });
    }

    /**
     * Initialize Timeline component
     * @private
     */
    _initTimeline() {
        const sidebarContainer = document.getElementById('timelineSidebar');
        const overlayContainer = document.getElementById('sidebarOverlay');

        if (!sidebarContainer) {
            console.warn('LessonCore: Timeline sidebar container not found');
            return;
        }

        this.components.timeline = Timeline.init({
            container: sidebarContainer,
            overlayContainer,
            sections: this.config.sections,
            lessonId: this.config.id
        });
    }

    /**
     * Initialize all sections from config
     * @private
     */
    _initSections() {
        this.config.sections.forEach((sectionConfig, index) => {
            const containerId = `section-${sectionConfig.id}`;
            let container = document.getElementById(containerId);

            if (!container) {
                // Container doesn't exist - create section and append
                const mainContainer = document.querySelector('.container');
                if (mainContainer) {
                    const sectionElement = Section.create(sectionConfig);
                    mainContainer.appendChild(sectionElement);
                    container = sectionElement;
                }
            } else if (container.innerHTML.trim() === '' || !container.querySelector('.section-header')) {
                // Container exists but is empty placeholder - fill it with content
                const sectionElement = Section.create(sectionConfig);
                container.replaceWith(sectionElement);
                container = sectionElement;
            }

            // Initialize audio and visual components
            if (container) {
                this._initSectionContents(sectionConfig, container);
                this.components.sections.set(sectionConfig.id, container);
            }
        });
    }

    /**
     * Initialize audio players and visual blocks within a section
     * @private
     */
    _initSectionContents(sectionConfig, container) {
        // Initialize AudioPlayer if section has audio
        if (sectionConfig.audio) {
            const audioContainer = container.querySelector('.audio-section') ||
                container.querySelector(`[data-audio="${sectionConfig.id}"]`);

            if (audioContainer) {
                const audioPlayer = AudioPlayer.init({
                    container: audioContainer,
                    sectionId: sectionConfig.id,
                    scriptText: sectionConfig.audio.script,
                    audioFile: sectionConfig.audio.file,
                    wordCount: sectionConfig.audio.wordCount,
                    estimatedDuration: sectionConfig.audio.estimatedDuration
                });
                this.components.audioPlayers.set(sectionConfig.id, audioPlayer);
            }
        }

        // Initialize VisualBlock if section has visual
        if (sectionConfig.visual) {
            const visualContainer = container.querySelector('.visual-content') ||
                container.querySelector(`[data-visual="${sectionConfig.id}"]`);

            if (visualContainer) {
                const composition = this.visuals[sectionConfig.visual.id];

                const visualBlock = VisualBlock.init({
                    container: visualContainer,
                    visualId: sectionConfig.visual.id,
                    composition: composition,
                    totalSteps: sectionConfig.visual.steps || 1
                });
                this.components.visualBlocks.set(sectionConfig.visual.id, visualBlock);
            }
        }
    }

    /**
     * Setup EventBus listeners for component coordination
     * @private
     */
    _setupEventListeners() {
        // TopNav menu toggle -> Timeline toggle
        EventBus.on(Events.MENU_TOGGLE, ({ open }) => {
            if (this.components.timeline) {
                if (open) {
                    Timeline.open();
                } else {
                    Timeline.close();
                }
            }
        });

        // Timeline closed -> Sync burger menu state
        EventBus.on(Events.TIMELINE_CLOSED, () => {
            if (this.components.topNav) {
                TopNav.setMenuOpen(false);
            }
        });

        // Timeline section clicked -> Scroll to section
        EventBus.on(Events.TIMELINE_SECTION_CLICKED, ({ sectionId }) => {
            this.goToSection(sectionId);
        });

        // Timeline checkbox changed -> Save progress
        EventBus.on(Events.TIMELINE_CHECKBOX_CHANGED, ({ sectionId, checked }) => {
            if (checked) {
                LessonStorage.markCompleted(this.config.id, sectionId);
            } else {
                LessonStorage.unmarkCompleted(this.config.id, sectionId);
            }
            EventBus.emit(Events.PROGRESS_UPDATED, {
                lessonId: this.config.id,
                progress: LessonStorage.getProgress(this.config.id)
            });
        });

        // Step changed -> Update visual
        EventBus.on(Events.STEP_CHANGED, ({ visualId, step }) => {
            const visualBlock = this.components.visualBlocks.get(visualId);
            if (visualBlock) {
                VisualBlock.renderStep(visualId, step);
            }
        });

        // Audio ended -> Could auto-advance (optional)
        EventBus.on(Events.AUDIO_ENDED, ({ sectionId }) => {
            // Optional: Auto-mark section as completed
            // LessonStorage.markCompleted(this.config.id, sectionId);
        });

        // Hash change handler
        window.addEventListener('hashchange', () => this._handleUrlHash());
    }

    /**
     * Setup Intersection Observer for section visibility tracking
     * @private
     */
    _setupIntersectionObserver() {
        const options = {
            root: null,
            rootMargin: '-20% 0px -60% 0px',
            threshold: 0
        };

        this.intersectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const sectionId = entry.target.id.replace('section-', '');
                    this.currentSection = sectionId;
                    EventBus.emit(Events.SECTION_VISIBLE, { sectionId });
                }
            });
        }, options);

        // Observe all sections
        this.components.sections.forEach((container, sectionId) => {
            if (container) {
                this.intersectionObserver.observe(container);
            }
        });
    }

    /**
     * Handle URL hash for deep linking
     * @private
     */
    _handleUrlHash() {
        const hash = window.location.hash;
        if (hash) {
            const sectionId = hash.replace('#section-', '').replace('#', '');
            if (sectionId && this.components.sections.has(sectionId)) {
                setTimeout(() => this.goToSection(sectionId), 100);
            }
        }
    }

    /**
     * Navigate to a specific section
     * @param {string} sectionId - Section ID to scroll to
     * @param {string} [behavior='smooth'] - Scroll behavior
     */
    goToSection(sectionId, behavior = 'smooth') {
        const container = document.getElementById(`section-${sectionId}`);
        if (container) {
            // Close timeline if open
            Timeline.close();

            // Scroll to section
            setTimeout(() => {
                container.scrollIntoView({ behavior, block: 'start' });

                // Update URL hash without triggering scroll
                history.replaceState(null, null, `#section-${sectionId}`);
            }, 300);
        }
    }

    /**
     * Get current lesson progress
     * @returns {{completed: number, total: number, percentage: number}}
     */
    getProgress() {
        const completed = LessonStorage.getProgress(this.config.id).length;
        const total = this.config.sections.length;
        return {
            completed,
            total,
            percentage: total > 0 ? Math.round((completed / total) * 100) : 0
        };
    }

    /**
     * Get the current lesson configuration
     * @returns {Object}
     */
    getConfig() {
        return this.config;
    }

    /**
     * Get all visual compositions
     * @returns {Object}
     */
    getVisuals() {
        return this.visuals;
    }

    /**
     * Destroy the lesson and clean up
     */
    destroy() {
        // Disconnect intersection observer
        if (this.intersectionObserver) {
            this.intersectionObserver.disconnect();
            this.intersectionObserver = null;
        }

        // Clear EventBus listeners
        EventBus.clear();

        // Destroy components
        if (this.components.topNav) {
            TopNav.destroy();
        }
        if (this.components.timeline) {
            Timeline.destroy();
        }

        // Clear component maps
        this.components.sections.clear();
        this.components.audioPlayers.clear();
        this.components.stepNavigators.clear();
        this.components.visualBlocks.clear();

        // Reset state
        this.config = null;
        this.visuals = null;
        this.initialized = false;
        this.currentSection = null;

        EventBus.emit(Events.LESSON_DESTROYED, {});
        console.log('LessonCore: Destroyed');
    }
}

// Create singleton instance
export const LessonCore = new LessonCoreClass();

// Also export the class
export { LessonCoreClass };
