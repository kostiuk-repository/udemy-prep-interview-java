/**
 * CanvasRenderer - Enhanced Canvas Renderer
 * Lesson Builder System
 * 
 * Features:
 * - Resolution scaling (0.5x preview, 1.0x export)
 * - Z-index sorting and pseudo-3D depth
 * - Shadow support
 * - Group rendering with transform inheritance
 * - Connection arrows with world coordinates
 * - Path2D SVG paths
 */

/**
 * CanvasRenderer - Render objects to Canvas with advanced features
 */
export class CanvasRenderer {
    /**
     * Create a Canvas renderer
     * @param {HTMLCanvasElement|OffscreenCanvas} canvas - Canvas element
     * @param {Object} [options]
     * @param {number} [options.scale=1.0] - Resolution scale (0.5 for preview, 1.0 for export)
     * @param {boolean} [options.depthOfField=false] - Enable depth-of-field effect
     */
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        this.scale = options.scale ?? 1.0;
        this.depthOfField = options.depthOfField ?? false;

        // Font scaling for 4K resolution (web fonts are too small)
        // 2.5x scale makes 16px web font appear as 40px on 4K
        this.fontScale = options.fontScale ?? 2.5;

        // Base resolution (4K 16:10)
        this.baseWidth = 3840;
        this.baseHeight = 2400;

        // Actual canvas dimensions
        this.width = Math.round(this.baseWidth * this.scale);
        this.height = Math.round(this.baseHeight * this.scale);

        // Set canvas size
        canvas.width = this.width;
        canvas.height = this.height;

        // Cache for Path2D objects
        this.pathCache = new Map();

        // Object lookup for connection arrows
        this.objectMap = new Map();

        // Engine reference for world coordinates
        this.engine = null;
    }

    /**
     * Set engine reference for world coordinate calculations
     * @param {StateBasedEngine} engine
     */
    setEngine(engine) {
        this.engine = engine;
    }

    /**
     * Clear the canvas
     * @param {string} [background] - Optional background color
     */
    clear(background) {
        this.ctx.clearRect(0, 0, this.width, this.height);

        if (background) {
            this.ctx.fillStyle = background;
            this.ctx.fillRect(0, 0, this.width, this.height);
        }
    }

    /**
     * Render array of objects to canvas
     * @param {Array<Object>} objects - Objects from engine.getCurrentState()
     * @param {Object} [options]
     * @param {string} [options.background] - Background color
     */
    render(objects, options = {}) {
        // Clear canvas
        this.clear(options.background);

        // Build object map for connection arrows
        this.objectMap.clear();
        this._buildObjectMap(objects);

        // Sort by zIndex
        const sorted = [...objects].sort((a, b) => {
            const aZ = a.props?.zIndex ?? 0;
            const bZ = b.props?.zIndex ?? 0;
            return aZ - bZ;
        });

        // Render each object
        for (const obj of sorted) {
            this.renderObject(obj);
        }
    }

    /**
     * Build map of object ID to object for lookups
     * @private
     */
    _buildObjectMap(objects) {
        for (const obj of objects) {
            this.objectMap.set(obj.id, obj);
            if (obj.children) {
                this._buildObjectMapRecursive(obj.id, obj.children);
            }
        }
    }

    /**
     * Recursively build object map
     * @private
     */
    _buildObjectMapRecursive(parentId, children) {
        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            const childId = child.id || `${parentId}_child_${i}`;
            this.objectMap.set(childId, { ...child, id: childId, _parentId: parentId });

            if (child.children) {
                this._buildObjectMapRecursive(childId, child.children);
            }
        }
    }

    /**
     * Render a single object
     * @param {Object} obj - Object with { id, type, props, children }
     * @param {Object} [parentTransform] - Parent transform for groups
     */
    renderObject(obj, parentTransform = null) {
        const ctx = this.ctx;
        const props = obj.props || {};

        ctx.save();

        // Calculate position in pixels (convert from %)
        let x = (props.x ?? 0) * this.width / 100;
        let y = (props.y ?? 0) * this.height / 100;

        // Apply parent transform if nested
        if (parentTransform) {
            const cos = Math.cos(parentTransform.rotation * Math.PI / 180);
            const sin = Math.sin(parentTransform.rotation * Math.PI / 180);

            const localX = x;
            const localY = y;

            x = parentTransform.x + (localX * cos - localY * sin) * parentTransform.scale;
            y = parentTransform.y + (localX * sin + localY * cos) * parentTransform.scale;
        }

        // Z-depth scaling
        const z = props.z ?? 0;
        const depthScale = 1 + z * 0.01;
        const totalScale = (props.scale ?? 1) * depthScale * (parentTransform?.scale ?? 1);

        // Apply transforms
        ctx.translate(x, y);
        ctx.rotate((props.rotation ?? 0) * Math.PI / 180);
        ctx.scale(totalScale, totalScale);

        // Apply opacity
        ctx.globalAlpha = (props.opacity ?? 1) * (parentTransform?.opacity ?? 1);

        // Apply depth-of-field for background objects
        if (this.depthOfField && z < 0) {
            ctx.globalAlpha *= Math.max(0.6, 1 + z * 0.005);
            // Note: filter blur would require additional canvas compositing
        }

        // Apply shadow
        if (props.shadow) {
            this._applyShadow(props.shadow);
        }

        // Set fill and stroke
        if (props.fill) ctx.fillStyle = props.fill;
        if (props.stroke) ctx.strokeStyle = props.stroke;
        if (props.strokeWidth) ctx.lineWidth = props.strokeWidth / totalScale;

        // Render based on type
        // Debug absolute coordinates if enabled
        try {
            const debugEnabled = typeof window !== 'undefined' && window.DEBUG_RENDER === true;
            if (debugEnabled) {
                let baseW = 0, baseH = 0;
                switch (obj.type) {
                    case 'rect':
                    case 'image':
                        baseW = this._toPixels(props.width ?? 10, 'width');
                        baseH = this._toPixels(props.height ?? 10, 'height');
                        break;
                    case 'circle': {
                        const r = this._toPixels(props.radius ?? props.r ?? 5, 'width');
                        baseW = r * 2; baseH = r * 2;
                        break;
                    }
                    case 'ellipse': {
                        const rx = this._toPixels(props.rx ?? 5, 'width');
                        const ry = this._toPixels(props.ry ?? 3, 'height');
                        baseW = rx * 2; baseH = ry * 2;
                        break;
                    }
                    case 'line': {
                        const x1 = this._toPixels(props.x1 ?? 0, 'width');
                        const y1 = this._toPixels(props.y1 ?? 0, 'height');
                        const x2 = this._toPixels(props.x2 ?? 10, 'width');
                        const y2 = this._toPixels(props.y2 ?? 10, 'height');
                        baseW = Math.abs(x2 - x1);
                        baseH = Math.abs(y2 - y1);
                        break;
                    }
                    case 'text': {
                        const baseFontSize = props.fontSize ?? 16;
                        const fontSize = baseFontSize * this.scale * this.fontScale;
                        const fontFamily = props.fontFamily || 'Inter, sans-serif';
                        const fontWeight = props.fontWeight || 'normal';
                        const prevFont = ctx.font;
                        ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
                        const text = props.text || '';
                        baseW = ctx.measureText(text).width;
                        baseH = fontSize; // approximate line height
                        ctx.font = prevFont;
                        break;
                    }
                    case 'polygon':
                    case 'polyline':
                    default:
                        baseW = this._toPixels(props.width ?? 0, 'width');
                        baseH = this._toPixels(props.height ?? 0, 'height');
                        break;
                }

                const finalW = baseW * totalScale;
                const finalH = baseH * totalScale;
                console.log(
                    '[Render Debug] ID:', obj.id,
                    'Type:', obj.type,
                    'X:', Number(x.toFixed(2)),
                    'Y:', Number(y.toFixed(2)),
                    'W:', Number(finalW.toFixed(2)),
                    'H:', Number(finalH.toFixed(2)),
                    'Scale:', Number(totalScale.toFixed(3))
                );
            }
        } catch (e) {
            console.warn('CanvasRenderer debug logging failed:', e);
        }

        switch (obj.type) {
            case 'rect':
                this._renderRect(props);
                break;
            case 'circle':
                this._renderCircle(props);
                break;
            case 'ellipse':
                this._renderEllipse(props);
                break;
            case 'text':
                this._renderText(props);
                break;
            case 'line':
                this._renderLine(props);
                break;
            case 'path':
                this._renderPath(props);
                break;
            case 'image':
                this._renderImage(props);
                break;
            case 'polygon':
            case 'polyline':
                this._renderPolygon(props, obj.type);
                break;
            case 'group':
                this._renderGroup(obj, { x, y, scale: totalScale, rotation: props.rotation ?? 0, opacity: ctx.globalAlpha });
                break;
            case 'connectionArrow':
                this._renderConnectionArrow(props);
                break;
        }

        ctx.restore();
    }

    /**
     * Apply shadow settings
     * @private
     */
    _applyShadow(shadow) {
        const ctx = this.ctx;
        ctx.shadowColor = shadow.color || 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = (shadow.blur ?? 10) * this.scale;
        ctx.shadowOffsetX = (shadow.offset?.x ?? 0) * this.scale;
        ctx.shadowOffsetY = (shadow.offset?.y ?? 0) * this.scale;
    }

    /**
     * Render rectangle
     * @private
     */
    _renderRect(props) {
        const ctx = this.ctx;
        const width = this._toPixels(props.width ?? 10, 'width');
        const height = this._toPixels(props.height ?? 10, 'height');
        const rx = props.rx ?? 0;
        const ry = props.ry ?? rx;

        // Draw centered on position
        const x = -width / 2;
        const y = -height / 2;

        if (rx > 0 || ry > 0) {
            this._roundedRect(x, y, width, height, rx, ry);
            if (props.fill) ctx.fill();
            if (props.stroke) ctx.stroke();
        } else {
            if (props.fill) ctx.fillRect(x, y, width, height);
            if (props.stroke) ctx.strokeRect(x, y, width, height);
        }
    }

    /**
     * Draw rounded rectangle path
     * @private
     */
    _roundedRect(x, y, width, height, rx, ry) {
        const ctx = this.ctx;
        ctx.beginPath();
        ctx.moveTo(x + rx, y);
        ctx.lineTo(x + width - rx, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + ry);
        ctx.lineTo(x + width, y + height - ry);
        ctx.quadraticCurveTo(x + width, y + height, x + width - rx, y + height);
        ctx.lineTo(x + rx, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - ry);
        ctx.lineTo(x, y + ry);
        ctx.quadraticCurveTo(x, y, x + rx, y);
        ctx.closePath();
    }

    /**
     * Render circle
     * @private
     */
    _renderCircle(props) {
        const ctx = this.ctx;
        const r = this._toPixels(props.radius ?? props.r ?? 5, 'width');

        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);

        if (props.fill) ctx.fill();
        if (props.stroke) ctx.stroke();
    }

    /**
     * Render ellipse
     * @private
     */
    _renderEllipse(props) {
        const ctx = this.ctx;
        const rx = this._toPixels(props.rx ?? 5, 'width');
        const ry = this._toPixels(props.ry ?? 3, 'height');

        ctx.beginPath();
        ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);

        if (props.fill) ctx.fill();
        if (props.stroke) ctx.stroke();
    }

    /**
     * Render text
     * @private
     */
    _renderText(props) {
        const ctx = this.ctx;

        // Scale font size with both resolution scale and font scale multiplier
        // fontScale (2.5x) makes web-sized fonts visible on 4K canvas
        const baseFontSize = props.fontSize ?? 16;
        const fontSize = baseFontSize * this.scale * this.fontScale;
        const fontFamily = props.fontFamily || 'Inter, sans-serif';
        const fontWeight = props.fontWeight || 'normal';

        ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
        ctx.textAlign = props.align || 'center';
        ctx.textBaseline = props.baseline || 'middle';

        const text = props.text || '';

        if (props.fill) {
            ctx.fillStyle = props.fill;
            ctx.fillText(text, 0, 0);
        }
        if (props.stroke) {
            ctx.strokeStyle = props.stroke;
            ctx.strokeText(text, 0, 0);
        }
    }

    /**
     * Render line
     * @private
     */
    _renderLine(props) {
        const ctx = this.ctx;

        const x1 = this._toPixels(props.x1 ?? 0, 'width');
        const y1 = this._toPixels(props.y1 ?? 0, 'height');
        const x2 = this._toPixels(props.x2 ?? 10, 'width');
        const y2 = this._toPixels(props.y2 ?? 10, 'height');

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }

    /**
     * Render SVG path using Path2D
     * @private
     */
    _renderPath(props) {
        const ctx = this.ctx;
        const d = props.d;

        if (!d) return;

        // Use cached Path2D or create new one
        let path = this.pathCache.get(d);
        if (!path) {
            path = new Path2D(d);
            this.pathCache.set(d, path);
        }

        if (props.fill) ctx.fill(path);
        if (props.stroke) ctx.stroke(path);
    }

    /**
     * Render image
     * @private
     */
    _renderImage(props) {
        const ctx = this.ctx;
        const img = props._loadedImage;

        if (!img) return;

        const width = this._toPixels(props.width ?? 10, 'width');
        const height = this._toPixels(props.height ?? 10, 'height');

        ctx.drawImage(img, -width / 2, -height / 2, width, height);
    }

    /**
     * Render polygon/polyline
     * @private
     */
    _renderPolygon(props, type) {
        const ctx = this.ctx;
        const points = props.points;

        if (!points || !Array.isArray(points) || points.length < 2) return;

        ctx.beginPath();
        ctx.moveTo(
            this._toPixels(points[0].x, 'width'),
            this._toPixels(points[0].y, 'height')
        );

        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(
                this._toPixels(points[i].x, 'width'),
                this._toPixels(points[i].y, 'height')
            );
        }

        if (type === 'polygon') {
            ctx.closePath();
            if (props.fill) ctx.fill();
        }
        if (props.stroke) ctx.stroke();
    }

    /**
     * Render group with children
     * @private
     */
    _renderGroup(group, transform) {
        if (!group.children) return;

        for (let i = 0; i < group.children.length; i++) {
            const child = group.children[i];
            const childObj = {
                id: child.id || `${group.id}_child_${i}`,
                type: child.type,
                props: child.props,
                children: child.children
            };

            this.renderObject(childObj, transform);
        }
    }

    /**
     * Render connection arrow between two objects
     * @private
     */
    _renderConnectionArrow(props) {
        const ctx = this.ctx;

        // Get start and end positions using world coordinates
        const startPos = this._getConnectionPoint(props.startTarget, props.startAnchor || 'right');
        const endPos = this._getConnectionPoint(props.endTarget, props.endAnchor || 'left');

        if (!startPos || !endPos) {
            console.warn('CanvasRenderer: Connection arrow targets not found');
            return;
        }

        // Reset transform since we're using absolute positions
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        const curve = props.curve ?? 0;
        const arrowSize = (props.arrowSize ?? 10) * this.scale;

        ctx.strokeStyle = props.stroke || '#2196F3';
        ctx.lineWidth = (props.strokeWidth ?? 2) * this.scale;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        ctx.moveTo(startPos.x, startPos.y);

        if (curve > 0) {
            // Bezier curve
            const midX = (startPos.x + endPos.x) / 2;
            const midY = (startPos.y + endPos.y) / 2;
            const dx = endPos.x - startPos.x;
            const dy = endPos.y - startPos.y;

            // Perpendicular offset for curve
            const offsetX = -dy * curve;
            const offsetY = dx * curve;

            const cp1x = midX + offsetX;
            const cp1y = midY + offsetY;

            ctx.quadraticCurveTo(cp1x, cp1y, endPos.x, endPos.y);
        } else {
            ctx.lineTo(endPos.x, endPos.y);
        }

        ctx.stroke();

        // Draw arrow head
        const angle = Math.atan2(endPos.y - startPos.y, endPos.x - startPos.x);

        ctx.beginPath();
        ctx.moveTo(endPos.x, endPos.y);
        ctx.lineTo(
            endPos.x - arrowSize * Math.cos(angle - Math.PI / 6),
            endPos.y - arrowSize * Math.sin(angle - Math.PI / 6)
        );
        ctx.moveTo(endPos.x, endPos.y);
        ctx.lineTo(
            endPos.x - arrowSize * Math.cos(angle + Math.PI / 6),
            endPos.y - arrowSize * Math.sin(angle + Math.PI / 6)
        );
        ctx.stroke();
    }

    /**
     * Get connection point for an object using world coordinates
     * @private
     */
    _getConnectionPoint(targetId, anchor) {
        // Try to use engine for world coordinates
        if (this.engine) {
            return this.engine.getAnchorPosition(targetId, anchor);
        }

        // Fallback: use simple object lookup
        const obj = this.objectMap.get(targetId);
        if (!obj) return null;

        const props = obj.props || {};
        const x = (props.x ?? 50) * this.width / 100;
        const y = (props.y ?? 50) * this.height / 100;
        const width = this._toPixels(props.width ?? 10, 'width');
        const height = this._toPixels(props.height ?? 10, 'height');

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

        return { x: x + offsetX, y: y + offsetY };
    }

    /**
     * Convert percentage or absolute value to pixels
     * @private
     */
    _toPixels(value, dimension) {
        if (value === undefined) return 0;

        // If value is small (likely percentage), convert
        if (value <= 100) {
            return dimension === 'width'
                ? (value / 100) * this.width
                : (value / 100) * this.height;
        }

        // Otherwise treat as absolute pixels, scale for resolution
        return value * this.scale;
    }

    // ==========================================================================
    // EXPORT UTILITIES
    // ==========================================================================

    /**
     * Get canvas as PNG blob
     * @returns {Promise<Blob>}
     */
    toPNG() {
        return new Promise((resolve) => {
            this.canvas.toBlob(resolve, 'image/png');
        });
    }

    /**
     * Get canvas as data URL
     * @param {string} [type='image/png']
     * @returns {string}
     */
    toDataURL(type = 'image/png') {
        return this.canvas.toDataURL(type);
    }

    /**
     * Resize the canvas
     * @param {number} scale - New scale factor
     */
    setScale(scale) {
        this.scale = scale;
        this.width = Math.round(this.baseWidth * scale);
        this.height = Math.round(this.baseHeight * scale);
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }

    /**
     * Get the canvas element
     * @returns {HTMLCanvasElement}
     */
    getCanvas() {
        return this.canvas;
    }
}
