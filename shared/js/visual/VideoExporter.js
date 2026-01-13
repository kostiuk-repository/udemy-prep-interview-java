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
     * @param {number} [options.bitrate=50000000] - Video bitrate (50 Mbps default for 4K)
     */
    constructor(options = {}) {
        this.width = options.width ?? 3840;
        this.height = options.height ?? 2400;
        this.fps = options.fps ?? 60;
        this.bitrate = options.bitrate ?? 50000000;

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

        if (!scene || !scene.steps || scene.steps.length === 0) {
            console.error('VideoExporter: No scene or steps provided!');
            throw new Error('Invalid scene: no steps defined');
        }

        // Create canvas and renderer
        const canvas = document.createElement('canvas');
        canvas.width = this.width;
        canvas.height = this.height;

        // Attach canvas to DOM (required for captureStream)
        canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            opacity: 0;
            pointer-events: none;
            z-index: -1000;
        `;
        document.body.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Failed to get canvas 2D context');
        }

        // Engine and renderer setup
        const renderer = new CanvasRenderer(canvas, { scale: 1.0 });
        const engine = new StateBasedEngine({
            width: this.width,
            height: this.height,
            fps: this.fps
        });

        engine.loadScene(scene);
        renderer.setEngine(engine);
        engine.easingFn = (t) => t; // Linear for export

        const mimeType = 'video/webm; codecs=vp9';

        // DETERMINISTIC CAPTURE: captureStream(0) disables auto-capture
        // We manually call requestFrame() after each render
        const stream = canvas.captureStream(0);
        const videoTrack = stream.getVideoTracks()[0];

        console.log('Using deterministic capture with requestFrame()');

        const recorder = new MediaRecorder(stream, {
            mimeType: mimeType,
            videoBitsPerSecond: this.bitrate
        });

        const chunks = [];
        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunks.push(e.data);
        };

        // Calculate timing
        const animationFrames = engine.getTotalFrames();
        const totalFrames = animationFrames + holdFrames;
        const durationMs = (totalFrames / this.fps) * 1000;
        console.log('Frames:', animationFrames, '+ hold:', holdFrames, 'Total:', totalFrames, 'Duration:', durationMs.toFixed(0), 'ms');

        const recordingPromise = new Promise(resolve => {
            recorder.onstop = async () => {
                console.log('Recording complete. Chunks:', chunks.length);

                let blob = new Blob(chunks, { type: mimeType });

                // Fix WebM duration metadata
                try {
                    blob = await fixWebMDuration(blob, durationMs);
                } catch (err) {
                    console.warn('Duration fix failed:', err);
                }

                if (canvas.parentNode) {
                    canvas.parentNode.removeChild(canvas);
                }
                resolve(blob);
            };
        });

        // Start recording
        recorder.start();
        this.isRecording = true;

        // Small delay for recorder initialization
        await new Promise(r => setTimeout(r, 50));

        try {
            // Render each frame deterministically
            for (let frame = 0; frame < animationFrames; frame++) {
                if (!this.isRecording) break;

                // Compute state for this frame
                engine.seekToFrame(frame);
                const state = engine.getCurrentState();

                // NO logging during export - prevent console spam

                // Render to canvas
                renderer.render(state, { background: scene.background });

                // REQUEST FRAME - This is the key difference!
                // Push this exact frame to the video stream
                if (videoTrack.requestFrame) {
                    videoTrack.requestFrame();
                }

                // Small yield to prevent browser freeze (not for timing)
                if (frame % 10 === 0) {
                    await new Promise(r => setTimeout(r, 0));
                    if (onProgress) onProgress(frame + 1, totalFrames);
                }
            }

            // Hold on final frame
            const finalState = engine.getCurrentState();
            for (let h = 0; h < holdFrames; h++) {
                if (!this.isRecording) break;
                renderer.render(finalState, { background: scene.background });
                if (videoTrack.requestFrame) {
                    videoTrack.requestFrame();
                }
                if (h % 10 === 0) {
                    await new Promise(r => setTimeout(r, 0));
                    if (onProgress) onProgress(animationFrames + h + 1, totalFrames);
                }
            }

            console.log('Render complete, stopping recorder...');
            recorder.stop();

            const blob = await recordingPromise;
            console.log('=== VIDEO EXPORT COMPLETE ===');
            console.log('Final size:', (blob.size / 1024 / 1024).toFixed(2), 'MB');

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
 * Patch WebM EBML to include Duration (bounds-safe)
 * @param {Uint8Array} data - Original WebM data
 * @param {number} durationMs - Duration in milliseconds
 * @returns {Uint8Array} Patched data
 */
function patchWebMDuration(data, durationMs) {
    try {
        // EBML element IDs for WebM
        const SEGMENT_ID = [0x18, 0x53, 0x80, 0x67];         // Segment
        const SEGMENT_INFO_ID = [0x15, 0x49, 0xA9, 0x66];    // Info (inside Segment)
        const DURATION_ID = [0x44, 0x89];                    // Duration (inside Info)
        const TIMECODE_SCALE_ID = [0x2A, 0xD7, 0xB1];        // TimecodeScale

        // Helper: quick bounds check
        const inBounds = (idx) => idx >= 0 && idx <= data.length;

        // Find Segment element
        let pos = findEBMLElement(data, SEGMENT_ID, 0);
        if (pos === -1) return data;

        // Skip Segment header
        pos = skipEBMLHeader(data, pos);
        if (!inBounds(pos)) return data;

        // Find Info element within Segment
        const infoPos = findEBMLElement(data, SEGMENT_INFO_ID, pos);
        if (infoPos === -1) return data;

        // Get Info element size and content position
        const infoHeaderEnd = skipEBMLHeader(data, infoPos);
        const infoSize = readEBMLSize(data, infoPos + SEGMENT_INFO_ID.length);
        const infoEnd = infoHeaderEnd + infoSize.value;
        if (!inBounds(infoHeaderEnd) || !inBounds(infoEnd) || infoEnd > data.length) return data;

        // Get TimecodeScale (default 1000000 = 1ms precision)
        let timecodeScale = 1000000;
        const tcPos = findEBMLElement(data, TIMECODE_SCALE_ID, infoHeaderEnd, infoEnd);
        if (tcPos !== -1) {
            const tcHeaderEnd = skipEBMLHeader(data, tcPos);
            const tcSize = readEBMLSize(data, tcPos + TIMECODE_SCALE_ID.length);
            if (inBounds(tcHeaderEnd + tcSize.value)) {
                timecodeScale = readUnsignedInt(data, tcHeaderEnd, tcSize.value);
            }
        }

        // Calculate duration value (float64)
        const durationValue = (durationMs * 1000000) / timecodeScale;
        const durationBytes = encodeFloat64(durationValue);

        // Check if Duration already exists
        const existingDuration = findEBMLElement(data, DURATION_ID, infoHeaderEnd, infoEnd);
        if (existingDuration !== -1) {
            const durHeaderEnd = existingDuration + DURATION_ID.length;
            const durSize = readEBMLSize(data, durHeaderEnd);
            const durValuePos = durHeaderEnd + durSize.length;

            // Expect 8-byte float; if not, bail out safely
            if (durSize.value !== 8) return data;

            // Bounds checks for writes
            if (!inBounds(durValuePos + 8)) return data;

            const result = new Uint8Array(data.length);
            result.set(data.subarray(0, durValuePos), 0);
            result.set(durationBytes, durValuePos);
            result.set(data.subarray(durValuePos + 8), durValuePos + 8);
            return result;
        }

        // Insert new Duration element
        // Element: ID (2) + Size (1) + Value (8) = 11 bytes
        const durationElement = new Uint8Array(11);
        durationElement[0] = 0x44;
        durationElement[1] = 0x89;
        durationElement[2] = 0x88; // size = 8
        durationElement.set(durationBytes, 3);

        const insertPos = infoHeaderEnd;
        if (!inBounds(insertPos)) return data;

        const newData = new Uint8Array(data.length + 11);
        newData.set(data.subarray(0, insertPos), 0);
        newData.set(durationElement, insertPos);
        newData.set(data.subarray(insertPos), insertPos + 11);

        // Update Info size (keep same byte-length)
        const newInfoSize = infoSize.value + 11;
        const newSizeBytes = encodeEBMLSize(newInfoSize, infoSize.length);
        const sizePos = infoPos + SEGMENT_INFO_ID.length;
        if (inBounds(sizePos + infoSize.length)) {
            for (let i = 0; i < infoSize.length; i++) {
                newData[sizePos + i] = newSizeBytes[i];
            }
        }

        return newData;
    } catch (e) {
        console.warn('VideoExporter: Duration patch failed, returning original blob', e);
        return data;
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
