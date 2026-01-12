/**
 * StateInterpolator - Pure interpolation functions for animation
 * Lesson Builder System - Modular Architecture
 * 
 * Extracted from VisualEngine.js for strict modularity (<300 lines).
 * Contains: lerp, easing, property interpolation, color interpolation.
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
// PROPERTY INTERPOLATION
// ==========================================================================

/**
 * Interpolate between two property objects
 * @param {Object} from - Source properties
 * @param {Object} to - Target properties
 * @param {number} t - Interpolation factor (0-1)
 * @returns {Object} Interpolated properties
 */
export function interpolateProps(from, to, t) {
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
            if (isColor(fromVal) && isColor(toVal)) {
                result[key] = interpolateColor(fromVal, toVal, t);
            } else {
                result[key] = t > 0.5 ? toVal : fromVal;
            }
        } else if (typeof fromVal === 'object' && typeof toVal === 'object') {
            // Recursively interpolate nested objects (like shadow)
            result[key] = interpolateProps(fromVal, toVal, t);
        } else {
            result[key] = t > 0.5 ? toVal : fromVal;
        }
    }

    return result;
}

// ==========================================================================
// COLOR HANDLING
// ==========================================================================

/**
 * Check if string is a color
 * @param {string} str - String to check
 * @returns {boolean}
 */
export function isColor(str) {
    return /^#([0-9A-Fa-f]{3,8})$/.test(str) ||
        /^rgba?\(/.test(str) ||
        /^hsla?\(/.test(str);
}

/**
 * Interpolate between two colors
 * @param {string} from - Source color
 * @param {string} to - Target color
 * @param {number} t - Interpolation factor (0-1)
 * @returns {string} Interpolated color
 */
export function interpolateColor(from, to, t) {
    const fromRGB = parseColor(from);
    const toRGB = parseColor(to);

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
 * @param {string} color - Color string (hex or rgba)
 * @returns {Object} { r, g, b, a }
 */
export function parseColor(color) {
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
// DEEP MERGE UTILITIES
// ==========================================================================

/**
 * Deep merge two objects (for state persistence)
 * Later object properties override earlier ones, but nested objects are merged.
 * @param {Object} target - Target object (mutated)
 * @param {Object} source - Source object
 * @returns {Object} Merged object (same as target)
 */
export function deepMerge(target, source) {
    if (!source) return target;
    if (!target) return { ...source };

    for (const key of Object.keys(source)) {
        const sourceVal = source[key];
        const targetVal = target[key];

        if (
            sourceVal !== null &&
            typeof sourceVal === 'object' &&
            !Array.isArray(sourceVal) &&
            targetVal !== null &&
            typeof targetVal === 'object' &&
            !Array.isArray(targetVal)
        ) {
            // Recursively merge nested objects
            target[key] = deepMerge({ ...targetVal }, sourceVal);
        } else {
            // Override with source value
            target[key] = sourceVal;
        }
    }

    return target;
}

// Re-export animation utilities for convenience
export { lerp, getEasing, easeInOutCubic };
