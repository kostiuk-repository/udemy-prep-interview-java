/**
 * StageManager - Konva Stage Wrapper
 * Lesson Builder System
 * 
 * Manages Konva.Stage lifecycle:
 * - Creation and initialization
 * - Resolution scaling (preview vs export)
 * - Container management
 * - Layer access
 */

/**
 * StageManager - Wrapper for Konva.Stage
 */
export class StageManager {
    /**
     * Create a StageManager
     * @param {HTMLElement|string} container - Container element or selector
     * @param {number} [baseWidth=3840] - Base width (4K)
     * @param {number} [baseHeight=2400] - Base height (4K 16:10)
     * @param {Object} [options]
     * @param {number} [options.scale=0.5] - Scale factor (0.5 for preview, 1.0 for export)
     */
    constructor(container, baseWidth = 3840, baseHeight = 2400, options = {}) {
        // Get container element
        if (typeof container === 'string') {
            this.container = document.querySelector(container);
        } else {
            this.container = container;
        }
        
        if (!this.container) {
            throw new Error('StageManager: Container not found');
        }
        
        // Store dimensions
        this.baseWidth = baseWidth;
        this.baseHeight = baseHeight;
        this.scale = options.scale ?? 0.5;
        
        // Calculate scaled dimensions
        this.width = Math.round(baseWidth * this.scale);
        this.height = Math.round(baseHeight * this.scale);
        
        // Create Konva stage
        this.stage = new Konva.Stage({
            container: this.container,
            width: this.width,
            height: this.height
        });
        
        // Create main layer
        this.layer = new Konva.Layer();
        this.stage.add(this.layer);
        
        // Object registry (id -> Konva.Node)
        this.objects = new Map();
        
        console.log(`[StageManager] Initialized ${this.width}x${this.height} (scale: ${this.scale})`);
    }
    
    /**
     * Get the main layer
     * @returns {Konva.Layer}
     */
    getLayer() {
        return this.layer;
    }
    
    /**
     * Get the stage
     * @returns {Konva.Stage}
     */
    getStage() {
        return this.stage;
    }
    
    /**
     * Register an object by ID
     * @param {string} id - Object ID
     * @param {Konva.Node} node - Konva node
     */
    registerObject(id, node) {
        this.objects.set(id, node);
        node.setAttr('objectId', id);
    }
    
    /**
     * Get object by ID
     * @param {string} id - Object ID
     * @returns {Konva.Node|null}
     */
    getObject(id) {
        return this.objects.get(id) || null;
    }
    
    /**
     * Clear all objects from layer
     */
    clear() {
        this.layer.destroyChildren();
        this.objects.clear();
    }
    
    /**
     * Set background color
     * @param {string} color - Background color
     */
    setBackground(color) {
        const existing = this.layer.findOne('.background');
        if (existing) {
            existing.fill(color);
        } else {
            const bg = new Konva.Rect({
                x: 0,
                y: 0,
                width: this.width,
                height: this.height,
                fill: color,
                name: 'background',
                listening: false
            });
            this.layer.add(bg);
            bg.moveToBottom();
        }
        this.layer.batchDraw();
    }
    
    /**
     * Convert percentage to pixels
     * @param {number} percent - Percentage (0-100)
     * @param {string} axis - 'x' or 'y'
     * @returns {number} Pixel value
     */
    toPixels(percent, axis) {
        const dimension = axis === 'x' ? this.width : this.height;
        return (percent / 100) * dimension;
    }
    
    /**
     * Convert pixels to percentage
     * @param {number} pixels - Pixel value
     * @param {string} axis - 'x' or 'y'
     * @returns {number} Percentage (0-100)
     */
    toPercent(pixels, axis) {
        const dimension = axis === 'x' ? this.width : this.height;
        return (pixels / dimension) * 100;
    }
    
    /**
     * Render/draw the layer
     */
    draw() {
        this.layer.batchDraw();
    }
    
    /**
     * Export stage as PNG
     * @param {Object} [options]
     * @param {number} [options.scale=1.0] - Export scale
     * @param {string} [options.mimeType='image/png'] - MIME type
     * @returns {Promise<Blob>}
     */
    async toBlob(options = {}) {
        const scale = options.scale ?? 1.0;
        const mimeType = options.mimeType ?? 'image/png';
        
        const dataUrl = this.stage.toDataURL({
            pixelRatio: scale / this.scale,
            mimeType: mimeType
        });
        
        const response = await fetch(dataUrl);
        return response.blob();
    }
    
    /**
     * Export stage as canvas
     * @param {Object} [options]
     * @param {number} [options.scale=1.0] - Export scale
     * @returns {HTMLCanvasElement}
     */
    toCanvas(options = {}) {
        const scale = options.scale ?? 1.0;
        
        return this.stage.toCanvas({
            pixelRatio: scale / this.scale
        });
    }
    
    /**
     * Resize stage
     * @param {number} width - New width
     * @param {number} height - New height
     */
    resize(width, height) {
        this.width = width;
        this.height = height;
        this.stage.width(width);
        this.stage.height(height);
        this.layer.batchDraw();
    }
    
    /**
     * Destroy stage and clean up
     */
    destroy() {
        this.objects.clear();
        this.stage.destroy();
    }
}
