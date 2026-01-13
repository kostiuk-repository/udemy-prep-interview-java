/**
 * SceneBuilder - JSON to Konva Converter
 * Lesson Builder System
 * 
 * Converts scene definitions (JSON format) to Konva objects.
 * Handles:
 * - Multi-step animations with state transitions
 * - Object creation from type definitions (rect, circle, text, group)
 * - Property interpolation between steps
 * - Konva.Tween for smooth animations
 */

/**
 * SceneBuilder - Builds Konva scenes from JSON definitions
 */
export class SceneBuilder {
    /**
     * Create a SceneBuilder
     * @param {import('./StageManager.js').StageManager} stageManager - Stage manager instance
     */
    constructor(stageManager) {
        this.stageManager = stageManager;
        this.layer = stageManager.getLayer();
        this.scene = null;
        this.currentStepIndex = 0;
        this.objects = new Map(); // id -> Konva.Node
        this.tweens = new Map(); // id -> Konva.Tween
    }
    
    /**
     * Build scene from JSON definition
     * @param {Object} sceneConfig - Scene configuration
     * @param {string} sceneConfig.id - Scene ID
     * @param {Array} sceneConfig.steps - Animation steps
     * @param {string} [sceneConfig.background] - Background color
     * @param {number} [sceneConfig.duration=1000] - Default transition duration (ms)
     */
    build(sceneConfig) {
        this.scene = sceneConfig;
        
        // Set background
        if (sceneConfig.background) {
            this.stageManager.setBackground(sceneConfig.background);
        }
        
        // Build first step
        if (sceneConfig.steps && sceneConfig.steps.length > 0) {
            this.goToStep(0, 0); // Instant jump to first step
        }
        
        console.log(`[SceneBuilder] Built scene "${sceneConfig.id}" with ${sceneConfig.steps.length} steps`);
    }
    
    /**
     * Go to a specific step with animation
     * @param {number} stepIndex - Step index (0-based)
     * @param {number} [duration] - Animation duration in ms (0 for instant)
     */
    goToStep(stepIndex, duration) {
        if (!this.scene || !this.scene.steps || stepIndex >= this.scene.steps.length) {
            console.warn(`[SceneBuilder] Invalid step index: ${stepIndex}`);
            return;
        }
        
        const step = this.scene.steps[stepIndex];
        const transitionDuration = duration ?? step.duration ?? this.scene.duration ?? 1000;
        
        console.log(`[SceneBuilder] Going to step ${stepIndex} (duration: ${transitionDuration}ms)`);
        
        // Stop all active tweens
        this.stopAllTweens();
        
        // Process objects in this step
        this.processStepObjects(step.objects || [], transitionDuration);
        
        this.currentStepIndex = stepIndex;
        this.stageManager.draw();
    }
    
    /**
     * Process objects for a step
     * @param {Array} objects - Object definitions
     * @param {number} duration - Animation duration
     */
    processStepObjects(objects, duration) {
        const processedIds = new Set();
        
        // Create or update objects
        for (const objDef of objects) {
            this.processObject(objDef, duration);
            processedIds.add(objDef.id);
            
            // Process children if group
            if (objDef.children) {
                for (const child of objDef.children) {
                    processedIds.add(child.id);
                }
            }
        }
        
        // Fade out objects not in this step
        for (const [id, node] of this.objects) {
            if (!processedIds.has(id)) {
                this.fadeOut(node, duration);
            }
        }
    }
    
    /**
     * Process a single object definition
     * @param {Object} objDef - Object definition
     * @param {number} duration - Animation duration
     */
    processObject(objDef, duration) {
        const existingNode = this.objects.get(objDef.id);

        // If type is omitted (update step), infer from existing node metadata
        if (!objDef.type && existingNode) {
            objDef.type = existingNode.getAttr('objectType');
        }
        
        if (existingNode) {
            // Update existing object
            this.updateObject(existingNode, objDef, duration);
        } else {
            // Create new object
            const node = this.createObject(objDef);
            if (node) {
                this.objects.set(objDef.id, node);
                this.stageManager.registerObject(objDef.id, node);
                this.layer.add(node);
                
                // Fade in if duration > 0
                if (duration > 0) {
                    node.opacity(0);
                    this.fadeIn(node, duration);
                }
            }
        }
    }
    
    /**
     * Create a Konva object from definition
     * @param {Object} objDef - Object definition
     * @returns {Konva.Node|null}
     */
    createObject(objDef) {
        const props = objDef.props || {};
        
        // Convert percentage positions to pixels
        const x = props.x !== undefined ? this.stageManager.toPixels(props.x, 'x') : 0;
        const y = props.y !== undefined ? this.stageManager.toPixels(props.y, 'y') : 0;
        
        // Common properties
        const commonProps = {
            x: x,
            y: y,
            opacity: props.opacity ?? 1,
            rotation: props.rotation ?? 0,
            scaleX: props.scaleX ?? props.scale ?? 1,
            scaleY: props.scaleY ?? props.scale ?? 1
        };
        
        // Apply shadow if specified
        if (props.shadow) {
            commonProps.shadowColor = props.shadow.color ?? 'rgba(0, 0, 0, 0.3)';
            commonProps.shadowBlur = props.shadow.blur ?? 10;
            commonProps.shadowOffsetX = props.shadow.offset?.x ?? 0;
            commonProps.shadowOffsetY = props.shadow.offset?.y ?? 5;
        }
        
        let node = null;
        
        switch (objDef.type) {
            case 'rect': {
                const width = props.width ? this.stageManager.toPixels(props.width, 'x') : 100;
                const height = props.height ? this.stageManager.toPixels(props.height, 'y') : 100;
                
                node = new Konva.Rect({
                    ...commonProps,
                    width: width,
                    height: height,
                    offsetX: width / 2,
                    offsetY: height / 2,
                    fill: props.fill ?? props.color ?? '#ffffff',
                    stroke: props.stroke ?? props.borderColor,
                    strokeWidth: props.strokeWidth ?? props.borderWidth ?? 0,
                    cornerRadius: props.cornerRadius ?? props.rx ?? props.borderRadius ?? 0
                });
                break;
            }
            
            case 'circle': {
                const radius = props.radius ? this.stageManager.toPixels(props.radius, 'x') : 50;
                
                node = new Konva.Circle({
                    ...commonProps,
                    radius: radius,
                    fill: props.fill ?? props.color ?? '#ffffff',
                    stroke: props.stroke ?? props.borderColor,
                    strokeWidth: props.strokeWidth ?? props.borderWidth ?? 0
                });
                break;
            }
            
            case 'text': {
                const fontSize = (props.fontSize ?? 16) * 2.5; // Font scale for 4K
                
                node = new Konva.Text({
                    ...commonProps,
                    text: props.text ?? '',
                    fontSize: fontSize,
                    fontFamily: props.fontFamily ?? 'Inter, sans-serif',
                    fontStyle: props.fontWeight ? `${props.fontWeight}` : 'normal',
                    fill: props.fill ?? props.color ?? '#ffffff',
                    align: props.align ?? 'center',
                    verticalAlign: 'middle',
                    width: props.maxWidth ? this.stageManager.toPixels(props.maxWidth, 'x') : undefined,
                    wrap: props.wrap ?? 'none'
                });
                
                // Center text
                node.offsetX(node.width() / 2);
                node.offsetY(node.height() / 2);
                break;
            }
            
            case 'line': {
                const x1 = props.x1 ? this.stageManager.toPixels(props.x1, 'x') : 0;
                const y1 = props.y1 ? this.stageManager.toPixels(props.y1, 'y') : 0;
                const x2 = props.x2 ? this.stageManager.toPixels(props.x2, 'x') : 100;
                const y2 = props.y2 ? this.stageManager.toPixels(props.y2, 'y') : 100;
                
                node = new Konva.Line({
                    ...commonProps,
                    points: [x1, y1, x2, y2],
                    stroke: props.stroke ?? props.color ?? '#ffffff',
                    strokeWidth: props.strokeWidth ?? props.width ?? 2,
                    lineCap: 'round',
                    lineJoin: 'round'
                });
                break;
            }
            
            case 'path': {
                const width = props.width ? this.stageManager.toPixels(props.width, 'x') : undefined;
                const height = props.height ? this.stageManager.toPixels(props.height, 'y') : undefined;

                node = new Konva.Path({
                    ...commonProps,
                    data: props.d ?? '',
                    fill: props.fill ?? props.color ?? 'transparent',
                    stroke: props.stroke ?? props.color,
                    strokeWidth: props.strokeWidth ?? props.width ?? 2,
                    width: width,
                    height: height,
                    offsetX: width ? width / 2 : 0,
                    offsetY: height ? height / 2 : 0
                });
                break;
            }

            case 'group': {
                node = new Konva.Group(commonProps);
                
                // Add children
                if (objDef.children) {
                    for (const childDef of objDef.children) {
                        const childNode = this.createObject(childDef);
                        if (childNode) {
                            this.objects.set(childDef.id, childNode);
                            node.add(childNode);
                        }
                    }
                }
                break;
            }
            
            default:
                console.warn(`[SceneBuilder] Unknown object type: ${objDef.type}`);
                return null;
        }
        
        if (node) {
            node.setAttr('objectType', objDef.type);
        }

        return node;
    }
    
    /**
     * Update existing object with new properties
     * @param {Konva.Node} node - Konva node to update
     * @param {Object} objDef - New object definition
     * @param {number} duration - Animation duration
     */
    updateObject(node, objDef, duration) {
        const props = objDef.props || {};
        
        // Calculate target properties
        const targetProps = {};
        
        if (props.x !== undefined) targetProps.x = this.stageManager.toPixels(props.x, 'x');
        if (props.y !== undefined) targetProps.y = this.stageManager.toPixels(props.y, 'y');
        if (props.opacity !== undefined) targetProps.opacity = props.opacity;
        if (props.rotation !== undefined) targetProps.rotation = props.rotation;
        if (props.scale !== undefined) {
            targetProps.scaleX = props.scale;
            targetProps.scaleY = props.scale;
        }
        if (props.scaleX !== undefined) targetProps.scaleX = props.scaleX;
        if (props.scaleY !== undefined) targetProps.scaleY = props.scaleY;
        
        // Type-specific properties
        if (objDef.type === 'rect') {
            if (props.width !== undefined) {
                const width = this.stageManager.toPixels(props.width, 'x');
                targetProps.width = width;
                targetProps.offsetX = width / 2;
            }
            if (props.height !== undefined) {
                const height = this.stageManager.toPixels(props.height, 'y');
                targetProps.height = height;
                targetProps.offsetY = height / 2;
            }
            if (props.fill || props.color) targetProps.fill = props.fill ?? props.color;
            if (props.cornerRadius !== undefined) targetProps.cornerRadius = props.cornerRadius;
        } else if (objDef.type === 'circle') {
            if (props.radius !== undefined) {
                targetProps.radius = this.stageManager.toPixels(props.radius, 'x');
            }
            if (props.fill || props.color) targetProps.fill = props.fill ?? props.color;
        } else if (objDef.type === 'text') {
            if (props.text !== undefined) node.text(props.text); // Instant text change
            if (props.fontSize !== undefined) {
                targetProps.fontSize = props.fontSize * 2.5;
            }
            if (props.fill || props.color) targetProps.fill = props.fill ?? props.color;
        } else if (objDef.type === 'path') {
            if (props.d !== undefined) targetProps.data = props.d;
            if (props.fill || props.color) targetProps.fill = props.fill ?? props.color;
            if (props.stroke) targetProps.stroke = props.stroke;
        }
        
        // Animate to target properties
        if (duration > 0 && Object.keys(targetProps).length > 0) {
            const tween = new Konva.Tween({
                node: node,
                duration: duration / 1000, // Convert to seconds
                easing: Konva.Easings.EaseInOut,
                ...targetProps
            });
            
            this.tweens.set(objDef.id, tween);
            tween.play();
        } else {
            // Instant update
            node.setAttrs(targetProps);
        }
    }
    
    /**
     * Fade in a node
     * @param {Konva.Node} node - Node to fade in
     * @param {number} duration - Duration in ms
     */
    fadeIn(node, duration) {
        const tween = new Konva.Tween({
            node: node,
            duration: duration / 1000,
            opacity: 1,
            easing: Konva.Easings.EaseIn
        });
        tween.play();
    }
    
    /**
     * Fade out a node
     * @param {Konva.Node} node - Node to fade out
     * @param {number} duration - Duration in ms
     */
    fadeOut(node, duration) {
        // If node is already destroyed or not in a layer, skip tween
        if (!node.getLayer()) {
            const id = node.getAttr('objectId');
            node.destroy();
            if (id) {
                this.objects.delete(id);
            }
            return;
        }

        const tween = new Konva.Tween({
            node: node,
            duration: duration / 1000,
            opacity: 0,
            easing: Konva.Easings.EaseOut,
            onFinish: () => {
                node.destroy();
                const id = node.getAttr('objectId');
                if (id) {
                    this.objects.delete(id);
                }
            }
        });
        tween.play();
    }
    
    /**
     * Stop all active tweens
     */
    stopAllTweens() {
        for (const tween of this.tweens.values()) {
            tween.destroy();
        }
        this.tweens.clear();
    }
    
    /**
     * Get current step index
     * @returns {number}
     */
    getCurrentStepIndex() {
        return this.currentStepIndex;
    }
    
    /**
     * Get total steps
     * @returns {number}
     */
    getTotalSteps() {
        return this.scene?.steps?.length ?? 0;
    }
    
    /**
     * Clean up
     */
    destroy() {
        this.stopAllTweens();
        this.objects.clear();
        this.scene = null;
    }
}
