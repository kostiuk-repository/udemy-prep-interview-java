/**
 * VisualEngine - Core Animation System
 * Lesson Builder System
 * 
 * Remotion-like frame-based animation engine for creating
 * data-driven visual compositions.
 */

import { lerp, easeInOutCubic, easeOutQuad, easeInQuad } from '../utils/animation.js';

/**
 * Composition - Defines a visual scene with layers
 */
export class Composition {
    /**
     * Create a new composition
     * @param {Object} config
     * @param {number} config.width - Canvas width in pixels
     * @param {number} config.height - Canvas height in pixels
     * @param {number} [config.fps=60] - Frames per second
     * @param {number} config.durationInFrames - Total frames
     */
    constructor(config) {
        this.width = config.width || 800;
        this.height = config.height || 600;
        this.fps = config.fps || 60;
        this.durationInFrames = config.durationInFrames || 60;
        this.layers = [];
        this.background = config.background || '#ffffff';
    }

    /**
     * Add a layer to the composition
     * @param {Layer} layer
     * @returns {Composition} this (for chaining)
     */
    addLayer(layer) {
        this.layers.push(layer);
        return this;
    }

    /**
     * Remove a layer by ID
     * @param {string} layerId
     * @returns {boolean} Whether layer was found and removed
     */
    removeLayer(layerId) {
        const index = this.layers.findIndex(l => l.id === layerId);
        if (index > -1) {
            this.layers.splice(index, 1);
            return true;
        }
        return false;
    }

    /**
     * Get a layer by ID
     * @param {string} layerId
     * @returns {Layer|undefined}
     */
    getLayer(layerId) {
        return this.layers.find(l => l.id === layerId);
    }

    /**
     * Get the state of all layers at a specific frame
     * @param {number} frameIndex - Frame number (0-indexed)
     * @returns {Object} Frame state with all layer states
     */
    getFrameState(frameIndex) {
        // Clamp frame index
        const frame = Math.max(0, Math.min(frameIndex, this.durationInFrames - 1));

        return {
            frame,
            width: this.width,
            height: this.height,
            background: this.background,
            layers: this.layers.map(layer => ({
                id: layer.id,
                type: layer.type,
                ...layer.getStateAtFrame(frame)
            }))
        };
    }

    /**
     * Get duration in seconds
     * @returns {number}
     */
    getDuration() {
        return this.durationInFrames / this.fps;
    }

    /**
     * Get frame count for a duration in seconds
     * @param {number} seconds
     * @returns {number}
     */
    secondsToFrames(seconds) {
        return Math.round(seconds * this.fps);
    }

    /**
     * Get time in seconds for a frame
     * @param {number} frame
     * @returns {number}
     */
    frameToSeconds(frame) {
        return frame / this.fps;
    }

    /**
     * Clone this composition
     * @returns {Composition}
     */
    clone() {
        const comp = new Composition({
            width: this.width,
            height: this.height,
            fps: this.fps,
            durationInFrames: this.durationInFrames,
            background: this.background
        });

        this.layers.forEach(layer => {
            comp.addLayer(layer.clone());
        });

        return comp;
    }
}

/**
 * Layer - Individual animated element
 */
export class Layer {
    /**
     * Create a new layer
     * @param {Object} config
     * @param {string} config.id - Unique identifier
     * @param {string} config.type - 'rect' | 'circle' | 'text' | 'path' | 'line' | 'image'
     * @param {Array} [config.keyframes] - Array of {frame, value} pairs
     * @param {Function} [config.easing] - Easing function
     */
    constructor(config) {
        this.id = config.id || `layer-${Date.now()}`;
        this.type = config.type || 'rect';
        this.keyframes = config.keyframes || [];
        this.easing = config.easing || easeInOutCubic;

        // Sort keyframes by frame
        this._sortKeyframes();
    }

    /**
     * Sort keyframes by frame number
     * @private
     */
    _sortKeyframes() {
        this.keyframes.sort((a, b) => a.frame - b.frame);
    }

    /**
     * Add a keyframe
     * @param {number} frame - Frame number
     * @param {Object} value - Property values at this frame
     * @returns {Layer} this (for chaining)
     */
    addKeyframe(frame, value) {
        // Check if keyframe exists at this frame
        const existing = this.keyframes.find(k => k.frame === frame);
        if (existing) {
            existing.value = { ...existing.value, ...value };
        } else {
            this.keyframes.push({ frame, value });
            this._sortKeyframes();
        }
        return this;
    }

    /**
     * Remove a keyframe
     * @param {number} frame
     * @returns {boolean}
     */
    removeKeyframe(frame) {
        const index = this.keyframes.findIndex(k => k.frame === frame);
        if (index > -1) {
            this.keyframes.splice(index, 1);
            return true;
        }
        return false;
    }

    /**
     * Set easing function
     * @param {Function} easingFn
     * @returns {Layer} this
     */
    setEasing(easingFn) {
        this.easing = easingFn;
        return this;
    }

    /**
     * Get the interpolated state at a specific frame
     * @param {number} frameIndex
     * @returns {Object} Interpolated property values
     */
    getStateAtFrame(frameIndex) {
        if (this.keyframes.length === 0) {
            return {};
        }

        if (this.keyframes.length === 1) {
            return { ...this.keyframes[0].value };
        }

        // Find surrounding keyframes
        let prevKeyframe = this.keyframes[0];
        let nextKeyframe = this.keyframes[this.keyframes.length - 1];

        for (let i = 0; i < this.keyframes.length; i++) {
            if (this.keyframes[i].frame <= frameIndex) {
                prevKeyframe = this.keyframes[i];
            }
            if (this.keyframes[i].frame >= frameIndex) {
                nextKeyframe = this.keyframes[i];
                break;
            }
        }

        // If at or before first keyframe
        if (frameIndex <= prevKeyframe.frame) {
            return { ...prevKeyframe.value };
        }

        // If at or after last keyframe
        if (frameIndex >= nextKeyframe.frame) {
            return { ...nextKeyframe.value };
        }

        // Interpolate between keyframes
        const progress = (frameIndex - prevKeyframe.frame) /
            (nextKeyframe.frame - prevKeyframe.frame);
        const easedProgress = this.easing(progress);

        return this._interpolateValues(prevKeyframe.value, nextKeyframe.value, easedProgress);
    }

    /**
     * Interpolate between two value objects
     * @private
     * @param {Object} from
     * @param {Object} to
     * @param {number} t - Progress 0-1
     * @returns {Object}
     */
    _interpolateValues(from, to, t) {
        const result = {};
        const allKeys = new Set([...Object.keys(from), ...Object.keys(to)]);

        allKeys.forEach(key => {
            const fromVal = from[key];
            const toVal = to[key];

            if (fromVal === undefined) {
                result[key] = toVal;
            } else if (toVal === undefined) {
                result[key] = fromVal;
            } else if (typeof fromVal === 'number' && typeof toVal === 'number') {
                // Numeric interpolation
                result[key] = lerp(fromVal, toVal, t);
            } else if (typeof fromVal === 'string' && typeof toVal === 'string') {
                // Color interpolation (if both are hex colors)
                if (this._isHexColor(fromVal) && this._isHexColor(toVal)) {
                    result[key] = this._interpolateColor(fromVal, toVal, t);
                } else {
                    // Non-numeric: use end value at t > 0.5
                    result[key] = t > 0.5 ? toVal : fromVal;
                }
            } else {
                // Default: snap at halfway
                result[key] = t > 0.5 ? toVal : fromVal;
            }
        });

        return result;
    }

    /**
     * Check if string is a hex color
     * @private
     */
    _isHexColor(str) {
        return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(str);
    }

    /**
     * Interpolate between two hex colors
     * @private
     */
    _interpolateColor(from, to, t) {
        const fromRGB = this._hexToRGB(from);
        const toRGB = this._hexToRGB(to);

        const r = Math.round(lerp(fromRGB.r, toRGB.r, t));
        const g = Math.round(lerp(fromRGB.g, toRGB.g, t));
        const b = Math.round(lerp(fromRGB.b, toRGB.b, t));

        return this._rgbToHex(r, g, b);
    }

    /**
     * Convert hex to RGB
     * @private
     */
    _hexToRGB(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (!result) {
            // Handle 3-char hex
            const short = /^#?([a-f\d])([a-f\d])([a-f\d])$/i.exec(hex);
            if (short) {
                return {
                    r: parseInt(short[1] + short[1], 16),
                    g: parseInt(short[2] + short[2], 16),
                    b: parseInt(short[3] + short[3], 16)
                };
            }
            return { r: 0, g: 0, b: 0 };
        }
        return {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        };
    }

    /**
     * Convert RGB to hex
     * @private
     */
    _rgbToHex(r, g, b) {
        return '#' + [r, g, b].map(x => {
            const hex = x.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
    }

    /**
     * Clone this layer
     * @returns {Layer}
     */
    clone() {
        return new Layer({
            id: this.id + '-clone',
            type: this.type,
            keyframes: this.keyframes.map(k => ({
                frame: k.frame,
                value: { ...k.value }
            })),
            easing: this.easing
        });
    }
}

/**
 * Preset compositions for common use cases
 */
export const Presets = {
    /**
     * Create a simple fade-in composition
     */
    fadeIn(config = {}) {
        const comp = new Composition({
            width: config.width || 800,
            height: config.height || 600,
            fps: config.fps || 60,
            durationInFrames: config.frames || 60
        });

        const layer = new Layer({
            id: 'fade-element',
            type: config.type || 'rect',
            keyframes: [
                { frame: 0, value: { ...config.props, opacity: 0 } },
                { frame: config.frames || 60, value: { ...config.props, opacity: 1 } }
            ]
        });

        return comp.addLayer(layer);
    },

    /**
     * Create a slide-in composition
     */
    slideIn(config = {}) {
        const comp = new Composition({
            width: config.width || 800,
            height: config.height || 600,
            fps: config.fps || 60,
            durationInFrames: config.frames || 60
        });

        const startX = config.direction === 'right' ? comp.width + 100 : -100;
        const endX = config.props?.x || comp.width / 2;

        const layer = new Layer({
            id: 'slide-element',
            type: config.type || 'rect',
            keyframes: [
                { frame: 0, value: { ...config.props, x: startX, opacity: 0 } },
                { frame: config.frames || 60, value: { ...config.props, x: endX, opacity: 1 } }
            ]
        });

        return comp.addLayer(layer);
    }
};

// Export easing functions for convenience
export { lerp, easeInOutCubic, easeOutQuad, easeInQuad } from '../utils/animation.js';
