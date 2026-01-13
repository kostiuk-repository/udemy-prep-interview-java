/**
 * VisualBlock Component - Konva-Based Animation Container
 * Lesson Builder System
 * 
 * Clean architecture using:
 * - StageManager (Konva.Stage wrapper)
 * - SceneBuilder (JSON to Konva converter)
 * - VideoService (professional video export)
 * 
 * No more custom rendering math - Konva handles everything.
 */

import { EventBus, Events } from '../core/EventBus.js';
import { StepNavigator } from './StepNavigator.js';
import { StageManager } from '../engine/StageManager.js';
import { SceneBuilder } from '../engine/SceneBuilder.js';
import { VideoService } from '../services/VideoService.js';

/**
 * VisualBlock manager - handles multiple visual blocks
 */
const visualBlocks = new Map();

/**
 * Default resolution settings
 */
const RESOLUTION = {
    PREVIEW: 0.5,  // 1920x1200 for smooth UI
    EXPORT: 1.0    // 3840x2400 for 4K output
};

export const VisualBlock = {
    /**
     * Initialize a VisualBlock instance
     * @param {Object} config
     * @param {HTMLElement} config.container - Container element
     * @param {string} config.visualId - Visual identifier
     * @param {Object} config.scene - Scene definition
     * @returns {Object} VisualBlock instance
     */
    init(config) {
        const scene = config.scene || config.composition;
        const totalSteps = scene?.steps?.length || 1;

        const instance = {
            container: config.container,
            visualId: config.visualId,
            scene: scene,
            state: {
                currentStep: 1,
                totalSteps: totalSteps,
                isExporting: false
            },
            stageManager: null,
            sceneBuilder: null,
            stepNavigator: null
        };

        // Create container for Konva
        this._prepareContainer(instance);

        // Initialize Konva stage and scene
        this._initStage(instance);

        // Initialize step navigator if multi-step
        if (totalSteps > 1) {
            this._initStepNavigator(instance);
        }

        // Bind export button events
        this._bindExportEvents(instance);

        // Store instance
        visualBlocks.set(config.visualId, instance);

        console.log(`[VisualBlock] Initialized "${config.visualId}" with ${totalSteps} steps`);

        return instance;
    },

    /**
     * Prepare container for Konva
     * @private
     */
    _prepareContainer(instance) {
        const container = instance.container.querySelector('.animation-container') ||
            instance.container.querySelector(`#${instance.visualId}-container`) ||
            instance.container;

        // Create Konva container div
        let konvaContainer = container.querySelector('.visual-konva-container');
        if (!konvaContainer) {
            konvaContainer = document.createElement('div');
            konvaContainer.className = 'visual-konva-container';
            konvaContainer.style.cssText = `
                width: 100%;
                max-width: 1920px;
                aspect-ratio: 16 / 10;
                margin: 0 auto;
                position: relative;
            `;
            container.appendChild(konvaContainer);
        }

        instance.konvaContainer = konvaContainer;
    },

    /**
     * Initialize Konva stage and scene
     * @private
     */
    _initStage(instance) {
        // Create StageManager
        instance.stageManager = new StageManager(instance.konvaContainer, 3840, 2400, {
            scale: RESOLUTION.PREVIEW
        });

        // Create SceneBuilder
        instance.sceneBuilder = new SceneBuilder(instance.stageManager);

        // Build scene
        if (instance.scene) {
            instance.sceneBuilder.build(instance.scene);
        }
    },

    /**
     * Initialize step navigator
     * @private
     */
    _initStepNavigator(instance) {
        const navContainer = instance.container.querySelector('.step-navigation') ||
            instance.container.querySelector(`[data-visual-nav="${instance.visualId}"]`);

        if (navContainer) {
            instance.stepNavigator = StepNavigator.init({
                container: navContainer,
                visualId: instance.visualId,
                totalSteps: instance.state.totalSteps,
                initialStep: 1,
                onStepChange: (step) => {
                    this.gotoStep(instance.visualId, step);
                }
            });
        }
    },

    /**
     * Bind export button events
     * @private
     */
    _bindExportEvents(instance) {
        // PNG export
        const pngButtons = instance.container.querySelectorAll('[data-export-visual="png"]');
        pngButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.exportPNG(instance.visualId);
            });
        });

        // Video export
        const videoButtons = instance.container.querySelectorAll('[data-export-visual="video"]');
        videoButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.exportVideo(instance.visualId);
            });
        });
    },

    // ==========================================================================
    // PUBLIC API
    // ==========================================================================

    /**
     * Navigate to a specific step
     * @param {string} visualId
     * @param {number} stepNumber - 1-indexed step number
     * @param {number} [duration] - Transition duration in ms
     */
    gotoStep(visualId, stepNumber, duration) {
        const instance = visualBlocks.get(visualId);
        if (!instance?.sceneBuilder) return;

        const stepIndex = stepNumber - 1;
        const transitionDuration = duration ?? instance.scene?.duration ?? 1000;

        instance.sceneBuilder.goToStep(stepIndex, transitionDuration);
        instance.state.currentStep = stepNumber;

        EventBus.emit(Events.VISUAL_STEP_RENDERED, {
            visualId: visualId,
            step: stepNumber
        });

        this._updateSyncHighlights(visualId, stepNumber);
    },

    /**
     * Go to next step
     * @param {string} visualId
     */
    nextStep(visualId) {
        const instance = visualBlocks.get(visualId);
        if (!instance) return;

        if (instance.state.currentStep < instance.state.totalSteps) {
            this.gotoStep(visualId, instance.state.currentStep + 1);
        }
    },

    /**
     * Go to previous step
     * @param {string} visualId
     */
    prevStep(visualId) {
        const instance = visualBlocks.get(visualId);
        if (!instance) return;

        if (instance.state.currentStep > 1) {
            this.gotoStep(visualId, instance.state.currentStep - 1);
        }
    },

    /**
     * Render a specific step (alias for gotoStep, for LessonCore compatibility)
     * @param {string} visualId
     * @param {number} stepNumber - 1-indexed step number
     */
    renderStep(visualId, stepNumber) {
        this.gotoStep(visualId, stepNumber, 0); // Instant jump
    },

    /**
     * Export current step as PNG at 4K resolution
     * @param {string} visualId
     */
    async exportPNG(visualId) {
        const instance = visualBlocks.get(visualId);
        if (!instance) return;

        EventBus.emit(Events.VISUAL_EXPORT_STARTED, { format: 'png', count: 1 });

        try {
            // Export at full resolution
            const blob = await instance.stageManager.toBlob({
                scale: RESOLUTION.EXPORT,
                mimeType: 'image/png'
            });
            
            // Download
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${visualId}-step-${instance.state.currentStep}.png`;
            a.click();
            URL.revokeObjectURL(url);

            EventBus.emit(Events.VISUAL_EXPORT_COMPLETE, { format: 'png', files: 1 });
        } catch (error) {
            console.error('PNG export failed:', error);
        }
    },

    /**
     * Export full animation as video
     * @param {string} visualId
     */
    async exportVideo(visualId) {
        const instance = visualBlocks.get(visualId);
        if (!instance?.scene) {
            console.warn('No scene loaded for video export');
            return;
        }

        if (instance.state.isExporting) {
            console.warn('Export already in progress');
            return;
        }

        instance.state.isExporting = true;
        EventBus.emit(Events.VISUAL_EXPORT_STARTED, { format: 'video', count: 1 });

        // Create progress UI
        const progressDiv = document.createElement('div');
        progressDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.95);
            color: white;
            padding: 2rem 3rem;
            border-radius: 12px;
            z-index: 10000;
            text-align: center;
            min-width: 400px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
        `;
        progressDiv.innerHTML = `
            <h3 style="margin-top: 0; font-size: 1.5rem;">Exporting Video...</h3>
            <p style="color: #94a3b8; margin: 0.5rem 0;">Using Konva.js + VideoEncoder + webm-muxer</p>
            <div id="progress-text" style="margin: 1.5rem 0; font-size: 1.1rem; font-weight: 600;">Preparing...</div>
            <progress id="progress-bar" style="width: 100%; height: 8px;" value="0" max="100"></progress>
            <p style="color: #64748b; margin-top: 1rem; font-size: 0.9rem;">This may take a minute...</p>
        `;
        document.body.appendChild(progressDiv);

        const progressText = progressDiv.querySelector('#progress-text');
        const progressBar = progressDiv.querySelector('#progress-bar');

        try {
            const videoService = new VideoService({
                width: 3840,
                height: 2400,
                fps: 60
            });

            // Export video with progress
            const blob = await videoService.export(instance.stageManager, instance.sceneBuilder, {
                onProgress: (current, total) => {
                    const percent = Math.round((current / total) * 100);
                    progressText.textContent = `Frame ${current} / ${total} (${percent}%)`;
                    progressBar.value = percent;
                },
                holdFrames: 30
            });

            // Download
            videoService.downloadVideo(blob, `${visualId}-animation.webm`);

            EventBus.emit(Events.VISUAL_EXPORT_COMPLETE, { format: 'video', files: 1 });

        } catch (error) {
            console.error('Video export failed:', error);
            alert(`Video export failed: ${error.message}`);
        } finally {
            instance.state.isExporting = false;
            document.body.removeChild(progressDiv);
        }
    },

    /**
     * Update sync highlights in script section
     * @private
     */
    _updateSyncHighlights(visualId, stepNumber) {
        const scriptText = document.querySelector(`[data-visual-id="${visualId}"]`);
        if (!scriptText) return;

        scriptText.querySelectorAll('.sync-highlight').forEach(el => {
            el.classList.remove('active');
        });

        const activeHighlight = scriptText.querySelector(`[data-sync-step="${stepNumber}"]`);
        if (activeHighlight) {
            activeHighlight.classList.add('active');
            // Note: Removed scrollIntoView to keep animation visible
        }
    },

    /**
     * Get current step number
     * @param {string} visualId
     * @returns {number}
     */
    getCurrentStep(visualId) {
        const instance = visualBlocks.get(visualId);
        return instance?.state.currentStep || 1;
    },

    /**
     * Get stage manager instance
     * @param {string} visualId
     * @returns {StageManager|null}
     */
    getStageManager(visualId) {
        const instance = visualBlocks.get(visualId);
        return instance?.stageManager || null;
    },

    /**
     * Get scene builder instance
     * @param {string} visualId
     * @returns {SceneBuilder|null}
     */
    getSceneBuilder(visualId) {
        const instance = visualBlocks.get(visualId);
        return instance?.sceneBuilder || null;
    },

    /**
     * Destroy visual block and clean up
     * @param {string} visualId
     */
    destroy(visualId) {
        const instance = visualBlocks.get(visualId);
        if (!instance) return;

        // Clean up resources
        if (instance.sceneBuilder) {
            instance.sceneBuilder.destroy();
        }
        if (instance.stageManager) {
            instance.stageManager.destroy();
        }

        // Remove from registry
        visualBlocks.delete(visualId);

        console.log(`[VisualBlock] Destroyed "${visualId}"`);
    }
};
