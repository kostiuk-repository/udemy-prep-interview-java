/**
 * SceneManager - Scene State Management with Persistence
 * Lesson Builder System - Modular Architecture
 * 
 * Handles:
 * - Loading and managing scenes
 * - Building accumulated state with DEEP MERGE
 * - Object lifecycle (creation, update, explicit deletion)
 * - Step transitions
 */

import { deepMerge, DEFAULTS } from './StateInterpolator.js';
import { Logger } from './Telemetry.js';

// ==========================================================================
// SCENE MANAGER CLASS
// ==========================================================================

/**
 * SceneManager - Manages scene state with object persistence
 */
export class SceneManager {
    /**
     * Create a SceneManager
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
    }

    // ==========================================================================
    // SCENE LOADING
    // ==========================================================================

    /**
     * Load a scene definition
     * @param {Object} scene - Scene definition with steps array
     */
    loadScene(scene) {
        this.scene = scene;
        this.currentStepIndex = -1;
        Logger.info('SceneManager', 'Scene loaded', {
            sceneId: scene?.id,
            stepsCount: scene?.steps?.length || 0
        });
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
    // STATE BUILDING (DEEP MERGE WITH PERSISTENCE)
    // ==========================================================================

    /**
     * Build accumulated state up to stepIndex with DEEP MERGE.
     * Objects from earlier steps persist unless explicitly deleted (_delete: true).
     * @param {number} stepIndex - Target step index
     * @returns {Map<string, Object>} State map (objectId -> props)
     */
    buildAccumulatedState(stepIndex) {
        const state = new Map();
        const objectDefinitions = new Map();

        for (let i = 0; i <= stepIndex; i++) {
            const step = this.scene.steps[i];
            if (!step?.objects) continue;

            for (const obj of step.objects) {
                const existingDef = objectDefinitions.get(obj.id);

                // Check for explicit deletion
                if (obj.props?._delete === true) {
                    objectDefinitions.delete(obj.id);
                    Logger.debug('SceneManager', 'Object deleted', { objectId: obj.id, stepIndex: i });
                    continue;
                }

                if (existingDef) {
                    // DEEP MERGE props from later step
                    const mergedProps = deepMerge({ ...existingDef.props }, obj.props || {});

                    objectDefinitions.set(obj.id, {
                        ...existingDef,
                        props: mergedProps,
                        // Children: replace if provided, otherwise keep existing
                        children: obj.children !== undefined ? obj.children : existingDef.children
                    });
                } else {
                    // New object
                    objectDefinitions.set(obj.id, {
                        id: obj.id,
                        type: obj.type,
                        props: { ...obj.props },
                        children: obj.children
                    });
                }
            }
        }

        // Convert to state format
        for (const [id, def] of objectDefinitions) {
            const fullProps = this._buildObjectProps(def);
            state.set(id, fullProps);

            // Add children for groups
            if (def.type === 'group' && def.children) {
                this._addChildrenToState(state, id, def.children, fullProps);
            }
        }

        // Debug: log total objects for this accumulated state
        try {
            const dbg = typeof window !== 'undefined' && window.DEBUG_RENDER === true;
            if (dbg) {
                const ids = Array.from(state.keys());
                console.log('[Scene Debug] Accumulated state for step', stepIndex, 'objects:', state.size, 'ids:', ids);
            }
        } catch {}

        return state;
    }

    /**
     * Build state for a single step (no accumulation)
     * @param {Object} step - Step definition
     * @returns {Map<string, Object>}
     */
    buildStateFromStep(step) {
        const state = new Map();
        if (!step?.objects) return state;

        for (const obj of step.objects) {
            const fullProps = this._buildObjectProps(obj);
            state.set(obj.id, fullProps);

            if (obj.type === 'group' && obj.children) {
                this._addChildrenToState(state, obj.id, obj.children, fullProps);
            }
        }

        // Debug: log objects for single step state
        try {
            const dbg = typeof window !== 'undefined' && window.DEBUG_RENDER === true;
            if (dbg) {
                const ids = Array.from(state.keys());
                console.log('[Scene Debug] Single step state objects:', state.size, 'ids:', ids);
            }
        } catch {}

        return state;
    }

    /**
     * Detect changes between two states
     * @param {Map} fromState - Previous state
     * @param {Map} toState - Target state
     * @returns {Object} { added, removed, persisted }
     */
    detectChanges(fromState, toState) {
        const added = [];
        const removed = [];
        const persisted = [];

        // Find new and persisted objects
        for (const [id, props] of toState) {
            if (!fromState.has(id)) {
                added.push({ id, props });
            } else {
                persisted.push({ id, props });
            }
        }

        // Find removed objects
        for (const [id, props] of fromState) {
            if (!toState.has(id)) {
                removed.push({ id, props });
            }
        }

        Logger.stateDiff(this.currentStepIndex.toString(), { added, removed, changed: persisted });

        return { added, removed, persisted };
    }

    // ==========================================================================
    // PRIVATE HELPERS
    // ==========================================================================

    /**
     * Build complete object properties with internal markers
     * @private
     */
    _buildObjectProps(obj) {
        const props = { ...obj.props };
        props._type = obj.type;
        props._id = obj.id;

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

            if (child.type === 'group' && child.children) {
                this._addChildrenToState(state, childId, child.children, childProps);
            }
        }
    }
}

// ==========================================================================
// EXPORTS
// ==========================================================================

export { DEFAULTS };
