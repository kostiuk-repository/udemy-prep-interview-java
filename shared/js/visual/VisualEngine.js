/**
 * VisualEngine - State-Based Animation System
 * Lesson Builder System
 * 
 * Orchestrator that connects SceneManager (state) with Interpolator (math).
 * Refactored to delegate logic to modules.
 */

import { lerp, getEasing, easeInOutCubic } from '../utils/animation.js';
import {
    DEFAULTS,
    interpolateProps,
    isColor,
    interpolateColor,
    parseColor,
    deepMerge
} from './modules/StateInterpolator.js';
import { SceneManager } from './modules/SceneManager.js';
import { getWorldTransform, getAnchorPosition, Position } from './modules/TransformUtils.js';
import { Logger } from './modules/Telemetry.js';

// Re-export DEFAULTS for backward compatibility
export { DEFAULTS };

// ==========================================================================
// STATE-BASED ENGINE
// ==========================================================================

/**
 * StateBasedEngine - Core animation engine
 */
export class StateBasedEngine {
    /**
     * Create a new StateBasedEngine
     * @param {Object} options
     * @param {number} [options.width=3840] - Canvas width in pixels
     * @param {number} [options.height=2400] - Canvas height in pixels
     * @param {number} [options.fps=60] - Frames per second
     */
    constructor(options = {}) {
        this.width = options.width || 3840;
        this.height = options.height || 2400;
        this.fps = options.fps || 60;

        // Delegate state management to SceneManager
        this.sceneManager = new SceneManager({
            width: this.width,
            height: this.height,
            fps: this.fps
        });

        // Animation state
        this.isAnimating = false;
        this.animationProgress = 0;
        this.animationDuration = 1000;
        this.easingFn = easeInOutCubic;
        this.currentStepIndex = -1;
        this.targetStepIndex = -1;

        // Current interpolated state (object ID -> properties)
        this.currentState = new Map();

        // States for transition
        this._fromState = new Map();
        this._toState = new Map();

        // Objects being faded in/out (managed during transition)
        this.fadingIn = new Set();
        this.fadingOut = new Map();

        // Callbacks
        this.onStepChange = null;
        this.onAnimationComplete = null;
    }

    // ==========================================================================
    // SCENE MANAGEMENT (Delegated to SceneManager)
    // ==========================================================================

    /**
     * Load a scene definition
     * @param {Object} scene - Scene definition with steps array
     */
    loadScene(scene) {
        this.sceneManager.loadScene(scene);
        this.currentStepIndex = -1;
        this.targetStepIndex = -1;
        this.currentState.clear();
        this._fromState.clear();
        this._toState.clear();
        this.fadingIn.clear();
        this.fadingOut.clear();
        this.isAnimating = false;

        // Expose scene for legacy access
        this.scene = scene;

        // Go to first step immediately if exists
        if (this.sceneManager.getStepCount() > 0) {
            this.gotoStep(0, 0);
        }
    }

    /**
     * Get step by ID or index
     * @param {string|number} stepIdOrIndex
     * @returns {Object|null}
     */
    getStep(stepIdOrIndex) {
        return this.sceneManager.getStep(stepIdOrIndex);
    }

    /**
     * Get step index by ID
     * @param {string} stepId
     * @returns {number}
     */
    getStepIndex(stepId) {
        return this.sceneManager.getStepIndex(stepId);
    }

    /**
     * Get total number of steps
     * @returns {number}
     */
    getStepCount() {
        return this.sceneManager.getStepCount();
    }

    /**
     * Get total frames for the entire scene
     * @returns {number}
     */
    getTotalFrames() {
        return this.sceneManager.getTotalFrames();
    }

    // ==========================================================================
    // STEP TRANSITIONS
    // ==========================================================================

    /**
     * Transition to a specific step
     * @param {string|number} stepIdOrIndex - Step ID or index
     * @param {number} [duration] - Transition duration in ms (0 for instant)
     * @param {string|Function} [easing='easeInOutCubic'] - Easing function
     */
    gotoStep(stepIdOrIndex, duration, easing = 'easeInOutCubic') {
        const targetIndex = typeof stepIdOrIndex === 'number'
            ? stepIdOrIndex
            : this.sceneManager.getStepIndex(stepIdOrIndex);

        if (targetIndex < 0 || targetIndex >= this.getStepCount()) {
            console.warn(`StateBasedEngine: Invalid step: ${stepIdOrIndex}`);
            return;
        }

        const step = this.sceneManager.getStep(targetIndex);
        const stepDuration = duration ?? step.duration ?? this.sceneManager.scene?.duration ?? 1000;

        // Capture current state as starting point
        this._fromState = new Map(this.currentState);

        // Build target state using SceneManager's persistence logic (DEEP MERGE)
        this._toState = this.sceneManager.buildAccumulatedState(targetIndex);

        // Detect changes for fade in/out handling
        const changes = this.sceneManager.detectChanges(this._fromState, this._toState);
        this._setupFading(changes);

        this.targetStepIndex = targetIndex;
        this.animationDuration = stepDuration;
        this.easingFn = typeof easing === 'function' ? easing : getEasing(easing);

        if (stepDuration === 0) {
            this._finalizeTransition();
        } else {
            this.isAnimating = true;
            this.animationProgress = 0;
        }
    }

    /**
     * Go to next step
     * @param {number} [duration] - Transition duration
     */
    nextStep(duration) {
        if (this.currentStepIndex < this.getStepCount() - 1) {
            this.gotoStep(this.currentStepIndex + 1, duration);
        }
    }

    /**
     * Go to previous step
     * @param {number} [duration] - Transition duration
     */
    prevStep(duration) {
        if (this.currentStepIndex > 0) {
            this.gotoStep(this.currentStepIndex - 1, duration);
        }
    }

    // ==========================================================================
    // SEEKING (FOR VIDEO EXPORT)
    // ==========================================================================

    /**
     * Seek to a specific frame (deterministic rendering for video export)
     * @param {number} frame - Frame number
     */
    seekToFrame(frame) {
        const totalFrames = this.getTotalFrames();
        if (frame < 0 || frame >= totalFrames) {
            console.warn(`seekToFrame: Frame ${frame} out of range (0-${totalFrames})`);
            return;
        }

        // Find which step this frame belongs to
        let frameCount = 0;
        const steps = this.sceneManager.scene?.steps || [];

        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            const stepDuration = step.duration ?? this.sceneManager.scene?.duration ?? 1000;
            const stepFrames = Math.ceil((stepDuration / 1000) * this.fps);

            if (frame < frameCount + stepFrames) {
                // Found the active step transition
                const progress = (frame - frameCount) / stepFrames;

                // Debug logging
                const debugEnabled = typeof window !== 'undefined' && window.DEBUG_RENDER === true;
                if (frame % 60 === 0 || debugEnabled) {
                    Logger.debug('VisualEngine', `seekToFrame(${frame})`, { step: i, progress: progress.toFixed(2), progressMs: (frameCount + progress * stepFrames / this.fps * 1000).toFixed(0) });
                }

                // Get states from SceneManager
                // Note: Step 0 transitions from empty state
                const fromState = i > 0 ? this.sceneManager.buildAccumulatedState(i - 1) : new Map();
                const toState = this.sceneManager.buildAccumulatedState(i);

                // Console log step transition details
                if (i !== this.currentStepIndex && debugEnabled) {
                    console.log(`[VisualEngine] Step ${i - 1} -> ${i}, frame: ${frame}, fromState: ${fromState.size} objs, toState: ${toState.size} objs`);
                }

                // Compute interpolated state
                this._computeStateAtProgress(fromState, toState, progress);
                this.currentStepIndex = i;
                return;
            }
            frameCount += stepFrames;
        }

        console.warn(`seekToFrame: Could not find step for frame ${frame}`);
    }

    // ==========================================================================
    // ANIMATION LOOP
    // ==========================================================================

    /**
     * Update animation state (call each frame)
     * @param {number} deltaTime - Time since last update in ms
     */
    update(deltaTime) {
        if (!this.isAnimating) return;

        this.animationProgress += deltaTime / this.animationDuration;

        if (this.animationProgress >= 1) {
            this._finalizeTransition();
        } else {
            this._computeStateAtProgress(this._fromState, this._toState, this.animationProgress);
        }
    }

    /**
     * Finalize a step transition
     * @private
     */
    _finalizeTransition() {
        this.animationProgress = 1;
        this.isAnimating = false;
        this.currentState = this._toState;
        this.currentStepIndex = this.targetStepIndex;
        this.fadingIn.clear();
        this.fadingOut.clear();

        if (this.onStepChange) {
            this.onStepChange(this.currentStepIndex, this.sceneManager.getStep(this.currentStepIndex));
        }
        if (this.onAnimationComplete) {
            this.onAnimationComplete();
        }
    }

    // ==========================================================================
    // INTERNAL INTERPOLATION LOGIC
    // ==========================================================================

    /**
     * Setup fading in/out sets based on detected changes
     * @private
     */
    _setupFading(changes) {
        this.fadingIn.clear();
        this.fadingOut.clear();

        changes.added.forEach(item => this.fadingIn.add(item.id));
        changes.removed.forEach(item => this.fadingOut.set(item.id, item.props));
    }

    /**
     * Compute interpolated state at given progress
     * @private
     */
    _computeStateAtProgress(fromState, toState, progress) {
        const easedProgress = this.easingFn(progress);
        const newState = new Map();

        // 1. Interpolate persisting objects (exist in both states)
        for (const [id, toProps] of toState) {
            const fromProps = fromState.get(id);
            if (fromProps) {
                // Object exists in both - interpolate all properties
                newState.set(id, interpolateProps(fromProps, toProps, easedProgress));
            } else {
                // 2. Handle Fade In (New objects)
                const interpolated = { ...toProps };
                interpolated.opacity = lerp(0, toProps.opacity ?? 1, easedProgress);
                newState.set(id, interpolated);
            }
        }

        // 3. Handle Fade Out (Removed objects)
        if (this.isAnimating) {
            // Live transition: use fadingOut map
            for (const [id, lastProps] of this.fadingOut) {
                const interpolated = { ...lastProps };
                interpolated.opacity = lerp(lastProps.opacity ?? 1, 0, easedProgress);
                newState.set(id, interpolated);
            }
        } else {
            // Seeking (video export): derive from state comparison
            for (const [id, fromProps] of fromState) {
                if (!toState.has(id)) {
                    const interpolated = { ...fromProps };
                    interpolated.opacity = lerp(fromProps.opacity ?? 1, 0, easedProgress);
                    if (interpolated.opacity > 0.01) {
                        newState.set(id, interpolated);
                    }
                }
            }
        }

        this.currentState = newState;
    }

    // ==========================================================================
    // WORLD COORDINATES (Delegated to TransformUtils)
    // ==========================================================================

    /**
     * Get world transform for an object (accounting for parent transforms)
     * @param {string} objectId
     * @returns {Object} World position and transform
     */
    getWorldTransform(objectId) {
        return getWorldTransform(this.currentState, objectId, this.width, this.height);
    }

    /**
     * Get anchor position in world coordinates
     * @param {string} objectId
     * @param {string} anchor - 'top' | 'bottom' | 'left' | 'right' | 'center'
     * @returns {Object} { x, y } in pixels
     */
    getAnchorPosition(objectId, anchor = 'center') {
        return getAnchorPosition(this.currentState, objectId, anchor, this.width, this.height);
    }

    // ==========================================================================
    // STATE ACCESS
    // ==========================================================================

    /**
     * Get current interpolated state as array of objects
     * @returns {Array<Object>}
     */
    getCurrentState() {
        const objects = [];

        for (const [id, props] of this.currentState) {
            // Skip children that are part of groups (rendered by parent)
            if (props._parentId) continue;

            objects.push({
                id,
                type: props._type,
                props: this._cleanProps(props),
                children: props._children
            });
        }

        // Sort by zIndex
        objects.sort((a, b) => (a.props.zIndex ?? 0) - (b.props.zIndex ?? 0));

        return objects;
    }

    /**
     * Remove internal properties from props object
     * @private
     */
    _cleanProps(props) {
        const clean = {};
        for (const [key, value] of Object.entries(props)) {
            if (!key.startsWith('_')) {
                clean[key] = value;
            }
        }
        return clean;
    }

    /**
     * Get object by ID from current state
     * @param {string} objectId
     * @returns {Object|null}
     */
    getObject(objectId) {
        const props = this.currentState.get(objectId);
        if (!props) return null;

        return {
            id: objectId,
            type: props._type,
            props: this._cleanProps(props)
        };
    }
}

// ==========================================================================
// LEGACY EXPORTS (for backwards compatibility)
// ==========================================================================

// Re-export Position from TransformUtils
export { Position };

// Re-export from animation.js for convenience
export { lerp, getEasing, easeInOutCubic } from '../utils/animation.js';

// Re-export modular utilities for direct import
export { Logger } from './modules/Telemetry.js';
export { SceneManager } from './modules/SceneManager.js';
export { interpolateProps, deepMerge } from './modules/StateInterpolator.js';
