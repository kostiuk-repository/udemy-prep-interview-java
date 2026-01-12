/**
 * TransformUtils - Coordinate and Transform Utilities
 * Lesson Builder System - Modular Architecture
 * 
 * Handles:
 * - World coordinate calculations
 * - Parent-child transform inheritance
 * - Anchor point calculations
 */

// ==========================================================================
// TRANSFORM CALCULATIONS
// ==========================================================================

/**
 * Calculate world transform for an object (accounting for parent transforms)
 * @param {Map<string, Object>} state - Current state map
 * @param {string} objectId - Object ID
 * @param {number} canvasWidth - Canvas width in pixels
 * @param {number} canvasHeight - Canvas height in pixels
 * @returns {Object|null} World position and transform
 */
export function getWorldTransform(state, objectId, canvasWidth, canvasHeight) {
    const props = state.get(objectId);
    if (!props) return null;

    let worldX = (props.x ?? 0) * canvasWidth / 100;
    let worldY = (props.y ?? 0) * canvasHeight / 100;
    let worldScale = props.scale ?? 1;
    let worldRotation = props.rotation ?? 0;

    // Apply z-depth scaling
    const z = props.z ?? 0;
    worldScale *= (1 + z * 0.01);

    // Apply parent transforms if nested in group
    if (props._parentId) {
        const parentTransform = getWorldTransform(state, props._parentId, canvasWidth, canvasHeight);
        if (parentTransform) {
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
 * @param {Map<string, Object>} state - Current state map
 * @param {string} objectId - Object ID
 * @param {string} anchor - 'top' | 'bottom' | 'left' | 'right' | 'center'
 * @param {number} canvasWidth - Canvas width
 * @param {number} canvasHeight - Canvas height
 * @returns {Object|null} { x, y } in pixels
 */
export function getAnchorPosition(state, objectId, anchor, canvasWidth, canvasHeight) {
    const world = getWorldTransform(state, objectId, canvasWidth, canvasHeight);
    if (!world) return null;

    const props = world.props;
    const width = (props.width ?? 100) * canvasWidth / 100 * world.scale;
    const height = (props.height ?? 100) * canvasHeight / 100 * world.scale;

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
// POSITIONING HELPERS
// ==========================================================================

/**
 * Positioning helper functions (percentages)
 */
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
// PERCENTAGE/PIXEL CONVERSION
// ==========================================================================

/**
 * Convert percentage value to pixels
 * @param {number} value - Value (percentage or absolute)
 * @param {string} dimension - 'width' or 'height'
 * @param {number} canvasWidth - Canvas width
 * @param {number} canvasHeight - Canvas height
 * @param {number} [scale=1] - Resolution scale
 * @returns {number} Pixel value
 */
export function toPixels(value, dimension, canvasWidth, canvasHeight, scale = 1) {
    if (value === undefined) return 0;

    // If value is small (likely percentage), convert
    if (value <= 100) {
        return dimension === 'width'
            ? (value / 100) * canvasWidth
            : (value / 100) * canvasHeight;
    }

    // Otherwise treat as absolute pixels, scale for resolution
    return value * scale;
}
