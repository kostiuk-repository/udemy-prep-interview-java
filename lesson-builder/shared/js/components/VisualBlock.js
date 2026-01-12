/**
 * VisualBlock Component - Container for Animated Visuals
 * Lesson Builder System
 */

import { EventBus, Events } from '../core/EventBus.js';
import { StepNavigator } from './StepNavigator.js';

/**
 * VisualBlock manager - handles multiple visual blocks
 */
const visualBlocks = new Map();

export const VisualBlock = {
    /**
     * Initialize a VisualBlock instance
     * @param {Object} config
     * @param {HTMLElement} config.container - Container element
     * @param {string} config.visualId - Visual identifier
     * @param {Object} [config.composition] - Composition instance
     * @param {number} [config.totalSteps=1] - Number of steps
     * @param {string} [config.renderer='svg'] - Renderer type ('svg' or 'canvas')
     * @returns {Object} VisualBlock instance
     */
    init(config) {
        const instance = {
            container: config.container,
            visualId: config.visualId,
            composition: config.composition,
            state: {
                currentStep: 1,
                totalSteps: config.totalSteps || 1,
                renderer: config.renderer || 'svg'
            },
            elements: {},
            stepNavigator: null
        };

        // Cache animation container
        instance.elements.animationContainer = config.container.querySelector('.animation-container') ||
            config.container.querySelector(`#${config.visualId}-container`);

        // Initialize step navigator if multi-step
        if (instance.state.totalSteps > 1) {
            const navContainer = config.container.querySelector('.step-navigation') ||
                config.container.querySelector(`[data-visual-nav="${config.visualId}"]`);

            if (navContainer) {
                instance.stepNavigator = StepNavigator.init({
                    container: navContainer,
                    visualId: config.visualId,
                    totalSteps: instance.state.totalSteps,
                    initialStep: 1,
                    onStepChange: (step) => {
                        this.renderStep(config.visualId, step);
                    }
                });
            }
        }

        // Bind export button events
        this._bindExportEvents(instance);

        // Store instance
        visualBlocks.set(config.visualId, instance);

        // Render initial step
        this.renderStep(config.visualId, 1);

        return instance;
    },

    /**
     * Bind export button events
     * @private
     */
    _bindExportEvents(instance) {
        const exportButtons = instance.container.querySelectorAll('[data-export-visual]');
        exportButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const format = btn.dataset.exportVisual;
                this.exportFrame(instance.visualId, instance.state.currentStep, format);
            });
        });
    },

    /**
     * Render a specific step
     * @param {string} visualId
     * @param {number} stepNumber
     */
    renderStep(visualId, stepNumber) {
        const instance = visualBlocks.get(visualId);
        if (!instance) return;

        instance.state.currentStep = stepNumber;

        // If we have a composition, use the visual engine
        if (instance.composition) {
            this._renderCompositionStep(instance, stepNumber);
        } else {
            // Fallback: use built-in step visualization
            this._renderBuiltinStep(instance, stepNumber);
        }

        EventBus.emit(Events.VISUAL_STEP_RENDERED, {
            visualId,
            step: stepNumber
        });
    },

    /**
     * Render composition step using visual engine
     * @private
     */
    _renderCompositionStep(instance, stepNumber) {
        const { composition, elements } = instance;
        if (!composition || !elements.animationContainer) return;

        // Calculate frame index from step number
        const framesPerStep = Math.floor(composition.durationInFrames / instance.state.totalSteps);
        const frameIndex = (stepNumber - 1) * framesPerStep;

        // Get frame state and render
        try {
            const frameState = composition.getFrameState(frameIndex);
            this._renderFrameState(elements.animationContainer, frameState, instance.state.renderer);
        } catch (error) {
            console.error(`VisualBlock: Error rendering step ${stepNumber}:`, error);
        }
    },

    /**
     * Render built-in step visualization (for simple step reveals)
     * @private
     */
    _renderBuiltinStep(instance, stepNumber) {
        const container = instance.elements.animationContainer;
        if (!container) return;

        // Find step elements (by ID pattern like "hookStep1", "hookStep2", etc.)
        const stepElements = container.querySelectorAll('[id*="Step"]');

        stepElements.forEach((el, index) => {
            const stepIndex = index + 1;
            if (stepIndex <= stepNumber) {
                el.style.opacity = '1';
                el.style.transform = 'translateX(0)';
                if (el.classList.contains('killer-card')) {
                    el.classList.add('visible');
                }
            } else {
                el.style.opacity = '0';
                if (el.classList.contains('killer-card')) {
                    el.classList.remove('visible');
                }
            }
        });
    },

    /**
     * Render frame state to container
     * @private
     */
    _renderFrameState(container, frameState, rendererType) {
        if (rendererType === 'svg') {
            this._renderSVG(container, frameState);
        } else if (rendererType === 'canvas') {
            this._renderCanvas(container, frameState);
        }
    },

    /**
     * Render frame state as SVG
     * @private
     */
    _renderSVG(container, frameState) {
        let svg = container.querySelector('svg.visual-svg');
        if (!svg) {
            svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('class', 'visual-svg');
            svg.style.width = '100%';
            svg.style.height = '100%';
            container.innerHTML = '';
            container.appendChild(svg);
        }

        // Clear existing content
        svg.innerHTML = '';

        // Set viewBox from composition if available
        if (frameState.width && frameState.height) {
            svg.setAttribute('viewBox', `0 0 ${frameState.width} ${frameState.height}`);
        }

        // Render each layer
        if (frameState.layers) {
            frameState.layers.forEach(layer => {
                const element = this._createSVGElement(layer);
                if (element) {
                    svg.appendChild(element);
                }
            });
        }
    },

    /**
     * Create SVG element from layer state
     * @private
     */
    _createSVGElement(layer) {
        let element;

        switch (layer.type) {
            case 'rect':
                element = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                element.setAttribute('x', layer.x || 0);
                element.setAttribute('y', layer.y || 0);
                element.setAttribute('width', layer.width || 100);
                element.setAttribute('height', layer.height || 100);
                break;

            case 'circle':
                element = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                element.setAttribute('cx', layer.cx || layer.x || 0);
                element.setAttribute('cy', layer.cy || layer.y || 0);
                element.setAttribute('r', layer.r || layer.radius || 50);
                break;

            case 'text':
                element = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                element.setAttribute('x', layer.x || 0);
                element.setAttribute('y', layer.y || 0);
                element.textContent = layer.text || '';
                if (layer.fontSize) {
                    element.setAttribute('font-size', layer.fontSize);
                }
                if (layer.fontFamily) {
                    element.setAttribute('font-family', layer.fontFamily);
                }
                if (layer.textAnchor) {
                    element.setAttribute('text-anchor', layer.textAnchor);
                }
                break;

            case 'path':
                element = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                element.setAttribute('d', layer.d || '');
                break;

            case 'line':
                element = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                element.setAttribute('x1', layer.x1 || 0);
                element.setAttribute('y1', layer.y1 || 0);
                element.setAttribute('x2', layer.x2 || 100);
                element.setAttribute('y2', layer.y2 || 100);
                break;

            default:
                return null;
        }

        // Apply common attributes
        if (layer.fill) element.setAttribute('fill', layer.fill);
        if (layer.stroke) element.setAttribute('stroke', layer.stroke);
        if (layer.strokeWidth) element.setAttribute('stroke-width', layer.strokeWidth);
        if (layer.opacity !== undefined) element.setAttribute('opacity', layer.opacity);
        if (layer.transform) element.setAttribute('transform', layer.transform);

        return element;
    },

    /**
     * Render frame state to canvas
     * @private
     */
    _renderCanvas(container, frameState) {
        let canvas = container.querySelector('canvas.visual-canvas');
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.className = 'visual-canvas';
            canvas.width = frameState.width || 800;
            canvas.height = frameState.height || 600;
            container.innerHTML = '';
            container.appendChild(canvas);
        }

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Render each layer
        if (frameState.layers) {
            frameState.layers.forEach(layer => {
                this._renderCanvasLayer(ctx, layer);
            });
        }
    },

    /**
     * Render a layer to canvas context
     * @private
     */
    _renderCanvasLayer(ctx, layer) {
        ctx.save();

        if (layer.opacity !== undefined) {
            ctx.globalAlpha = layer.opacity;
        }

        switch (layer.type) {
            case 'rect':
                if (layer.fill) {
                    ctx.fillStyle = layer.fill;
                    ctx.fillRect(layer.x || 0, layer.y || 0, layer.width || 100, layer.height || 100);
                }
                if (layer.stroke) {
                    ctx.strokeStyle = layer.stroke;
                    ctx.lineWidth = layer.strokeWidth || 1;
                    ctx.strokeRect(layer.x || 0, layer.y || 0, layer.width || 100, layer.height || 100);
                }
                break;

            case 'circle':
                ctx.beginPath();
                ctx.arc(layer.cx || layer.x || 0, layer.cy || layer.y || 0, layer.r || layer.radius || 50, 0, Math.PI * 2);
                if (layer.fill) {
                    ctx.fillStyle = layer.fill;
                    ctx.fill();
                }
                if (layer.stroke) {
                    ctx.strokeStyle = layer.stroke;
                    ctx.lineWidth = layer.strokeWidth || 1;
                    ctx.stroke();
                }
                break;

            case 'text':
                ctx.font = `${layer.fontSize || 16}px ${layer.fontFamily || 'sans-serif'}`;
                ctx.textAlign = layer.textAnchor || 'start';
                if (layer.fill) {
                    ctx.fillStyle = layer.fill;
                    ctx.fillText(layer.text || '', layer.x || 0, layer.y || 0);
                }
                break;
        }

        ctx.restore();
    },

    /**
     * Export current frame as image
     * @param {string} visualId
     * @param {number} stepNumber
     * @param {string} format - 'png' or 'svg'
     */
    async exportFrame(visualId, stepNumber, format = 'png') {
        const instance = visualBlocks.get(visualId);
        if (!instance) return;

        EventBus.emit(Events.VISUAL_EXPORT_STARTED, { format, count: 1 });

        try {
            if (format === 'svg') {
                this._exportSVG(instance, stepNumber);
            } else {
                await this._exportPNG(instance, stepNumber);
            }

            EventBus.emit(Events.VISUAL_EXPORT_COMPLETE, { format, files: 1 });
        } catch (error) {
            console.error('VisualBlock: Export failed:', error);
        }
    },

    /**
     * Export as SVG
     * @private
     */
    _exportSVG(instance, stepNumber) {
        const svg = instance.elements.animationContainer?.querySelector('svg');
        if (!svg) {
            console.warn('VisualBlock: No SVG element found');
            return;
        }

        const svgData = new XMLSerializer().serializeToString(svg);
        const blob = new Blob([svgData], { type: 'image/svg+xml' });
        this._downloadBlob(blob, `${instance.visualId}-step-${stepNumber}.svg`);
    },

    /**
     * Export as PNG
     * @private
     */
    async _exportPNG(instance, stepNumber) {
        const container = instance.elements.animationContainer;
        if (!container) return;

        // Check for html2canvas
        if (typeof html2canvas !== 'undefined') {
            const canvas = await html2canvas(container);
            canvas.toBlob(blob => {
                this._downloadBlob(blob, `${instance.visualId}-step-${stepNumber}.png`);
            });
        } else {
            // Fallback: try to convert SVG to PNG
            const svg = container.querySelector('svg');
            if (svg) {
                await this._svgToPNG(svg, `${instance.visualId}-step-${stepNumber}.png`);
            } else {
                console.warn('VisualBlock: html2canvas not available for PNG export');
            }
        }
    },

    /**
     * Convert SVG to PNG
     * @private
     */
    async _svgToPNG(svg, filename) {
        const svgData = new XMLSerializer().serializeToString(svg);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = svg.clientWidth || 800;
            canvas.height = svg.clientHeight || 600;

            const ctx = canvas.getContext('2d');
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);

            canvas.toBlob(blob => {
                this._downloadBlob(blob, filename);
                URL.revokeObjectURL(url);
            });
        };
        img.src = url;
    },

    /**
     * Download a blob
     * @private
     */
    _downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    /**
     * Get current step
     * @param {string} visualId
     * @returns {number}
     */
    getCurrentStep(visualId) {
        const instance = visualBlocks.get(visualId);
        return instance?.state.currentStep || 1;
    },

    /**
     * Destroy a visual block instance
     * @param {string} visualId
     */
    destroy(visualId) {
        const instance = visualBlocks.get(visualId);
        if (instance) {
            if (instance.stepNavigator) {
                StepNavigator.destroy(visualId);
            }
            visualBlocks.delete(visualId);
        }
    },

    /**
     * Destroy all visual block instances
     */
    destroyAll() {
        visualBlocks.forEach((_, visualId) => {
            this.destroy(visualId);
        });
    }
};
