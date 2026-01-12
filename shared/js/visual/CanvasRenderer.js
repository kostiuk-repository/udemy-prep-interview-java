/**
 * CanvasRenderer - Render Compositions to Canvas
 * Lesson Builder System
 */

export class CanvasRenderer {
    /**
     * Create a Canvas renderer
     * @param {Composition} composition - The composition to render
     * @param {HTMLCanvasElement} [canvas] - Optional existing canvas
     */
    constructor(composition, canvas) {
        this.composition = composition;

        if (canvas) {
            this.canvas = canvas;
        } else {
            this.canvas = document.createElement('canvas');
            this.canvas.width = composition.width;
            this.canvas.height = composition.height;
        }

        this.ctx = this.canvas.getContext('2d');
    }

    /**
     * Render a specific frame to the canvas
     * @param {number} frameIndex
     * @returns {HTMLCanvasElement}
     */
    renderFrame(frameIndex) {
        const frameState = this.composition.getFrameState(frameIndex);
        const ctx = this.ctx;

        // Clear canvas
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw background
        if (frameState.background) {
            ctx.fillStyle = frameState.background;
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

        // Render each layer
        frameState.layers.forEach(layer => {
            this.renderLayer(layer);
        });

        return this.canvas;
    }

    /**
     * Render a single layer to the canvas
     * @param {Object} layerState - Layer state at current frame
     */
    renderLayer(layerState) {
        const ctx = this.ctx;
        ctx.save();

        // Apply common properties
        if (layerState.opacity !== undefined) {
            ctx.globalAlpha = layerState.opacity;
        }

        if (layerState.transform) {
            this._applyTransform(layerState.transform);
        }

        // Set styles
        if (layerState.fill) {
            ctx.fillStyle = layerState.fill;
        }
        if (layerState.stroke) {
            ctx.strokeStyle = layerState.stroke;
        }
        if (layerState.strokeWidth) {
            ctx.lineWidth = layerState.strokeWidth;
        }

        // Render based on type
        switch (layerState.type) {
            case 'rect':
                this._renderRect(layerState);
                break;

            case 'circle':
                this._renderCircle(layerState);
                break;

            case 'ellipse':
                this._renderEllipse(layerState);
                break;

            case 'line':
                this._renderLine(layerState);
                break;

            case 'path':
                this._renderPath(layerState);
                break;

            case 'text':
                this._renderText(layerState);
                break;

            case 'image':
                this._renderImage(layerState);
                break;

            case 'polygon':
            case 'polyline':
                this._renderPolygon(layerState);
                break;
        }

        ctx.restore();
    }

    /**
     * Render rectangle
     * @private
     */
    _renderRect(state) {
        const ctx = this.ctx;
        const x = state.x || 0;
        const y = state.y || 0;
        const width = state.width || 100;
        const height = state.height || 100;
        const rx = state.rx || 0;
        const ry = state.ry || rx;

        if (rx > 0 || ry > 0) {
            // Rounded rectangle
            this._roundedRect(x, y, width, height, rx, ry);
            if (state.fill) ctx.fill();
            if (state.stroke) ctx.stroke();
        } else {
            if (state.fill) ctx.fillRect(x, y, width, height);
            if (state.stroke) ctx.strokeRect(x, y, width, height);
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
    _renderCircle(state) {
        const ctx = this.ctx;
        const cx = state.cx !== undefined ? state.cx : (state.x || 0);
        const cy = state.cy !== undefined ? state.cy : (state.y || 0);
        const r = state.r || state.radius || 50;

        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);

        if (state.fill) ctx.fill();
        if (state.stroke) ctx.stroke();
    }

    /**
     * Render ellipse
     * @private
     */
    _renderEllipse(state) {
        const ctx = this.ctx;
        const cx = state.cx !== undefined ? state.cx : (state.x || 0);
        const cy = state.cy !== undefined ? state.cy : (state.y || 0);
        const rx = state.rx || 50;
        const ry = state.ry || 30;

        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);

        if (state.fill) ctx.fill();
        if (state.stroke) ctx.stroke();
    }

    /**
     * Render line
     * @private
     */
    _renderLine(state) {
        const ctx = this.ctx;

        ctx.beginPath();
        ctx.moveTo(state.x1 || 0, state.y1 || 0);
        ctx.lineTo(state.x2 || 100, state.y2 || 100);
        ctx.stroke();
    }

    /**
     * Render SVG path
     * @private
     */
    _renderPath(state) {
        const ctx = this.ctx;

        if (state.d) {
            const path = new Path2D(state.d);
            if (state.fill) ctx.fill(path);
            if (state.stroke) ctx.stroke(path);
        }
    }

    /**
     * Render text
     * @private
     */
    _renderText(state) {
        const ctx = this.ctx;

        // Build font string
        const fontSize = state.fontSize || 16;
        const fontFamily = state.fontFamily || 'sans-serif';
        const fontWeight = state.fontWeight || 'normal';
        ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;

        // Text alignment
        if (state.textAnchor) {
            const alignMap = { start: 'left', middle: 'center', end: 'right' };
            ctx.textAlign = alignMap[state.textAnchor] || 'left';
        }

        if (state.dominantBaseline) {
            const baselineMap = {
                'auto': 'alphabetic',
                'middle': 'middle',
                'hanging': 'hanging',
                'central': 'middle'
            };
            ctx.textBaseline = baselineMap[state.dominantBaseline] || 'alphabetic';
        }

        const x = state.x || 0;
        const y = state.y || 0;
        const text = state.text || '';

        if (state.fill) ctx.fillText(text, x, y);
        if (state.stroke) ctx.strokeText(text, x, y);
    }

    /**
     * Render image
     * @private
     */
    _renderImage(state) {
        const ctx = this.ctx;

        if (state._loadedImage) {
            ctx.drawImage(
                state._loadedImage,
                state.x || 0,
                state.y || 0,
                state.width || state._loadedImage.width,
                state.height || state._loadedImage.height
            );
        }
    }

    /**
     * Render polygon/polyline
     * @private
     */
    _renderPolygon(state) {
        const ctx = this.ctx;

        if (!state.points) return;

        // Parse points string "x1,y1 x2,y2 ..."
        const pointsArray = state.points.trim().split(/\s+/).map(p => {
            const [x, y] = p.split(',').map(Number);
            return { x, y };
        });

        if (pointsArray.length < 2) return;

        ctx.beginPath();
        ctx.moveTo(pointsArray[0].x, pointsArray[0].y);

        for (let i = 1; i < pointsArray.length; i++) {
            ctx.lineTo(pointsArray[i].x, pointsArray[i].y);
        }

        if (state.type === 'polygon') {
            ctx.closePath();
        }

        if (state.fill && state.type === 'polygon') ctx.fill();
        if (state.stroke) ctx.stroke();
    }

    /**
     * Apply CSS transform string to canvas context
     * @private
     */
    _applyTransform(transform) {
        const ctx = this.ctx;

        // Parse common transforms
        const translateMatch = transform.match(/translate\(([^,]+),?\s*([^)]*)\)/);
        if (translateMatch) {
            const tx = parseFloat(translateMatch[1]) || 0;
            const ty = parseFloat(translateMatch[2]) || 0;
            ctx.translate(tx, ty);
        }

        const rotateMatch = transform.match(/rotate\(([^)]+)\)/);
        if (rotateMatch) {
            const angle = parseFloat(rotateMatch[1]) || 0;
            ctx.rotate(angle * Math.PI / 180);
        }

        const scaleMatch = transform.match(/scale\(([^,]+),?\s*([^)]*)\)/);
        if (scaleMatch) {
            const sx = parseFloat(scaleMatch[1]) || 1;
            const sy = parseFloat(scaleMatch[2]) || sx;
            ctx.scale(sx, sy);
        }
    }

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
     * @param {number} width
     * @param {number} height
     */
    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
    }

    /**
     * Get the canvas element
     * @returns {HTMLCanvasElement}
     */
    getCanvas() {
        return this.canvas;
    }
}
