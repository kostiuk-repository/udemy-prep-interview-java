/**
 * Layer - Visual Object Wrapper
 * Lesson Builder System
 * 
 * Handles coordinate conversion (% → px), property interpolation,
 * and world transform calculations for nested groups.
 */

import { lerp } from '../utils/animation.js';
import { DEFAULTS } from './VisualEngine.js';

/**
 * Layer class - Wrapper for visual objects with coordinate conversion
 */
export class Layer {
    /**
     * Create a Layer instance
     * @param {Object} data - Object data { id, type, props, children }
     * @param {number} canvasWidth - Canvas width in pixels
     * @param {number} canvasHeight - Canvas height in pixels
     */
    constructor(data, canvasWidth = 3840, canvasHeight = 2400) {
        this.id = data.id;
        this.type = data.type;
        this.props = { ...data.props };
        this.children = data.children || [];

        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;

        // Parent reference for nested groups
        this.parent = null;
    }

    // ==========================================================================
    // COORDINATE CONVERSION
    // ==========================================================================

    /**
     * Get absolute X position in pixels
     * @returns {number}
     */
    getAbsoluteX() {
        const x = this.props.x ?? 0;
        return (x / 100) * this.canvasWidth;
    }

    /**
     * Get absolute Y position in pixels
     * @returns {number}
     */
    getAbsoluteY() {
        const y = this.props.y ?? 0;
        return (y / 100) * this.canvasHeight;
    }

    /**
     * Get absolute width in pixels
     * @param {boolean} [isPercentage=true] - Whether width is in percentage
     * @returns {number}
     */
    getAbsoluteWidth(isPercentage = true) {
        const width = this.props.width ?? 100;
        return isPercentage ? (width / 100) * this.canvasWidth : width;
    }

    /**
     * Get absolute height in pixels
     * @param {boolean} [isPercentage=true] - Whether height is in percentage
     * @returns {number}
     */
    getAbsoluteHeight(isPercentage = true) {
        const height = this.props.height ?? 100;
        return isPercentage ? (height / 100) * this.canvasHeight : height;
    }

    /**
     * Convert percentage coordinates to absolute pixels
     * @returns {Object} All props with converted coordinates
     */
    getAbsoluteProps() {
        const abs = { ...this.props };

        // Convert position
        if (abs.x !== undefined) {
            abs.x = this.getAbsoluteX();
        }
        if (abs.y !== undefined) {
            abs.y = this.getAbsoluteY();
        }

        // Convert dimensions (if they're percentages, not absolute values)
        // Use a threshold to determine if value is percentage (< 200) or pixels
        if (abs.width !== undefined && abs.width <= 100) {
            abs.width = this.getAbsoluteWidth(true);
        }
        if (abs.height !== undefined && abs.height <= 100) {
            abs.height = this.getAbsoluteHeight(true);
        }

        // Apply z-depth scaling
        const z = abs.z ?? 0;
        const depthScale = 1 + z * 0.01;
        abs._depthScale = depthScale;

        return abs;
    }

    // ==========================================================================
    // WORLD COORDINATES
    // ==========================================================================

    /**
     * Get world transform (accounting for all parent transforms)
     * @returns {Object} { x, y, scale, rotation }
     */
    getWorldTransform() {
        let worldX = this.getAbsoluteX();
        let worldY = this.getAbsoluteY();
        let worldScale = this.props.scale ?? 1;
        let worldRotation = this.props.rotation ?? 0;

        // Apply z-depth
        const z = this.props.z ?? 0;
        worldScale *= (1 + z * 0.01);

        // Walk up parent chain
        let current = this.parent;
        while (current) {
            const parentProps = current.props;
            const parentX = current.getAbsoluteX();
            const parentY = current.getAbsoluteY();
            const parentScale = parentProps.scale ?? 1;
            const parentRotation = parentProps.rotation ?? 0;
            const parentZ = parentProps.z ?? 0;
            const parentDepthScale = 1 + parentZ * 0.01;

            // Apply parent rotation to our position
            const rad = parentRotation * Math.PI / 180;
            const cos = Math.cos(rad);
            const sin = Math.sin(rad);

            const localX = worldX - parentX;
            const localY = worldY - parentY;

            worldX = parentX + (localX * cos - localY * sin) * parentScale * parentDepthScale;
            worldY = parentY + (localX * sin + localY * cos) * parentScale * parentDepthScale;
            worldScale *= parentScale * parentDepthScale;
            worldRotation += parentRotation;

            current = current.parent;
        }

        return {
            x: worldX,
            y: worldY,
            scale: worldScale,
            rotation: worldRotation
        };
    }

    /**
     * Get anchor position in world coordinates
     * @param {string} anchor - 'top' | 'bottom' | 'left' | 'right' | 'center'
     * @returns {Object} { x, y }
     */
    getAnchorPosition(anchor = 'center') {
        const world = this.getWorldTransform();
        const width = this.getAbsoluteWidth() * world.scale;
        const height = this.getAbsoluteHeight() * world.scale;

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
        }

        // Rotate offset by world rotation
        const rad = world.rotation * Math.PI / 180;
        const rotatedX = offsetX * Math.cos(rad) - offsetY * Math.sin(rad);
        const rotatedY = offsetX * Math.sin(rad) + offsetY * Math.cos(rad);

        return {
            x: world.x + rotatedX,
            y: world.y + rotatedY
        };
    }

    // ==========================================================================
    // INTERPOLATION
    // ==========================================================================

    /**
     * Create interpolated Layer between this and target
     * @param {Layer} target - Target layer to interpolate towards
     * @param {number} progress - Interpolation progress (0-1)
     * @returns {Layer} New interpolated Layer
     */
    interpolate(target, progress) {
        const interpolatedProps = this._interpolateProps(this.props, target.props, progress);

        return new Layer({
            id: this.id,
            type: this.type,
            props: interpolatedProps,
            children: this.children
        }, this.canvasWidth, this.canvasHeight);
    }

    /**
     * Interpolate properties
     * @private
     */
    _interpolateProps(from, to, t) {
        const result = {};
        const allKeys = new Set([...Object.keys(from), ...Object.keys(to)]);

        for (const key of allKeys) {
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
            } else if (typeof fromVal === 'object' && typeof toVal === 'object' &&
                fromVal !== null && toVal !== null) {
                result[key] = this._interpolateProps(fromVal, toVal, t);
            } else if (typeof fromVal === 'string' && typeof toVal === 'string') {
                if (this._isColor(fromVal) && this._isColor(toVal)) {
                    result[key] = this._interpolateColor(fromVal, toVal, t);
                } else {
                    result[key] = t > 0.5 ? toVal : fromVal;
                }
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
            /^rgba?\(/.test(str);
    }

    /**
     * Interpolate colors
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
     * Parse color to RGBA
     * @private
     */
    _parseColor(color) {
        if (color.startsWith('#')) {
            let hex = color.slice(1);
            if (hex.length === 3) {
                hex = hex.split('').map(c => c + c).join('');
            }
            if (hex.length === 6) hex += 'ff';
            return {
                r: parseInt(hex.slice(0, 2), 16),
                g: parseInt(hex.slice(2, 4), 16),
                b: parseInt(hex.slice(4, 6), 16),
                a: parseInt(hex.slice(6, 8), 16) / 255
            };
        }

        const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?\)/);
        if (match) {
            return {
                r: parseInt(match[1]),
                g: parseInt(match[2]),
                b: parseInt(match[3]),
                a: match[4] ? parseFloat(match[4]) : 1
            };
        }

        return { r: 0, g: 0, b: 0, a: 1 };
    }

    // ==========================================================================
    // UTILITIES
    // ==========================================================================

    /**
     * Clone this layer
     * @returns {Layer}
     */
    clone() {
        const cloned = new Layer({
            id: this.id,
            type: this.type,
            props: JSON.parse(JSON.stringify(this.props)),
            children: this.children.map(c => ({ ...c }))
        }, this.canvasWidth, this.canvasHeight);

        cloned.parent = this.parent;
        return cloned;
    }

    /**
     * Merge properties from another object
     * @param {Object} props - Properties to merge
     * @returns {Layer} this (for chaining)
     */
    merge(props) {
        this.props = { ...this.props, ...props };
        return this;
    }

    /**
     * Set parent layer (for groups)
     * @param {Layer} parent
     * @returns {Layer} this
     */
    setParent(parent) {
        this.parent = parent;
        return this;
    }

    /**
     * Convert to plain object
     * @returns {Object}
     */
    toObject() {
        return {
            id: this.id,
            type: this.type,
            props: { ...this.props },
            children: this.children
        };
    }
}

/**
 * Create a Layer from object data
 * @param {Object} data
 * @param {number} [canvasWidth]
 * @param {number} [canvasHeight]
 * @returns {Layer}
 */
export function createLayer(data, canvasWidth, canvasHeight) {
    return new Layer(data, canvasWidth, canvasHeight);
}

/**
 * Build layer hierarchy from step objects
 * @param {Array} objects - Array of object definitions
 * @param {number} canvasWidth
 * @param {number} canvasHeight
 * @returns {Array<Layer>}
 */
export function buildLayerHierarchy(objects, canvasWidth, canvasHeight) {
    const layers = [];

    function processObject(obj, parent = null) {
        const layer = new Layer(obj, canvasWidth, canvasHeight);
        layer.parent = parent;
        layers.push(layer);

        if (obj.type === 'group' && obj.children) {
            for (const child of obj.children) {
                processObject({ ...child, id: child.id || `${obj.id}_child_${obj.children.indexOf(child)}` }, layer);
            }
        }

        return layer;
    }

    for (const obj of objects) {
        processObject(obj);
    }

    return layers;
}
