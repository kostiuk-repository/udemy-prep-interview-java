/**
 * KonvaRenderer - Professional Canvas Renderer using Konva.js
 * Lesson Builder System
 * 
 * Replaces custom CanvasRenderer with industry-standard Konva library.
 * Features:
 * - Automatic coordinate transforms and centering
 * - Built-in group/layer management
 * - Hardware-accelerated rendering
 * - No manual canvas calculations needed
 */

/**
 * KonvaRenderer - Render objects using Konva.js
 */
export class KonvaRenderer {
    /**
     * Create a Konva renderer
     * @param {HTMLCanvasElement|OffscreenCanvas} canvas - Canvas element or OffscreenCanvas
     * @param {Object} [options]
     * @param {number} [options.scale=1.0] - Resolution scale (0.5 for preview, 1.0 for export)
     * @param {number} [options.width=3840] - Base width (4K)
     * @param {number} [options.height=2400] - Base height (4K 16:10)
     */
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.scale = options.scale ?? 1.0;
        
        // Base resolution (4K 16:10)
        this.baseWidth = options.width ?? 3840;
        this.baseHeight = options.height ?? 2400;
        
        // Actual canvas dimensions
        this.width = Math.round(this.baseWidth * this.scale);
        this.height = Math.round(this.baseHeight * this.scale);
        
        // Set canvas size
        canvas.width = this.width;
        canvas.height = this.height;
        
        // Create Konva stage (uses existing canvas)
        this.stage = new Konva.Stage({
            container: canvas.parentElement,
            width: this.width,
            height: this.height
        });
        
        // If we have an existing canvas, replace stage's canvas with it
        if (canvas instanceof HTMLCanvasElement) {
            const stageCanvas = this.stage.getContent().querySelector('canvas');
            if (stageCanvas && stageCanvas !== canvas) {
                // Replace Konva's canvas with our canvas
                stageCanvas.parentNode.replaceChild(canvas, stageCanvas);
                this.stage.setContent(canvas.parentElement);
            }
        }
        
        // Create main layer
        this.layer = new Konva.Layer();
        this.stage.add(this.layer);
        
        // Cache for Konva objects (id -> Konva.Node)
        this.objectCache = new Map();
        
        // Group cache for nested objects
        this.groupCache = new Map();
        
        // Engine reference for state queries
        this.engine = null;
        
        // Font scaling for 4K resolution
        this.fontScale = options.fontScale ?? 2.5;
    }
    
    /**
     * Set engine reference for world coordinate calculations
     * @param {StateBasedEngine} engine
     */
    setEngine(engine) {
        this.engine = engine;
    }
    
    /**
     * Clear the canvas and layer
     * @param {string} [background] - Optional background color
     */
    clear(background) {
        // Clear all objects from layer
        this.layer.destroyChildren();
        this.objectCache.clear();
        this.groupCache.clear();
        
        // Set background if provided
        if (background) {
            const bg = new Konva.Rect({
                x: 0,
                y: 0,
                width: this.width,
                height: this.height,
                fill: background
            });
            this.layer.add(bg);
        }
        
        this.layer.draw();
    }
    
    /**
     * Render array of objects to canvas using Konva
     * @param {Array<Object>} objects - Objects to render
     * @param {string} [background] - Optional background color
     */
    render(objects, background) {
        const shouldLogThisRender = typeof window !== 'undefined' && window.__logNextRender === true;
        
        if (shouldLogThisRender) {
            console.log(`\n[KONVA] Screen bounds: width=${this.width}, height=${this.height}, scale=${this.scale}`);
            console.log(`[KONVA] Objects to render: ${objects.length}`);
            console.log('─'.repeat(80));
            
            // Clear logging flags
            if (typeof window !== 'undefined' && !window.DEBUG) {
                window.__logNextRender = false;
            }
        }
        
        // Clear previous render
        this.clear(background);
        
        // Sort by z-index
        const sorted = [...objects].sort((a, b) => (a.z ?? 0) - (b.z ?? 0));
        
        // Render each object
        for (const obj of sorted) {
            this.renderObject(obj, shouldLogThisRender);
        }
        
        // Draw layer
        this.layer.draw();
        
        if (shouldLogThisRender) {
            console.log('─'.repeat(80));
        }
    }
    
    /**
     * Render a single object
     * @param {Object} obj - Object definition
     * @param {boolean} debug - Whether to log debug info
     */
    renderObject(obj, debug = false) {
        if (!obj.type) return;
        
        // Convert percentage coordinates to pixels
        const x = this.toPixels(obj.x ?? 50, 'x');
        const y = this.toPixels(obj.y ?? 50, 'y');
        
        // Get or create Konva object
        let konvaObj = this.objectCache.get(obj.id);
        
        if (!konvaObj) {
            // Create new Konva object based on type
            konvaObj = this.createKonvaObject(obj);
            if (konvaObj) {
                this.objectCache.set(obj.id, konvaObj);
                this.layer.add(konvaObj);
            }
        } else {
            // Update existing object
            this.updateKonvaObject(konvaObj, obj);
        }
        
        if (debug && konvaObj) {
            const bounds = konvaObj.getClientRect();
            console.log(`✓ ${obj.id} [${obj.type}]`);
            console.log(`   Center: (${Math.round(x)}, ${Math.round(y)}) = ${obj.x ?? 50}%, ${obj.y ?? 50}%`);
            console.log(`   Size: ${Math.round(bounds.width)}×${Math.round(bounds.height)}px`);
            console.log(`   Bounds: [${Math.round(bounds.x)}, ${Math.round(bounds.y)}] to [${Math.round(bounds.x + bounds.width)}, ${Math.round(bounds.y + bounds.height)}]`);
            console.log(`   Z-index: ${obj.z ?? 0}, Opacity: ${obj.opacity ?? 1}`);
        }
    }
    
    /**
     * Create a new Konva object based on type
     * @param {Object} obj - Object definition
     * @returns {Konva.Node|null}
     */
    createKonvaObject(obj) {
        const x = this.toPixels(obj.x ?? 50, 'x');
        const y = this.toPixels(obj.y ?? 50, 'y');
        
        // Common properties
        const commonProps = {
            x: x,
            y: y,
            opacity: obj.opacity ?? 1,
            rotation: obj.rotation ?? 0,
            scaleX: obj.scaleX ?? obj.scale ?? 1,
            scaleY: obj.scaleY ?? obj.scale ?? 1,
            // Konva uses offset for centering (like anchor point)
            offsetX: 0,
            offsetY: 0
        };
        
        // Apply shadow if specified
        if (obj.shadow) {
            commonProps.shadowColor = obj.shadow.color ?? 'rgba(0, 0, 0, 0.3)';
            commonProps.shadowBlur = obj.shadow.blur ?? 10;
            commonProps.shadowOffsetX = obj.shadow.offsetX ?? 0;
            commonProps.shadowOffsetY = obj.shadow.offsetY ?? 5;
        }
        
        switch (obj.type) {
            case 'rect': {
                const width = this.toPixels(obj.width ?? 10, 'x');
                const height = this.toPixels(obj.height ?? 10, 'y');
                
                return new Konva.Rect({
                    ...commonProps,
                    width: width,
                    height: height,
                    offsetX: width / 2,  // Center horizontally
                    offsetY: height / 2, // Center vertically
                    fill: obj.fill ?? obj.color ?? '#ffffff',
                    stroke: obj.stroke ?? obj.borderColor,
                    strokeWidth: obj.strokeWidth ?? obj.borderWidth ?? 0,
                    cornerRadius: obj.cornerRadius ?? obj.borderRadius ?? 0
                });
            }
            
            case 'circle': {
                const radius = this.toPixels(obj.radius ?? 5, 'x');
                
                return new Konva.Circle({
                    ...commonProps,
                    radius: radius,
                    fill: obj.fill ?? obj.color ?? '#ffffff',
                    stroke: obj.stroke ?? obj.borderColor,
                    strokeWidth: obj.strokeWidth ?? obj.borderWidth ?? 0
                });
            }
            
            case 'text': {
                const fontSize = (obj.fontSize ?? 16) * this.fontScale * this.scale;
                
                const textNode = new Konva.Text({
                    ...commonProps,
                    text: obj.text ?? '',
                    fontSize: fontSize,
                    fontFamily: obj.fontFamily ?? 'Inter, sans-serif',
                    fontStyle: obj.fontWeight ? `${obj.fontWeight}` : 'normal',
                    fill: obj.fill ?? obj.color ?? '#ffffff',
                    align: obj.align ?? 'center',
                    verticalAlign: 'middle',
                    width: obj.maxWidth ? this.toPixels(obj.maxWidth, 'x') : undefined,
                    wrap: obj.wrap ?? 'none'
                });
                
                // Center the text after creation
                textNode.offsetX(textNode.width() / 2);
                textNode.offsetY(textNode.height() / 2);
                
                return textNode;
            }
            
            case 'line': {
                const points = [];
                if (obj.x1 !== undefined) {
                    points.push(this.toPixels(obj.x1, 'x'), this.toPixels(obj.y1, 'y'));
                }
                if (obj.x2 !== undefined) {
                    points.push(this.toPixels(obj.x2, 'x'), this.toPixels(obj.y2, 'y'));
                }
                
                return new Konva.Line({
                    ...commonProps,
                    points: points,
                    stroke: obj.stroke ?? obj.color ?? '#ffffff',
                    strokeWidth: obj.strokeWidth ?? obj.width ?? 2,
                    lineCap: 'round',
                    lineJoin: 'round'
                });
            }
            
            case 'group': {
                const group = new Konva.Group(commonProps);
                this.groupCache.set(obj.id, group);
                
                // Render children recursively
                if (obj.children && Array.isArray(obj.children)) {
                    for (const child of obj.children) {
                        const childNode = this.createKonvaObject(child);
                        if (childNode) {
                            group.add(childNode);
                        }
                    }
                }
                
                return group;
            }
            
            default:
                console.warn(`[KonvaRenderer] Unknown object type: ${obj.type}`);
                return null;
        }
    }
    
    /**
     * Update existing Konva object properties
     * @param {Konva.Node} konvaObj - Konva object to update
     * @param {Object} obj - New object definition
     */
    updateKonvaObject(konvaObj, obj) {
        const x = this.toPixels(obj.x ?? 50, 'x');
        const y = this.toPixels(obj.y ?? 50, 'y');
        
        // Update position
        konvaObj.x(x);
        konvaObj.y(y);
        
        // Update common properties
        if (obj.opacity !== undefined) konvaObj.opacity(obj.opacity);
        if (obj.rotation !== undefined) konvaObj.rotation(obj.rotation);
        if (obj.scale !== undefined || obj.scaleX !== undefined) {
            konvaObj.scaleX(obj.scaleX ?? obj.scale ?? 1);
        }
        if (obj.scale !== undefined || obj.scaleY !== undefined) {
            konvaObj.scaleY(obj.scaleY ?? obj.scale ?? 1);
        }
        
        // Update type-specific properties
        switch (obj.type) {
            case 'rect':
                if (obj.width !== undefined || obj.height !== undefined) {
                    const width = this.toPixels(obj.width ?? 10, 'x');
                    const height = this.toPixels(obj.height ?? 10, 'y');
                    konvaObj.width(width);
                    konvaObj.height(height);
                    konvaObj.offsetX(width / 2);
                    konvaObj.offsetY(height / 2);
                }
                if (obj.fill || obj.color) konvaObj.fill(obj.fill ?? obj.color);
                if (obj.cornerRadius !== undefined) konvaObj.cornerRadius(obj.cornerRadius);
                break;
                
            case 'circle':
                if (obj.radius !== undefined) {
                    const radius = this.toPixels(obj.radius, 'x');
                    konvaObj.radius(radius);
                }
                if (obj.fill || obj.color) konvaObj.fill(obj.fill ?? obj.color);
                break;
                
            case 'text':
                if (obj.text !== undefined) konvaObj.text(obj.text);
                if (obj.fontSize !== undefined) {
                    const fontSize = obj.fontSize * this.fontScale * this.scale;
                    konvaObj.fontSize(fontSize);
                }
                if (obj.fill || obj.color) konvaObj.fill(obj.fill ?? obj.color);
                
                // Re-center after text change
                konvaObj.offsetX(konvaObj.width() / 2);
                konvaObj.offsetY(konvaObj.height() / 2);
                break;
                
            case 'line':
                if (obj.x1 !== undefined || obj.x2 !== undefined) {
                    const points = [
                        this.toPixels(obj.x1 ?? 0, 'x'),
                        this.toPixels(obj.y1 ?? 0, 'y'),
                        this.toPixels(obj.x2 ?? 100, 'x'),
                        this.toPixels(obj.y2 ?? 100, 'y')
                    ];
                    konvaObj.points(points);
                }
                if (obj.stroke || obj.color) konvaObj.stroke(obj.stroke ?? obj.color);
                break;
                
            case 'group':
                // Update children recursively
                if (obj.children && Array.isArray(obj.children)) {
                    // Clear existing children
                    konvaObj.destroyChildren();
                    
                    // Add new children
                    for (const child of obj.children) {
                        const childNode = this.createKonvaObject(child);
                        if (childNode) {
                            konvaObj.add(childNode);
                        }
                    }
                }
                break;
        }
        
        // Update shadow if specified
        if (obj.shadow) {
            konvaObj.shadowColor(obj.shadow.color ?? 'rgba(0, 0, 0, 0.3)');
            konvaObj.shadowBlur(obj.shadow.blur ?? 10);
            konvaObj.shadowOffsetX(obj.shadow.offsetX ?? 0);
            konvaObj.shadowOffsetY(obj.shadow.offsetY ?? 5);
        }
    }
    
    /**
     * Convert percentage to pixels
     * @param {number} value - Percentage value (0-100)
     * @param {string} axis - 'x' or 'y'
     * @returns {number} Pixel value
     */
    toPixels(value, axis) {
        const dimension = axis === 'x' ? this.width : this.height;
        return (value / 100) * dimension;
    }
    
    /**
     * Get the underlying canvas for export
     * @returns {HTMLCanvasElement|OffscreenCanvas}
     */
    getCanvas() {
        // Konva's canvas is accessible via stage
        return this.stage.toCanvas();
    }
    
    /**
     * Destroy renderer and clean up resources
     */
    destroy() {
        this.stage.destroy();
        this.objectCache.clear();
        this.groupCache.clear();
    }
}
