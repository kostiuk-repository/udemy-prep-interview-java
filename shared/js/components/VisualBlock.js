/**
 * VisualBlock Component - State-Based Animation Container
 * Lesson Builder System
 * 
 * Features:
 * - Dual mode: Interactive (0.5x preview) vs Export (1.0x full)
 * - Step navigation with animated transitions
 * - PNG/SVG export at 4K resolution
 * - Video export with progress indicator
 */

import { EventBus, Events } from '../core/EventBus.js';
import { StepNavigator } from './StepNavigator.js';
import { StateBasedEngine } from '../visual/VisualEngine.js';
import { CanvasRenderer } from '../visual/CanvasRenderer.js';
import { VideoExporter, downloadVideo, createProgressUI } from '../visual/VideoExporter.js';

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
     * Initialize a VisualBlock instance with state-based animation
     * @param {Object} config
     * @param {HTMLElement} config.container - Container element
     * @param {string} config.visualId - Visual identifier
     * @param {Object} config.scene - Scene definition
     * @param {number} [config.totalSteps] - Number of steps (auto-detected from scene)
     * @param {boolean} [config.useCanvas=true] - Use canvas renderer
     * @returns {Object} VisualBlock instance
     */
    init(config) {
        // Support both 'scene' and 'composition' for backward compatibility
        const scene = config.scene || config.composition;
        const totalSteps = config.totalSteps || scene?.steps?.length || 1;

        const instance = {
            container: config.container,
            visualId: config.visualId,
            scene: scene,
            state: {
                currentStep: 1,
                totalSteps: totalSteps,
                isAnimating: false,
                isExporting: false
            },
            elements: {},
            engine: null,
            renderer: null,
            stepNavigator: null,
            animationFrame: null
        };

        // Create canvas element
        this._createCanvas(instance);

        // Initialize engine and renderer
        this._initEngine(instance);

        // Initialize step navigator if multi-step
        if (totalSteps > 1) {
            this._initStepNavigator(instance);
        }

        // Bind export button events
        this._bindExportEvents(instance);

        // Store instance
        visualBlocks.set(config.visualId, instance);

        // Start animation loop
        this._startAnimationLoop(instance);

        return instance;
    },

    /**
     * Create canvas element
     * @private
     */
    _createCanvas(instance) {
        const container = instance.container.querySelector('.animation-container') ||
            instance.container.querySelector(`#${instance.visualId}-container`) ||
            instance.container;

        // Create canvas wrapper with aspect ratio
        let wrapper = container.querySelector('.visual-canvas-wrapper');
        if (!wrapper) {
            wrapper = document.createElement('div');
            wrapper.className = 'visual-canvas-wrapper';
            wrapper.style.cssText = `
                width: 100%;
                height: 100%;
                position: absolute;
                top: 0;
                left: 0;
                display: flex;
                align-items: center;
                justify-content: center;
            `;
            container.appendChild(wrapper);
        }

        // Create canvas
        let canvas = wrapper.querySelector('canvas.visual-canvas');
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.className = 'visual-canvas';
            canvas.style.cssText = `
                width: 100%;
                height: 100%;
                display: block;
                object-fit: contain;
            `;
            wrapper.appendChild(canvas);
        }

        instance.elements.wrapper = wrapper;
        instance.elements.canvas = canvas;
        instance.elements.animationContainer = container;
    },

    /**
     * Initialize engine and renderer
     * @private
     */
    _initEngine(instance) {
        const canvas = instance.elements.canvas;

        // Create renderer with preview resolution
        instance.renderer = new CanvasRenderer(canvas, {
            scale: RESOLUTION.PREVIEW,
            depthOfField: true
        });

        // Create engine
        instance.engine = new StateBasedEngine({
            width: 3840,
            height: 2400,
            fps: 60
        });

        // Link engine to renderer
        instance.renderer.setEngine(instance.engine);

        // Load scene - support both state-based scenes and compositions
        const scene = instance.scene;
        if (scene) {
            // Check if this is a state-based scene (has steps) or needs conversion
            if (scene.steps) {
                // State-based scene - load directly
                instance.engine.loadScene(scene);
                console.log(`VisualBlock: Loaded state-based scene "${instance.visualId}" with ${scene.steps.length} steps`);
            } else if (scene.layers) {
                // Legacy composition - convert to state-based format
                console.warn(`VisualBlock: Legacy composition detected for "${instance.visualId}", conversion not yet implemented`);
            } else {
                console.warn(`VisualBlock: Unknown scene format for "${instance.visualId}"`, scene);
            }
        } else {
            console.warn(`VisualBlock: No scene provided for "${instance.visualId}"`);
        }

        // Set up callbacks
        instance.engine.onStepChange = (stepIndex, step) => {
            instance.state.currentStep = stepIndex + 1;
            instance.state.isAnimating = false;

            EventBus.emit(Events.VISUAL_STEP_RENDERED, {
                visualId: instance.visualId,
                step: stepIndex + 1
            });
        };
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
     * Start animation loop
     * @private
     */
    _startAnimationLoop(instance) {
        let lastTime = performance.now();

        const loop = (currentTime) => {
            const deltaTime = currentTime - lastTime;
            lastTime = currentTime;

            // Update engine
            if (instance.engine) {
                instance.engine.update(deltaTime);

                // Render current state
                const objects = instance.engine.getCurrentState();
                instance.renderer.render(objects, {
                    background: instance.scene?.background
                });
            }

            instance.animationFrame = requestAnimationFrame(loop);
        };

        instance.animationFrame = requestAnimationFrame(loop);
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

        // SVG export (not supported with canvas renderer)
        const svgButtons = instance.container.querySelectorAll('[data-export-visual="svg"]');
        svgButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                console.warn('SVG export not available with canvas renderer');
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
        if (!instance?.engine) return;

        instance.state.isAnimating = true;
        instance.engine.gotoStep(stepNumber - 1, duration);

        // Update sync highlights
        this._updateSyncHighlights(visualId, stepNumber);
    },

    /**
     * Go to next step
     * @param {string} visualId
     */
    nextStep(visualId) {
        const instance = visualBlocks.get(visualId);
        if (!instance?.engine) return;

        if (instance.state.currentStep < instance.state.totalSteps) {
            this.gotoStep(visualId, instance.state.currentStep + 1);
        }
    },

    /**
     * Go to previous step
    prevStep(visualId) {
        const instance = visualBlocks.get(visualId);
        if (!instance?.engine) return;

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
        this.gotoStep(visualId, stepNumber);
    },

    /**
     * Export current step as PNG at 4K resolution
     * @param {string} visualId
     */
    async exportPNG(visualId) {
        const instance = visualBlocks.get(visualId);
        if (!instance?.engine) return;

        EventBus.emit(Events.VISUAL_EXPORT_STARTED, { format: 'png', count: 1 });

        try {
            // Create temporary 4K canvas
            const exportCanvas = document.createElement('canvas');
            const exportRenderer = new CanvasRenderer(exportCanvas, { scale: RESOLUTION.EXPORT });
            exportRenderer.setEngine(instance.engine);

            // Render current state at full resolution
            const objects = instance.engine.getCurrentState();
            exportRenderer.render(objects, { background: instance.scene?.background });

            // Download as PNG
            const blob = await exportRenderer.toPNG();
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
        const progressUI = createProgressUI(document.body);

        try {
            const exporter = new VideoExporter({
                width: 3840,
                height: 2400,
                fps: 60
            });

            // Set up cancel handler
            progressUI.onCancel(() => {
                exporter.cancel();
                instance.state.isExporting = false;
                progressUI.hide();
            });

            // Export video with progress
            const blob = await exporter.renderVideo(instance.scene, {
                onProgress: (current, total) => {
                    progressUI.update(current, total);
                },
                holdFrames: 30 // Hold each step for 0.5 seconds at 60fps
            });

            // Download video
            downloadVideo(blob, `${visualId}-animation.webm`);

            EventBus.emit(Events.VISUAL_EXPORT_COMPLETE, { format: 'video', files: 1 });

        } catch (error) {
            console.error('Video export failed:', error);
        } finally {
            instance.state.isExporting = false;
            progressUI.hide();
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
     * Get engine instance
     * @param {string} visualId
     * @returns {StateBasedEngine|null}
     */
    getEngine(visualId) {
        const instance = visualBlocks.get(visualId);
        return instance?.engine || null;
    },

    /**
     * Update scene definition
     * @param {string} visualId
     * @param {Object} scene - New scene definition
     */
    updateScene(visualId, scene) {
        const instance = visualBlocks.get(visualId);
        if (!instance?.engine) return;

        instance.scene = scene;
        instance.state.totalSteps = scene.steps?.length || 1;
        instance.engine.loadScene(scene);
    },

    /**
     * Destroy a visual block instance
     * @param {string} visualId
     */
    destroy(visualId) {
        const instance = visualBlocks.get(visualId);
        if (!instance) return;

        // Cancel animation loop
        if (instance.animationFrame) {
            cancelAnimationFrame(instance.animationFrame);
        }

        // Destroy step navigator
        if (instance.stepNavigator) {
            StepNavigator.destroy(visualId);
        }

        visualBlocks.delete(visualId);
    },

    /**
     * Destroy all visual block instances
     */
    destroyAll() {
        visualBlocks.forEach((_, visualId) => {
            this.destroy(visualId);
        });
    }
};
