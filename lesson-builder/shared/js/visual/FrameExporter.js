/**
 * FrameExporter - Export Frames as PNG/SVG/ZIP
 * Lesson Builder System
 */

import { SVGRenderer } from './SVGRenderer.js';
import { CanvasRenderer } from './CanvasRenderer.js';

export class FrameExporter {
    /**
     * Create a frame exporter
     * @param {Composition} composition - The composition to export
     * @param {string} [rendererType='svg'] - 'svg' or 'canvas'
     */
    constructor(composition, rendererType = 'svg') {
        this.composition = composition;
        this.rendererType = rendererType;
        this.renderer = rendererType === 'canvas'
            ? new CanvasRenderer(composition)
            : new SVGRenderer(composition);
    }

    /**
     * Export a single frame
     * @param {number} frameIndex - Frame to export
     * @param {string} format - 'png' or 'svg'
     * @param {number} [scale=1] - Scale factor for PNG
     * @returns {Promise<Blob|string>} PNG Blob or SVG string
     */
    async exportFrame(frameIndex, format = 'png', scale = 1) {
        if (format === 'svg') {
            if (this.rendererType === 'svg') {
                return this.renderer.renderFrame(frameIndex);
            } else {
                // Fallback: create SVG renderer for this export
                const svgRenderer = new SVGRenderer(this.composition);
                return svgRenderer.renderFrame(frameIndex);
            }
        } else {
            // PNG export
            if (this.rendererType === 'svg') {
                return await this.renderer.toPNG(frameIndex, scale);
            } else {
                this.renderer.renderFrame(frameIndex);
                return await this.renderer.toPNG();
            }
        }
    }

    /**
     * Export a sequence of frames
     * @param {number} startFrame - First frame (inclusive)
     * @param {number} endFrame - Last frame (inclusive)
     * @param {string} format - 'png' or 'svg'
     * @param {Function} [onProgress] - Progress callback (current, total)
     * @returns {Promise<Array<{frame: number, data: Blob|string}>>}
     */
    async exportSequence(startFrame, endFrame, format = 'png', onProgress) {
        const frames = [];
        const total = endFrame - startFrame + 1;

        for (let i = startFrame; i <= endFrame; i++) {
            const data = await this.exportFrame(i, format);
            frames.push({ frame: i, data });

            if (onProgress) {
                onProgress(i - startFrame + 1, total);
            }
        }

        return frames;
    }

    /**
     * Export all frames at step intervals
     * @param {number} totalSteps - Number of steps
     * @param {string} format - 'png' or 'svg'
     * @param {Function} [onProgress] - Progress callback
     * @returns {Promise<Array<{step: number, frame: number, data: Blob|string}>>}
     */
    async exportSteps(totalSteps, format = 'png', onProgress) {
        const frames = [];
        const framesPerStep = Math.floor(this.composition.durationInFrames / totalSteps);

        for (let step = 1; step <= totalSteps; step++) {
            const frameIndex = (step - 1) * framesPerStep;
            const data = await this.exportFrame(frameIndex, format);
            frames.push({ step, frame: frameIndex, data });

            if (onProgress) {
                onProgress(step, totalSteps);
            }
        }

        return frames;
    }

    /**
     * Create a ZIP file from exported frames
     * Note: Requires JSZip library
     * @param {Array<{frame: number, data: Blob|string}>} frames
     * @param {string} format - 'png' or 'svg'
     * @param {string} [baseName='frame'] - Base filename
     * @returns {Promise<Blob>}
     */
    async createZIP(frames, format = 'png', baseName = 'frame') {
        if (typeof JSZip === 'undefined') {
            throw new Error('JSZip library is required for ZIP export');
        }

        const zip = new JSZip();
        const folder = zip.folder('frames');

        for (const frame of frames) {
            const filename = `${baseName}-${String(frame.frame).padStart(4, '0')}.${format}`;

            if (format === 'svg') {
                folder.file(filename, frame.data);
            } else {
                folder.file(filename, frame.data);
            }
        }

        return await zip.generateAsync({ type: 'blob' });
    }

    /**
     * Export and download a single frame
     * @param {number} frameIndex
     * @param {string} format
     * @param {string} [filename]
     */
    async downloadFrame(frameIndex, format = 'png', filename) {
        const data = await this.exportFrame(frameIndex, format);
        const name = filename || `frame-${frameIndex}.${format}`;

        if (format === 'svg') {
            const blob = new Blob([data], { type: 'image/svg+xml' });
            this._downloadBlob(blob, name);
        } else {
            this._downloadBlob(data, name);
        }
    }

    /**
     * Export and download all steps as ZIP
     * @param {number} totalSteps
     * @param {string} format
     * @param {string} [zipName]
     * @param {Function} [onProgress]
     */
    async downloadStepsAsZIP(totalSteps, format = 'png', zipName, onProgress) {
        const frames = await this.exportSteps(totalSteps, format, onProgress);

        // Map to expected format
        const mappedFrames = frames.map(f => ({
            frame: f.step,
            data: f.data
        }));

        const zipBlob = await this.createZIP(mappedFrames, format, 'step');
        const name = zipName || `frames-${format}.zip`;

        this._downloadBlob(zipBlob, name);
    }

    /**
     * Export as animated GIF
     * Note: Requires gif.js library
     * @param {number} startFrame
     * @param {number} endFrame
     * @param {Object} [options]
     * @param {Function} [onProgress]
     * @returns {Promise<Blob>}
     */
    async exportGIF(startFrame, endFrame, options = {}, onProgress) {
        if (typeof GIF === 'undefined') {
            throw new Error('gif.js library is required for GIF export');
        }

        const gif = new GIF({
            workers: options.workers || 2,
            quality: options.quality || 10,
            width: this.composition.width,
            height: this.composition.height
        });

        const delay = options.delay || Math.round(1000 / this.composition.fps);
        const canvasRenderer = new CanvasRenderer(this.composition);
        const total = endFrame - startFrame + 1;

        for (let i = startFrame; i <= endFrame; i++) {
            canvasRenderer.renderFrame(i);
            gif.addFrame(canvasRenderer.getCanvas(), { copy: true, delay });

            if (onProgress) {
                onProgress(i - startFrame + 1, total);
            }
        }

        return new Promise((resolve, reject) => {
            gif.on('finished', blob => resolve(blob));
            gif.on('error', err => reject(err));
            gif.render();
        });
    }

    /**
     * Download a blob as file
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
    }

    /**
     * Get frame as data URL
     * @param {number} frameIndex
     * @param {string} format
     * @returns {Promise<string>}
     */
    async getFrameDataURL(frameIndex, format = 'png') {
        if (format === 'svg') {
            if (this.rendererType === 'svg') {
                return this.renderer.toDataURL(frameIndex);
            }
        }

        // For PNG, render then convert
        const canvasRenderer = new CanvasRenderer(this.composition);
        canvasRenderer.renderFrame(frameIndex);
        return canvasRenderer.toDataURL('image/png');
    }
}
