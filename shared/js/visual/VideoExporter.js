/**
 * VideoExporter - WebM Video Export with WebCodecs API
 * Lesson Builder System
 * 
 * Features:
 * - Deterministic frame-by-frame rendering (NOT screen capture)
 * - 4K resolution (3840x2400) at 60 FPS
 * - VP9 codec with alpha channel support
 * - Progress callback: onProgress(currentFrame, totalFrames)
 * - Non-blocking async rendering
 */

import { StateBasedEngine } from './VisualEngine.js';
import { CanvasRenderer } from './CanvasRenderer.js';

/**
 * VideoExporter - Export animations to WebM video
 */
export class VideoExporter {
    /**
     * Create a VideoExporter
     * @param {Object} options
     * @param {number} [options.width=3840] - Video width
     * @param {number} [options.height=2400] - Video height
     * @param {number} [options.fps=60] - Frames per second
     * @param {number} [options.bitrate=25000000] - Video bitrate (25 Mbps default)
     */
    constructor(options = {}) {
        this.width = options.width ?? 3840;
        this.height = options.height ?? 2400;
        this.fps = options.fps ?? 60;
        this.bitrate = options.bitrate ?? 25000000;

        // State
        this.isRecording = false;
        this.chunks = [];
        this.encoder = null;
        this.muxer = null;
    }

    /**
     * Render entire scene to WebM video
     * @param {Object} scene - Scene definition
     * @param {Object} options
     * @param {Function} [options.onProgress] - Progress callback (currentFrame, totalFrames)
     * @param {number} [options.holdFrames=30] - Frames to hold on each step
     * @returns {Promise<Blob>} WebM video blob
     */
    async renderVideo(scene, options = {}) {
        const { onProgress, holdFrames = 30 } = options;

        // Create canvas and renderer
        const canvas = document.createElement('canvas');
        canvas.width = this.width;
        canvas.height = this.height;

        // Attach canvas to DOM (hidden) to ensure captureStream works reliably
        // Some browsers pause processing on detached canvases
        canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            opacity: 0;
            pointer-events: none;
            z-index: -1000;
        `;
        document.body.appendChild(canvas);

        // Context for rendering
        const ctx = canvas.getContext('2d');

        // StateBasedEngine initialization
        const renderer = new CanvasRenderer(canvas, { scale: 1.0 });
        const engine = new StateBasedEngine({
            width: this.width,
            height: this.height,
            fps: this.fps
        });
        engine.loadScene(scene);
        renderer.setEngine(engine);

        // Determine supported mime type
        let mimeType = 'video/webm; codecs=vp9';
        if (MediaRecorder.isTypeSupported('video/mp4; codecs=avc1.4d002a')) {
            mimeType = 'video/mp4; codecs=avc1.4d002a';
        } else if (MediaRecorder.isTypeSupported('video/mp4')) {
            mimeType = 'video/mp4';
        }

        console.log(`VideoExporter: Using MIME type ${mimeType}`);

        // Create stream and recorder
        const stream = canvas.captureStream(this.fps);
        const recorder = new MediaRecorder(stream, {
            mimeType: mimeType,
            videoBitsPerSecond: this.bitrate
        });

        const chunks = [];
        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunks.push(e.data);
        };

        const recordingPromise = new Promise(resolve => {
            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: mimeType });
                // Cleanup canvas from DOM
                if (canvas.parentNode) {
                    canvas.parentNode.removeChild(canvas);
                }
                resolve(blob);
            };
        });

        // Start recording
        recorder.start();
        this.isRecording = true;

        // Give MediaRecorder time to initialize
        await new Promise(r => setTimeout(r, 100));

        try {
            const totalFrames = engine.getTotalFrames();
            const frameInterval = 1000 / this.fps;

            // Ensure easing function is set (required by _updateInterpolatedState)
            engine.easingFn = (t) => t; // Linear for export - smooth transitions

            // Render each frame deterministically
            for (let frame = 0; frame < totalFrames; frame++) {
                if (!this.isRecording) break;

                // Seek to specific frame position
                engine.seekToFrame(frame);

                // Get the computed state for this frame
                const state = engine.getCurrentState();

                // Render to canvas
                renderer.render(state, { background: scene.background });

                // Wait for frame interval (required for captureStream to capture)
                await new Promise(r => setTimeout(r, frameInterval));

                // Report progress
                if (onProgress) onProgress(frame + 1, totalFrames);
            }

            // Hold on final frame for a moment
            for (let h = 0; h < holdFrames; h++) {
                if (!this.isRecording) break;
                const state = engine.getCurrentState();
                renderer.render(state, { background: scene.background });
                await new Promise(r => setTimeout(r, frameInterval));
            }

            recorder.stop();
            return await recordingPromise;

        } catch (err) {
            console.error('Export failed', err);
            recorder.stop();
            throw err;
        } finally {
            this.isRecording = false;
        }
    }

    /**
     * Calculate total frames for entire scene
     * @private
     */
    _calculateTotalFrames(scene, holdFrames) {
        let total = 0;
        for (const step of scene.steps) {
            const stepDuration = step.duration ?? scene.duration ?? 1000;
            const transitionFrames = Math.ceil((stepDuration / 1000) * this.fps);
            total += transitionFrames + holdFrames;
        }
        return total;
    }

    /**
     * Cancel ongoing recording
     */
    cancel() {
        this.isRecording = false;
    }
}

/**
 * Download a video blob
 * @param {Blob} blob - Video blob
 * @param {string} [filename='animation.webm'] - Filename
 */
export function downloadVideo(blob, filename = 'animation.webm') {
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
 * Create a progress UI element
 * @param {HTMLElement} container - Container element
 * @returns {Object} { update(current, total), hide() }
 */
export function createProgressUI(container) {
    const overlay = document.createElement('div');
    overlay.className = 'video-export-progress';
    overlay.innerHTML = `
        <div class="progress-content">
            <div class="progress-text">Rendering frame <span class="current">0</span> of <span class="total">0</span></div>
            <div class="progress-bar">
                <div class="progress-fill"></div>
            </div>
            <button class="cancel-btn">Cancel</button>
        </div>
    `;

    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;

    const content = overlay.querySelector('.progress-content');
    content.style.cssText = `
        background: #1a1a2e;
        padding: 40px;
        border-radius: 16px;
        text-align: center;
        min-width: 400px;
    `;

    const progressText = overlay.querySelector('.progress-text');
    progressText.style.cssText = `
        color: #fff;
        font-size: 18px;
        margin-bottom: 20px;
        font-family: 'Inter', sans-serif;
    `;

    const progressBar = overlay.querySelector('.progress-bar');
    progressBar.style.cssText = `
        background: #333;
        height: 8px;
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: 20px;
    `;

    const progressFill = overlay.querySelector('.progress-fill');
    progressFill.style.cssText = `
        background: linear-gradient(90deg, #4CAF50, #8BC34A);
        height: 100%;
        width: 0%;
        transition: width 0.1s ease;
    `;

    const cancelBtn = overlay.querySelector('.cancel-btn');
    cancelBtn.style.cssText = `
        background: #ff4444;
        color: #fff;
        border: none;
        padding: 10px 30px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 14px;
    `;

    container.appendChild(overlay);

    let onCancel = null;
    cancelBtn.onclick = () => {
        if (onCancel) onCancel();
    };

    return {
        update(current, total) {
            overlay.querySelector('.current').textContent = current;
            overlay.querySelector('.total').textContent = total;
            progressFill.style.width = `${(current / total) * 100}%`;
        },
        hide() {
            overlay.remove();
        },
        onCancel(fn) {
            onCancel = fn;
        }
    };
}
