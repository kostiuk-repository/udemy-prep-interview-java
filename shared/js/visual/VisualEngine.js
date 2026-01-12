/**
 * VisualEngine - State-Based Animation System
 * Lesson Builder System
 * 
 * Declarative state-based animation engine for 4K video generation.
 * Scene → Step → Objects model with automatic property interpolation.
 */

import { lerp, getEasing, easeInOutCubic } from '../utils/animation.js';

// ==========================================================================
// DEFAULT PROPERTY VALUES
// ==========================================================================

/**
 * Default values for object properties.
 * Used when a property is missing in one step but present in another.
 */
export const DEFAULTS = {
    x: 0,
    y: 0,
    z: 0,
    width: 100,
    height: 100,
    opacity: 1,
    scale: 1,
    rotation: 0,
    fill: '#000000',
    stroke: 'transparent',
    strokeWidth: 1,
    fontSize: 16,
    rx: 0,
    ry: 0
};

// ==========================================================================
// STATE-BASED ENGINE
// ==========================================================================

/**
 * StateBasedEngine - Core animation engine using Scene → Step → Objects model
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

        this.scene = null;
        this.currentStepIndex = -1;
        this.targetStepIndex = -1;

        // Animation state
        this.isAnimating = false;
        this.animationProgress = 0;
        this.animationDuration = 1000;
        this.easingFn = easeInOutCubic;

        // Current interpolated state (object ID -> properties)
        this.currentState = new Map();

        // Previous step state for interpolation
        this.previousState = new Map();

        // Objects being faded in/out
        this.fadingIn = new Set();
        this.fadingOut = new Map(); // ID -> last known state

        // Callbacks
        this.onStepChange = null;
        this.onAnimationComplete = null;
    }

    // ==========================================================================
    // SCENE MANAGEMENT
    // ==========================================================================

    /**
     * Load a scene definition
     * @param {Object} scene - Scene definition with steps array
     */
    loadScene(scene) {
        this.scene = scene;
        this.currentStepIndex = -1;
        this.targetStepIndex = -1;
        this.currentState.clear();
        this.previousState.clear();
        this.fadingIn.clear();
        this.fadingOut.clear();
        this.isAnimating = false;

        // Go to first step immediately
        if (scene.steps && scene.steps.length > 0) {
            this.gotoStep(0, 0);
        }
    }

    /**
     * Get step by ID or index
     * @param {string|number} stepIdOrIndex
     * @returns {Object|null}
     */
    getStep(stepIdOrIndex) {
        if (!this.scene?.steps) return null;

        if (typeof stepIdOrIndex === 'number') {
            return this.scene.steps[stepIdOrIndex] || null;
        }

        return this.scene.steps.find(s => s.id === stepIdOrIndex) || null;
    }

    /**
     * Get step index by ID
     * @param {string} stepId
     * @returns {number}
     */
    getStepIndex(stepId) {
        if (!this.scene?.steps) return -1;
        return this.scene.steps.findIndex(s => s.id === stepId);
    }

    /**
     * Get total number of steps
     * @returns {number}
     */
    getStepCount() {
        return this.scene?.steps?.length || 0;
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
            : this.getStepIndex(stepIdOrIndex);

        if (targetIndex < 0 || targetIndex >= this.getStepCount()) {
            console.warn(`StateBasedEngine: Invalid step: ${stepIdOrIndex}`);
            return;
        }

        const step = this.scene.steps[targetIndex];
        const stepDuration = duration ?? step.duration ?? this.scene.duration ?? 1000;

        // Store previous state for interpolation
        this.previousState = new Map(this.currentState);

        // Build target state from step objects
        const targetState = this._buildStateFromStep(step);

        // Detect new and removed objects
        this._detectObjectChanges(targetState);

        this.targetStepIndex = targetIndex;
        this.animationDuration = stepDuration;
        this.easingFn = typeof easing === 'function' ? easing : getEasing(easing);

        if (stepDuration === 0) {
            // Instant transition
            this.currentState = targetState;
            this.currentStepIndex = targetIndex;
            this.isAnimating = false;
            this.animationProgress = 1;
            this.fadingIn.clear();
            this.fadingOut.clear();

            if (this.onStepChange) {
                this.onStepChange(targetIndex, step);
            }
        } else {
            // Animated transition
            this.isAnimating = true;
            this.animationProgress = 0;
            this._targetState = targetState;
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

    /**
     * Seek to a specific frame (for video export)
     * Directly computes the interpolated state for the given frame.
     * @param {number} frame - Frame number
     */
    seekToFrame(frame) {
        const totalFrames = this.getTotalFrames();
        if (frame < 0 || frame >= totalFrames) {
            console.warn(`seekToFrame: Frame ${frame} out of range (0-${totalFrames})`);
            return;
        }

        // Calculate which step and progress within step
        let frameCount = 0;
        for (let i = 0; i < this.scene.steps.length; i++) {
            const step = this.scene.steps[i];
            const stepDuration = step.duration ?? this.scene.duration ?? 1000;
            const stepFrames = Math.ceil((stepDuration / 1000) * this.fps);

            if (frame < frameCount + stepFrames) {
                // Frame is within this step's transition
                const progress = (frame - frameCount) / stepFrames;

                // Debug logging (reduced frequency)
                if (frame % 60 === 0) {
                    console.log(`seekToFrame(${frame}): step=${i}, progress=${progress.toFixed(2)}`);
                }

                // Determine the previous step (for interpolation source)
                const prevStepIndex = i > 0 ? i - 1 : 0;
                const prevStep = this.scene.steps[prevStepIndex];

                // Build states for interpolation
                const fromState = this._buildStateFromStep(prevStep);
                const toState = this._buildStateFromStep(step);

                // For step 0, we transition from nothing to the first step
                // For other steps, we interpolate from previous step to current
                if (i === 0) {
                    // First step: just progress into this step
                    // Objects fade in from 0 opacity
                    this._computeDirectState(fromState, toState, progress, true);
                } else {
                    // Transition between steps
                    this._computeDirectState(fromState, toState, progress, false);
                }

                this.currentStepIndex = i;
                return;
            }

            frameCount += stepFrames;
        }

        console.warn(`seekToFrame: Could not find step for frame ${frame}`);
    }

    /**
     * Directly compute interpolated state for video export
     * @private
     */
    _computeDirectState(fromState, toState, progress, isFirstStep) {
        const easedProgress = this.easingFn ? this.easingFn(progress) : progress;
        const newState = new Map();

        // Get all object IDs from both states
        const allIds = new Set([...fromState.keys(), ...toState.keys()]);

        for (const id of allIds) {
            const fromProps = fromState.get(id);
            const toProps = toState.get(id);

            if (fromProps && toProps) {
                // Object exists in both states - interpolate
                newState.set(id, this._interpolateProps(fromProps, toProps, easedProgress));
            } else if (toProps && !fromProps) {
                // New object - fade in
                const interpolated = { ...toProps };
                if (isFirstStep) {
                    interpolated.opacity = lerp(0, toProps.opacity ?? 1, easedProgress);
                } else {
                    interpolated.opacity = lerp(0, toProps.opacity ?? 1, easedProgress);
                }
                newState.set(id, interpolated);
            } else if (fromProps && !toProps) {
                // Removed object - fade out
                const interpolated = { ...fromProps };
                interpolated.opacity = lerp(fromProps.opacity ?? 1, 0, easedProgress);
                if (interpolated.opacity > 0.01) {
                    newState.set(id, interpolated);
                }
            }
        }

        this.currentState = newState;
    }

    /**
 * Get total frames for the entire scene
 * @returns {number}
 */
    getTotalFrames() {
        if (!this.scene?.steps) return 0;

        let totalMs = 0;
        for (const step of this.scene.steps) {
            totalMs += step.duration ?? this.scene.duration ?? 1000;
        }

        return Math.ceil((totalMs / 1000) * this.fps);
    }

    // ==========================================================================
    // ANIMATION UPDATE
    // ==========================================================================

    /**
     * Update animation state (call each frame)
     * @param {number} deltaTime - Time since last update in ms
     */
    update(deltaTime) {
        if (!this.isAnimating) return;

        this.animationProgress += deltaTime / this.animationDuration;

        if (this.animationProgress >= 1) {
            // Animation complete
            this.animationProgress = 1;
            this.isAnimating = false;
            this.currentState = this._targetState;
            this.currentStepIndex = this.targetStepIndex;
            this.fadingIn.clear();
            this.fadingOut.clear();

            if (this.onStepChange) {
                this.onStepChange(this.currentStepIndex, this.scene.steps[this.currentStepIndex]);
            }

            if (this.onAnimationComplete) {
                this.onAnimationComplete();
            }
        } else {
            this._updateInterpolatedState();
        }
    }

    /**
     * Update interpolated state based on current progress
     * @private
     */
    _updateInterpolatedState() {
        const easedProgress = this.easingFn(this.animationProgress);
        const newState = new Map();

        // Interpolate existing objects
        for (const [id, targetProps] of this._targetState) {
            const prevProps = this.previousState.get(id);

            if (prevProps) {
                // Object exists in both states - interpolate
                newState.set(id, this._interpolateProps(prevProps, targetProps, easedProgress));
            } else if (this.fadingIn.has(id)) {
                // New object - fade in
                const interpolated = { ...targetProps };
                interpolated.opacity = lerp(0, targetProps.opacity ?? 1, easedProgress);
                newState.set(id, interpolated);
            }
        }

        // Handle fading out objects
        for (const [id, lastProps] of this.fadingOut) {
            const interpolated = { ...lastProps };
            interpolated.opacity = lerp(lastProps.opacity ?? 1, 0, easedProgress);
            newState.set(id, interpolated);
        }

        this.currentState = newState;
    }

    // ==========================================================================
    // STATE BUILDING
    // ==========================================================================

    /**
     * Build state map from step definition
     * @private
     * @param {Object} step
     * @returns {Map<string, Object>}
     */
    _buildStateFromStep(step) {
        const state = new Map();

        if (!step?.objects) return state;

        for (const obj of step.objects) {
            const fullProps = this._buildObjectProps(obj);
            state.set(obj.id, fullProps);

            // Recursively add children for groups
            if (obj.type === 'group' && obj.children) {
                this._addChildrenToState(state, obj.id, obj.children, fullProps);
            }
        }

        return state;
    }

    /**
     * Build complete object properties with defaults
     * @private
     */
    _buildObjectProps(obj) {
        const props = { ...obj.props };
        props._type = obj.type;
        props._id = obj.id;

        // Include children reference for groups
        if (obj.children) {
            props._children = obj.children;
        }

        return props;
    }

    /**
     * Add group children to state (for flat rendering)
     * @private
     */
    _addChildrenToState(state, parentId, children, parentProps) {
        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            const childId = child.id || `${parentId}_child_${i}`;
            const childProps = {
                ...child.props,
                _type: child.type,
                _id: childId,
                _parentId: parentId,
                _parentProps: parentProps
            };
            state.set(childId, childProps);

            // Recurse for nested groups
            if (child.type === 'group' && child.children) {
                this._addChildrenToState(state, childId, child.children, childProps);
            }
        }
    }

    /**
     * Detect new and removed objects between states
     * @private
     */
    _detectObjectChanges(targetState) {
        this.fadingIn.clear();
        this.fadingOut.clear();

        // Find new objects (in target but not in previous)
        for (const id of targetState.keys()) {
            if (!this.previousState.has(id)) {
                this.fadingIn.add(id);
            }
        }

        // Find removed objects (in previous but not in target)
        for (const [id, props] of this.previousState) {
            if (!targetState.has(id)) {
                this.fadingOut.set(id, props);
            }
        }
    }

    // ==========================================================================
    // INTERPOLATION
    // ==========================================================================

    /**
     * Interpolate between two property objects
     * @private
     */
    _interpolateProps(from, to, t) {
        const result = {};
        const allKeys = new Set([...Object.keys(from), ...Object.keys(to)]);

        for (const key of allKeys) {
            // Skip internal properties
            if (key.startsWith('_')) {
                result[key] = to[key] ?? from[key];
                continue;
            }

            const fromVal = from[key] ?? DEFAULTS[key];
            const toVal = to[key] ?? DEFAULTS[key];

            if (fromVal === undefined && toVal === undefined) {
                continue;
            }

            if (fromVal === undefined) {
                result[key] = toVal;
            } else if (toVal === undefined) {
                result[key] = fromVal;
            } else if (typeof fromVal === 'number' && typeof toVal === 'number') {
                result[key] = lerp(fromVal, toVal, t);
            } else if (typeof fromVal === 'string' && typeof toVal === 'string') {
                if (this._isColor(fromVal) && this._isColor(toVal)) {
                    result[key] = this._interpolateColor(fromVal, toVal, t);
                } else {
                    result[key] = t > 0.5 ? toVal : fromVal;
                }
            } else if (typeof fromVal === 'object' && typeof toVal === 'object') {
                // Recursively interpolate nested objects (like shadow)
                result[key] = this._interpolateProps(fromVal, toVal, t);
            } else {
                result[key] = t > 0.5 ? toVal : fromVal;
            }
        }

        return result;
    }

    /**
     * Check if string is a color
     * @private
     */
    _isColor(str) {
        return /^#([0-9A-Fa-f]{3,8})$/.test(str) ||
            /^rgba?\(/.test(str) ||
            /^hsla?\(/.test(str);
    }

    /**
     * Interpolate between two colors
     * @private
     */
    _interpolateColor(from, to, t) {
        const fromRGB = this._parseColor(from);
        const toRGB = this._parseColor(to);

        const r = Math.round(lerp(fromRGB.r, toRGB.r, t));
        const g = Math.round(lerp(fromRGB.g, toRGB.g, t));
        const b = Math.round(lerp(fromRGB.b, toRGB.b, t));
        const a = lerp(fromRGB.a, toRGB.a, t);

        if (a < 1) {
            return `rgba(${r}, ${g}, ${b}, ${a.toFixed(3)})`;
        }
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }

    /**
     * Parse color string to RGBA object
     * @private
     */
    _parseColor(color) {
        // Handle hex
        if (color.startsWith('#')) {
            let hex = color.slice(1);
            if (hex.length === 3) {
                hex = hex.split('').map(c => c + c).join('');
            }
            if (hex.length === 6) {
                hex += 'ff';
            }
            return {
                r: parseInt(hex.slice(0, 2), 16),
                g: parseInt(hex.slice(2, 4), 16),
                b: parseInt(hex.slice(4, 6), 16),
                a: parseInt(hex.slice(6, 8), 16) / 255
            };
        }

        // Handle rgba
        const rgbaMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?\)/);
        if (rgbaMatch) {
            return {
                r: parseInt(rgbaMatch[1]),
                g: parseInt(rgbaMatch[2]),
                b: parseInt(rgbaMatch[3]),
                a: rgbaMatch[4] ? parseFloat(rgbaMatch[4]) : 1
            };
        }

        return { r: 0, g: 0, b: 0, a: 1 };
    }

    // ==========================================================================
    // WORLD COORDINATES
    // ==========================================================================

    /**
     * Get world transform for an object (accounting for parent transforms)
     * @param {string} objectId
     * @returns {Object} World position and transform
     */
    getWorldTransform(objectId) {
        const props = this.currentState.get(objectId);
        if (!props) return null;

        let worldX = (props.x ?? 0) * this.width / 100;
        let worldY = (props.y ?? 0) * this.height / 100;
        let worldScale = props.scale ?? 1;
        let worldRotation = props.rotation ?? 0;

        // Apply z-depth scaling
        const z = props.z ?? 0;
        worldScale *= (1 + z * 0.01);

        // Apply parent transforms if nested in group
        if (props._parentId) {
            const parentTransform = this.getWorldTransform(props._parentId);
            if (parentTransform) {
                // Apply parent translation
                const cos = Math.cos(parentTransform.rotation * Math.PI / 180);
                const sin = Math.sin(parentTransform.rotation * Math.PI / 180);

                const localX = worldX;
                const localY = worldY;

                worldX = parentTransform.x + (localX * cos - localY * sin) * parentTransform.scale;
                worldY = parentTransform.y + (localX * sin + localY * cos) * parentTransform.scale;
                worldScale *= parentTransform.scale;
                worldRotation += parentTransform.rotation;
            }
        }

        return {
            x: worldX,
            y: worldY,
            scale: worldScale,
            rotation: worldRotation,
            props
        };
    }

    /**
     * Get anchor position in world coordinates
     * @param {string} objectId
     * @param {string} anchor - 'top' | 'bottom' | 'left' | 'right' | 'center'
     * @returns {Object} { x, y } in pixels
     */
    getAnchorPosition(objectId, anchor = 'center') {
        const world = this.getWorldTransform(objectId);
        if (!world) return null;

        const props = world.props;
        const width = (props.width ?? 100) * this.width / 100 * world.scale;
        const height = (props.height ?? 100) * this.height / 100 * world.scale;

        let offsetX = 0, offsetY = 0;

        switch (anchor) {
            case 'top':
                offsetY = -height / 2;
                break;
            case 'bottom':
                offsetY = height / 2;
                break;
            case 'left':
                offsetX = -width / 2;
                break;
            case 'right':
                offsetX = width / 2;
                break;
            case 'center':
            default:
                break;
        }

        // Apply rotation to offset
        const rad = world.rotation * Math.PI / 180;
        const rotatedX = offsetX * Math.cos(rad) - offsetY * Math.sin(rad);
        const rotatedY = offsetX * Math.sin(rad) + offsetY * Math.cos(rad);

        return {
            x: world.x + rotatedX,
            y: world.y + rotatedY
        };
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
            // Skip children that are part of groups (they're rendered with parent)
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
// POSITIONING HELPERS
// ==========================================================================

export const Position = {
    Center: () => ({ x: 50, y: 50 }),
    Top: (offset = 5) => ({ x: 50, y: offset }),
    Bottom: (offset = 5) => ({ x: 50, y: 100 - offset }),
    Left: (offset = 5) => ({ x: offset, y: 50 }),
    Right: (offset = 5) => ({ x: 100 - offset, y: 50 }),
    TopLeft: (offset = 5) => ({ x: offset, y: offset }),
    TopRight: (offset = 5) => ({ x: 100 - offset, y: offset }),
    BottomLeft: (offset = 5) => ({ x: offset, y: 100 - offset }),
    BottomRight: (offset = 5) => ({ x: 100 - offset, y: 100 - offset }),

    /**
     * Get position in a grid layout
     * @param {number} rows - Number of rows
     * @param {number} cols - Number of columns
     * @param {number} index - Cell index (0-based)
     * @param {number} [padding=10] - Padding from edges in %
     * @returns {Object} { x, y }
     */
    Grid: (rows, cols, index, padding = 10) => {
        const row = Math.floor(index / cols);
        const col = index % cols;

        const cellWidth = (100 - 2 * padding) / cols;
        const cellHeight = (100 - 2 * padding) / rows;

        return {
            x: padding + cellWidth * (col + 0.5),
            y: padding + cellHeight * (row + 0.5)
        };
    }
};

// ==========================================================================
// LEGACY EXPORTS (for backwards compatibility)
// ==========================================================================

// Re-export from animation.js for convenience
export { lerp, getEasing, easeInOutCubic } from '../utils/animation.js';
