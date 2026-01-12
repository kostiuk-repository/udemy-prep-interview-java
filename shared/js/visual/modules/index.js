/**
 * Visual Modules - Re-exports for convenient importing
 * Lesson Builder System - Modular Architecture
 */

// Core modules
export {
    DEFAULTS,
    interpolateProps,
    isColor,
    interpolateColor,
    parseColor,
    deepMerge,
    lerp,
    getEasing,
    easeInOutCubic
} from './StateInterpolator.js';

export {
    SceneManager
} from './SceneManager.js';

export {
    Logger,
    LogLevel,
    TelemetryLogger
} from './Telemetry.js';

export {
    getWorldTransform,
    getAnchorPosition,
    Position,
    toPixels
} from './TransformUtils.js';
