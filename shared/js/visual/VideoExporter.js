/**
 * VideoExporter - WebM Video Export with Duration Fixing
 * Lesson Builder System
 * 
 * Features:
 * - Deterministic frame-by-frame rendering (NOT screen capture)
 * - 4K resolution (3840x2400) at 60 FPS
 * - VP9 codec with alpha channel support
 * - WebM EBML Duration fixing for proper timeline/seeking
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
     * @returns {Promise<Blob>} WebM video blob with fixed duration
     */
    async renderVideo(scene, options = {}) {
        const { onProgress, holdFrames = 30 } = options;

        console.log('=== VIDEO EXPORT START ===');
        console.log('Scene:', scene?.id || 'unknown');
        console.log('Steps count:', scene?.steps?.length || 0);
        console.log('Options:', { holdFrames, fps: this.fps, width: this.width, height: this.height });

        if (!scene || !scene.steps || scene.steps.length === 0) {
            console.error('VideoExporter: No scene or steps provided!');
            throw new Error('Invalid scene: no steps defined');
        }

        // Create canvas and renderer
        const canvas = document.createElement('canvas');
        canvas.width = this.width;
        canvas.height = this.height;
        console.log('Canvas created:', canvas.width, 'x', canvas.height);

        // Attach canvas to DOM (hidden) to ensure captureStream works reliably
        canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            opacity: 0;
            pointer-events: none;
            z-index: -1000;
        `;
        document.body.appendChild(canvas);
        console.log('Canvas attached to DOM');

        // Context for rendering
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.error('VideoExporter: Failed to get 2D context!');
            throw new Error('Failed to get canvas 2D context');
        }

        // StateBasedEngine initialization
        const renderer = new CanvasRenderer(canvas, { scale: 1.0 });
        const engine = new StateBasedEngine({
            width: this.width,
            height: this.height,
            fps: this.fps
        });

        console.log('Loading scene into engine...');
        engine.loadScene(scene);
        renderer.setEngine(engine);
        console.log('Engine loaded. Step count:', engine.getStepCount());

        // Always use WebM for reliable duration fixing
        const mimeType = 'video/webm; codecs=vp9';
        console.log('Using MIME type:', mimeType);

        // Create stream and recorder
        const stream = canvas.captureStream(this.fps);
        console.log('Stream created. Tracks:', stream.getTracks().length);

        const recorder = new MediaRecorder(stream, {
            mimeType: mimeType,
            videoBitsPerSecond: this.bitrate
        });
        console.log('MediaRecorder state:', recorder.state);

        const chunks = [];
        recorder.ondataavailable = (e) => {
            console.log('Data available:', e.data.size, 'bytes');
            if (e.data.size > 0) chunks.push(e.data);
        };

        recorder.onerror = (e) => {
            console.error('MediaRecorder error:', e);
        };

        // Calculate total duration
        const totalFrames = engine.getTotalFrames() + holdFrames;
        const durationMs = (totalFrames / this.fps) * 1000;
        console.log('Expected duration:', durationMs, 'ms');

        const recordingPromise = new Promise(resolve => {
            recorder.onstop = async () => {
                console.log('Recorder stopped. Total chunks:', chunks.length);

                // Create raw blob
                let blob = new Blob(chunks, { type: mimeType });
                console.log('Raw blob size:', blob.size, 'bytes');

                // Fix WebM duration metadata
                try {
                    console.log('Fixing WebM duration metadata...');
                    blob = await fixWebMDuration(blob, durationMs);
                    console.log('Duration fixed. New blob size:', blob.size, 'bytes');
                } catch (err) {
                    console.warn('Duration fixing failed, using raw blob:', err);
                }

                if (canvas.parentNode) {
                    canvas.parentNode.removeChild(canvas);
                }
                resolve(blob);
            };
        });

        // Start recording
        recorder.start(100); // Request data every 100ms
        this.isRecording = true;
        console.log('Recording started. State:', recorder.state);

        // Give MediaRecorder time to initialize
        await new Promise(r => setTimeout(r, 200));

        try {
            const frameInterval = 1000 / this.fps;
            console.log('Total frames to render:', totalFrames);
            console.log('Frame interval:', frameInterval, 'ms');

            if (totalFrames === 0) {
                console.error('VideoExporter: getTotalFrames() returned 0!');
                throw new Error('No frames to render');
            }

            // Ensure easing function is set
            engine.easingFn = (t) => t;

            // Render animation frames
            const animationFrames = engine.getTotalFrames();
            for (let frame = 0; frame < animationFrames; frame++) {
                if (!this.isRecording) {
                    console.warn('Recording cancelled at frame', frame);
                    break;
                }

                // Seek to specific frame position
                engine.seekToFrame(frame);

                // Get the computed state for this frame
                const state = engine.getCurrentState();

                // Log every 10th frame for debugging
                if (frame % 10 === 0) {
                    console.log(`Frame ${frame}/${animationFrames}: objects=${state.length}, step=${engine.currentStepIndex}`);
                }

                // Render to canvas
                renderer.render(state, { background: scene.background });

                // Wait for frame interval
                await new Promise(r => setTimeout(r, frameInterval));

                // Report progress
                if (onProgress) onProgress(frame + 1, totalFrames);
            }

            console.log('Main render loop complete. Adding hold frames...');

            // Hold on final frame
            for (let h = 0; h < holdFrames; h++) {
                if (!this.isRecording) break;
                const state = engine.getCurrentState();
                renderer.render(state, { background: scene.background });
                await new Promise(r => setTimeout(r, frameInterval));
                if (onProgress) onProgress(animationFrames + h + 1, totalFrames);
            }

            console.log('Stopping recorder...');
            recorder.stop();

            const blob = await recordingPromise;
            console.log('=== VIDEO EXPORT COMPLETE ===');
            console.log('Final blob size:', blob.size, 'bytes');

            return blob;

        } catch (err) {
            console.error('Export failed:', err);
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

// ==========================================================================
// WebM EBML Duration Fixing
// ==========================================================================

/**
 * Fix WebM duration metadata in a blob
 * Chrome's MediaRecorder doesn't write Duration to WebM files, causing
 * playback issues in some players (can't seek, unknown length).
 * 
 * This function patches the EBML structure to add/fix the Duration element.
 * 
 * @param {Blob} blob - Original WebM blob
 * @param {number} durationMs - Duration in milliseconds
 * @returns {Promise<Blob>} Fixed WebM blob
 */
async function fixWebMDuration(blob, durationMs) {
    const buffer = await blob.arrayBuffer();
    const data = new Uint8Array(buffer);

    // Find the Segment Info element and patch duration
    const fixed = patchWebMDuration(data, durationMs);

    return new Blob([fixed], { type: 'video/webm' });
}

/**
 * Patch WebM EBML to include Duration
 * @param {Uint8Array} data - Original WebM data
 * @param {number} durationMs - Duration in milliseconds
 * @returns {Uint8Array} Patched data
 */
function patchWebMDuration(data, durationMs) {
    // EBML element IDs for WebM
    const SEGMENT_ID = [0x18, 0x53, 0x80, 0x67];         // Segment
    const SEGMENT_INFO_ID = [0x15, 0x49, 0xA9, 0x66];    // Info (inside Segment)
    const DURATION_ID = [0x44, 0x89];                    // Duration (inside Info)
    const TIMECODE_SCALE_ID = [0x2A, 0xD7, 0xB1];        // TimecodeScale

    // Find Segment element
    let pos = findEBMLElement(data, SEGMENT_ID, 0);
    if (pos === -1) {
        console.warn('Could not find Segment element');
        return data;
    }

    // Skip Segment header
    pos = skipEBMLHeader(data, pos);

    // Find Info element within Segment
    const infoPos = findEBMLElement(data, SEGMENT_INFO_ID, pos);
    if (infoPos === -1) {
        console.warn('Could not find Info element');
        return data;
    }

    // Get Info element size and content position
    const infoHeaderEnd = skipEBMLHeader(data, infoPos);
    const infoSize = readEBMLSize(data, infoPos + SEGMENT_INFO_ID.length);
    const infoEnd = infoHeaderEnd + infoSize.value;

    // Check if Duration already exists in Info
    const existingDuration = findEBMLElement(data, DURATION_ID, infoHeaderEnd, infoEnd);

    // Get TimecodeScale (default 1000000 = 1ms precision)
    let timecodeScale = 1000000;
    const tcPos = findEBMLElement(data, TIMECODE_SCALE_ID, infoHeaderEnd, infoEnd);
    if (tcPos !== -1) {
        const tcHeaderEnd = skipEBMLHeader(data, tcPos);
        const tcSize = readEBMLSize(data, tcPos + TIMECODE_SCALE_ID.length);
        timecodeScale = readUnsignedInt(data, tcHeaderEnd, tcSize.value);
    }

    // Duration in WebM format (float64, in timecode units)
    // Duration = durationMs * 1000000 / timecodeScale (convert ms to ns, then to timecode units)
    const durationValue = (durationMs * 1000000) / timecodeScale;
    const durationBytes = encodeFloat64(durationValue);

    if (existingDuration !== -1) {
        // Replace existing Duration value
        const durHeaderEnd = existingDuration + DURATION_ID.length;
        const durSize = readEBMLSize(data, durHeaderEnd);
        const durValuePos = durHeaderEnd + durSize.length;

        // Replace the float value in place (assuming 8-byte float)
        const result = new Uint8Array(data.length);
        result.set(data.subarray(0, durValuePos));
        result.set(durationBytes, durValuePos);
        result.set(data.subarray(durValuePos + durSize.value), durValuePos + 8);

        // If size changed, we need to update size bytes (complex - skip for now)
        if (durSize.value !== 8) {
            console.warn('Duration size mismatch, returning original');
            return data;
        }

        return result;
    } else {
        // Insert Duration element into Info
        // Duration element: ID (2 bytes) + Size (1 byte for 8) + Value (8 bytes) = 11 bytes
        const durationElement = new Uint8Array(11);
        durationElement[0] = 0x44;  // Duration ID
        durationElement[1] = 0x89;
        durationElement[2] = 0x88;  // Size = 8 (with EBML size marker)
        durationElement.set(durationBytes, 3);

        // Create new buffer with inserted Duration
        const insertPos = infoHeaderEnd;
        const newData = new Uint8Array(data.length + 11);
        newData.set(data.subarray(0, insertPos));
        newData.set(durationElement, insertPos);
        newData.set(data.subarray(insertPos), insertPos + 11);

        // Update Info element size
        const oldInfoSize = infoSize.value;
        const newInfoSize = oldInfoSize + 11;
        const newSizeBytes = encodeEBMLSize(newInfoSize, infoSize.length);

        const sizePos = infoPos + SEGMENT_INFO_ID.length;
        for (let i = 0; i < infoSize.length; i++) {
            newData[sizePos + i] = newSizeBytes[i];
        }

        // Also need to update Segment size if it's not "unknown"
        // For simplicity, we'll leave Segment size as unknown (0x01FFFFFFFFFFFFFF)

        return newData;
    }
}

/**
 * Find EBML element by ID
 */
function findEBMLElement(data, elementId, start = 0, end = null) {
    end = end ?? data.length;
    for (let i = start; i <= end - elementId.length; i++) {
        let found = true;
        for (let j = 0; j < elementId.length; j++) {
            if (data[i + j] !== elementId[j]) {
                found = false;
                break;
            }
        }
        if (found) return i;
    }
    return -1;
}

/**
 * Skip EBML element header (ID + Size)
 */
function skipEBMLHeader(data, pos) {
    // Determine ID length (leading 1s followed by 0)
    let idLen = 1;
    let mask = 0x80;
    while (!(data[pos] & mask) && mask) {
        mask >>= 1;
        idLen++;
    }

    // Read size
    const sizeStart = pos + idLen;
    const size = readEBMLSize(data, sizeStart);

    return sizeStart + size.length;
}

/**
 * Read EBML variable-width size
 */
function readEBMLSize(data, pos) {
    const first = data[pos];
    let length = 1;
    let mask = 0x80;

    while (!(first & mask) && length < 8) {
        mask >>= 1;
        length++;
    }

    // Read value
    let value = first & (mask - 1);
    for (let i = 1; i < length; i++) {
        value = (value << 8) | data[pos + i];
    }

    return { value, length };
}

/**
 * Encode EBML variable-width size
 */
function encodeEBMLSize(value, minLength = 1) {
    let length = 1;
    let max = 0x7F;
    while (value > max && length < 8) {
        length++;
        max = (max << 7) | 0x7F;
    }
    length = Math.max(length, minLength);

    const result = new Uint8Array(length);
    for (let i = length - 1; i >= 0; i--) {
        result[i] = value & 0xFF;
        value >>= 8;
    }

    // Set length marker bit
    result[0] |= (0x80 >> (length - 1));

    return result;
}

/**
 * Read unsigned integer from bytes
 */
function readUnsignedInt(data, pos, length) {
    let value = 0;
    for (let i = 0; i < length; i++) {
        value = (value << 8) | data[pos + i];
    }
    return value;
}

/**
 * Encode float64 to bytes (big-endian)
 */
function encodeFloat64(value) {
    const buffer = new ArrayBuffer(8);
    const view = new DataView(buffer);
    view.setFloat64(0, value, false); // big-endian
    return new Uint8Array(buffer);
}

// ==========================================================================
// UTILITY FUNCTIONS
// ==========================================================================

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
