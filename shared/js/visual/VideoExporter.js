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

        // Log first frame coordinates if DEBUG_COORDS is set
        const debugCoords = typeof window !== 'undefined' && window.DEBUG_COORDS === true;
        if (debugCoords) {
            console.log('=== DEBUG: First frame coordinates ===');
            engine.seekToFrame(0);
            const firstState = engine.getCurrentState();
            console.log('Objects:', firstState.length);
            firstState.forEach(obj => {
                const props = obj.props || {};
                console.log(`  ${obj.id}: x=${props.x}%, y=${props.y}%, opacity=${props.opacity ?? 1}`);
            });
            console.log('=====================================');
        }

        try {
            // Render each frame deterministically
            const exportStartTime = performance.now();
            let currentStep = -1;
            let stepStartTime = exportStartTime;
            let stepFrameCount = 0;
            let actualFramesRendered = 0;
            
            console.log('=== FRAME GENERATION START ===');
            
            for (let frame = 0; frame < animationFrames; frame++) {
                if (!this.isRecording) break;

                // Compute state for this frame
                engine.seekToFrame(frame);
                const state = engine.getCurrentState();
                
                // Track step changes
                if (engine.currentStepIndex !== currentStep) {
                    // Log previous step metrics
                    if (currentStep !== -1) {
                        const stepDuration = performance.now() - stepStartTime;
                        const avgFrameTime = stepDuration / stepFrameCount;
                        console.log(`  Step ${currentStep}: ${stepFrameCount} frames in ${stepDuration.toFixed(0)}ms (avg ${avgFrameTime.toFixed(1)}ms/frame)`);
                    }
                    
                    // Start new step
                    currentStep = engine.currentStepIndex;
                    stepStartTime = performance.now();
                    stepFrameCount = 0;
                    console.log(`Step ${currentStep} start (frame ${frame}/${animationFrames})`);
                }
                
                stepFrameCount++;
                actualFramesRendered++;

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
            
            // Log last step
            if (currentStep !== -1) {
                const stepDuration = performance.now() - stepStartTime;
                const avgFrameTime = stepDuration / stepFrameCount;
                console.log(`  Step ${currentStep}: ${stepFrameCount} frames in ${stepDuration.toFixed(0)}ms (avg ${avgFrameTime.toFixed(1)}ms/frame)`);
            }

            // Hold on final frame
            console.log('Rendering hold frames...');
            const holdStartTime = performance.now();
            const finalState = engine.getCurrentState();
            for (let h = 0; h < holdFrames; h++) {
                if (!this.isRecording) break;
                renderer.render(finalState, { background: scene.background });
                if (videoTrack.requestFrame) {
                    videoTrack.requestFrame();
                }
                actualFramesRendered++;
                if (h % 10 === 0) {
                    await new Promise(r => setTimeout(r, 0));
                    if (onProgress) onProgress(animationFrames + h + 1, totalFrames);
                }
            }
            const holdDuration = performance.now() - holdStartTime;
            console.log(`  Hold: ${holdFrames} frames in ${holdDuration.toFixed(0)}ms`);
            
            const totalExportTime = performance.now() - exportStartTime;
            const avgFPS = (actualFramesRendered / totalExportTime) * 1000;
            
            console.log('=== GENERATION COMPLETE ===');
            console.log(`Total frames rendered: ${actualFramesRendered}/${totalFrames}`);
            console.log(`Total time: ${(totalExportTime / 1000).toFixed(2)}s`);
            console.log(`Average FPS: ${avgFPS.toFixed(1)}`);

            console.log('Stopping recorder...');
            recorder.stop();

            const blob = await recordingPromise;
            console.log('=== VIDEO EXPORT COMPLETE ===');
            console.log('Final size:', (blob.size / 1024 / 1024).toFixed(2), 'MB');

            // Log WebM playback info
            console.log('=== VIDEO PLAYBACK INFO ===');
            console.log('Expected playback: 246 frames @ 60fps = 4.1 seconds');
            console.log('If video plays <1 second, WebM metadata may be corrupted');
            console.log('Check browser developer tools > Inspector > Video properties for actual framerate');

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

    // Log WebM info BEFORE patching
    console.log('=== WEBM CONTAINER INFO ===');
    console.log('Blob size:', (blob.size / 1024).toFixed(1), 'KB');
    console.log('Expected duration:', durationMs, 'ms');
    logWebMInfo(data);

    // Find the Segment Info element and patch duration
    const fixed = patchWebMDuration(data, durationMs);

    return new Blob([fixed], { type: 'video/webm' });
}

/**
 * Log WebM container information
 */
function logWebMInfo(data) {
    const SEGMENT_INFO_ID = [0x15, 0x49, 0xA9, 0x66];
    const DURATION_ID = [0x44, 0x89];
    const TIMECODE_SCALE_ID = [0x2A, 0xD7, 0xB1];
    const CLUSTER_ID = [0x1F, 0x43, 0xB6, 0x75];
    const SIMPLE_BLOCK_ID = [0xA3];

    try {
        console.log('  Searching for Info element...');
        
        // Find Info element
        let infoPos = findEBMLElement(data, SEGMENT_INFO_ID, 0);
        if (infoPos === -1) {
            console.log('  ⚠️ Info element not found at all!');
            return;
        }
        console.log(`  Info element found at byte ${infoPos}`);

        const infoHeaderEnd = skipEBMLHeader(data, infoPos);
        const infoSize = readEBMLSize(data, infoPos + SEGMENT_INFO_ID.length);
        const infoEnd = infoHeaderEnd + infoSize.value;
        console.log(`  Info size: ${infoSize.value} bytes, content: ${infoHeaderEnd}-${infoEnd}`);

        // Get TimecodeScale
        let timecodeScale = 1000000;
        const tcPos = findEBMLElement(data, TIMECODE_SCALE_ID, infoHeaderEnd, infoEnd);
        if (tcPos !== -1) {
            const tcHeaderEnd = skipEBMLHeader(data, tcPos);
            const tcSize = readEBMLSize(data, tcPos + TIMECODE_SCALE_ID.length);
            timecodeScale = readUnsignedInt(data, tcHeaderEnd, tcSize.value);
            console.log(`  TimecodeScale: ${timecodeScale} (1 unit = ${timecodeScale/1000000} ms)`);
        } else {
            console.log('  TimecodeScale not found, using default 1000000');
        }

        // Get existing Duration
        console.log('  Searching for Duration element...');
        const durPos = findEBMLElement(data, DURATION_ID, infoHeaderEnd, infoEnd);
        if (durPos !== -1) {
            console.log(`  Duration element found at byte ${durPos}`);
            const durHeaderEnd = durPos + DURATION_ID.length;
            const durSize = readEBMLSize(data, durHeaderEnd);
            console.log(`  Duration size field: ${durSize.value} bytes`);
            
            const durValuePos = durHeaderEnd + durSize.length;
            if (durSize.value === 8) {
                const durationValue = readFloat64(data, durValuePos);
                const durationMs = (durationValue * timecodeScale) / 1000000;
                console.log(`  ✓ Duration: ${durationValue.toFixed(1)} units = ${durationMs.toFixed(0)}ms (${(durationMs/1000).toFixed(2)}s playback)`);
            } else {
                console.log(`  ⚠️ Duration size is ${durSize.value}, expected 8 bytes`);
            }
        } else {
            console.log('  ⚠️ Duration element NOT FOUND in Info - will need to be patched');
        }

        // Count blocks in first Cluster
        console.log('  Searching for Cluster...');
        const clusterPos = findEBMLElement(data, CLUSTER_ID, infoEnd);
        if (clusterPos === -1) {
            console.log('  ⚠️ No Cluster found');
            return;
        }
        
        console.log(`  Cluster found at byte ${clusterPos}`);
        const clusterHeaderEnd = skipEBMLHeader(data, clusterPos);
        const clusterSize = readEBMLSize(data, clusterPos + CLUSTER_ID.length);
        const clusterEnd = clusterHeaderEnd + clusterSize.value;
        
        let blockCount = 0;
        let blockPos = clusterHeaderEnd;
        const maxTimecode = [];
        
        while (blockPos < clusterEnd && blockCount < 5) {
            const block = findEBMLElement(data, SIMPLE_BLOCK_ID, blockPos, clusterEnd);
            if (block === -1) break;
            blockCount++;
            
            // Extract timestamp from SimpleBlock
            const blockHeaderEnd = block + SIMPLE_BLOCK_ID.length;
            const blockSize = readEBMLSize(data, blockHeaderEnd);
            const timecodeStart = blockHeaderEnd + blockSize.length;
            
            if (timecodeStart + 2 < clusterEnd) {
                const tc = (data[timecodeStart] << 8) | data[timecodeStart + 1];
                const tcMs = (tc * timecodeScale) / 1000000;
                maxTimecode.push(tcMs);
            }
            
            blockPos = block + 1;
        }
        
        if (blockCount > 0) {
            console.log(`  First cluster: ${blockCount} blocks, timecodes: ${maxTimecode.map(t => t.toFixed(0)).join(', ')}ms`);
            if (maxTimecode.length >= 2) {
                const frameInterval = maxTimecode[1] - maxTimecode[0];
                const detectedFPS = 1000 / frameInterval;
                console.log(`  Detected framerate from blocks: ~${detectedFPS.toFixed(1)} fps`);
            }
        } else {
            console.log('  ⚠️ No SimpleBlocks found in Cluster');
        }
    } catch (e) {
        console.log('  ❌ WebM info parse error:', e.message);
        console.log('     Stack:', e.stack);
    }
}

/**
 * Patch WebM EBML to include Duration (bounds-safe)
 * @param {Uint8Array} data - Original WebM data
 * @param {number} durationMs - Duration in milliseconds
 * @returns {Uint8Array} Patched data
 */
function patchWebMDuration(data, durationMs) {
    try {
        console.log('  [PATCH] Starting WebM duration patch...');
        
        // EBML element IDs for WebM
        const SEGMENT_ID = [0x18, 0x53, 0x80, 0x67];         // Segment
        const SEGMENT_INFO_ID = [0x15, 0x49, 0xA9, 0x66];    // Info (inside Segment)
        const DURATION_ID = [0x44, 0x89];                    // Duration (inside Info)
        const TIMECODE_SCALE_ID = [0x2A, 0xD7, 0xB1];        // TimecodeScale

        // Helper: quick bounds check
        const inBounds = (idx) => idx >= 0 && idx <= data.length;

        // Find Segment element
        let pos = findEBMLElement(data, SEGMENT_ID, 0);
        console.log(`  [PATCH] Segment found at: ${pos}`);
        if (pos === -1) return data;

        // Skip Segment header
        pos = skipEBMLHeader(data, pos);
        if (!inBounds(pos)) {
            console.log('  [PATCH] Position after Segment header out of bounds');
            return data;
        }

        // Find Info element within Segment
        const infoPos = findEBMLElement(data, SEGMENT_INFO_ID, pos);
        console.log(`  [PATCH] Info element found at: ${infoPos}`);
        if (infoPos === -1) return data;

        // Get Info element size and content position
        const infoHeaderEnd = skipEBMLHeader(data, infoPos);
        const infoSize = readEBMLSize(data, infoPos + SEGMENT_INFO_ID.length);
        const infoEnd = infoHeaderEnd + infoSize.value;
        console.log(`  [PATCH] Info content: ${infoHeaderEnd} to ${infoEnd}`);
        if (!inBounds(infoHeaderEnd) || !inBounds(infoEnd) || infoEnd > data.length) {
            console.log('  [PATCH] Info bounds check failed');
            return data;
        }

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
        console.log(`  [PATCH] TimecodeScale: ${timecodeScale}, durationMs: ${durationMs}`);

        // Calculate duration value (float64)
        const durationValue = (durationMs * 1000000) / timecodeScale;
        console.log(`  [PATCH] Calculated duration value: ${durationValue.toFixed(1)}`);
        const durationBytes = encodeFloat64(durationValue);

        // Check if Duration already exists
        const existingDuration = findEBMLElement(data, DURATION_ID, infoHeaderEnd, infoEnd);
        if (existingDuration !== -1) {
            console.log(`  [PATCH] Found existing Duration element at ${existingDuration}, replacing...`);
            const durHeaderEnd = existingDuration + DURATION_ID.length;
            const durSize = readEBMLSize(data, durHeaderEnd);
            const durValuePos = durHeaderEnd + durSize.length;

            console.log(`  [PATCH] Existing Duration: size=${durSize.value} bytes, value position=${durValuePos}`);

            // If it's 8 bytes (float64), replace in-place
            if (durSize.value === 8) {
                console.log(`  [PATCH] Duration is 8-byte float64, replacing in-place...`);
                if (!inBounds(durValuePos + 8)) {
                    console.log('  [PATCH] Duration value position out of bounds');
                    return data;
                }
                const result = new Uint8Array(data.length);
                result.set(data.subarray(0, durValuePos), 0);
                result.set(durationBytes, durValuePos);
                result.set(data.subarray(durValuePos + 8), durValuePos + 8);
                console.log(`  [PATCH] ✓ Duration value replaced (8 bytes)`);
                return result;
            }

            // If it's 4 bytes (float32), need to remove old and insert new 8-byte version
            if (durSize.value === 4) {
                console.log(`  [PATCH] Duration is 4-byte float32, removing old and inserting 8-byte version...`);
                
                // Remove old Duration element (ID + Size + Value)
                const oldElementSize = DURATION_ID.length + durSize.length + durSize.value;
                const removeStart = existingDuration;
                const removeEnd = removeStart + oldElementSize;

                // Create new 8-byte Duration element
                const newDurationElement = new Uint8Array(11); // ID(2) + Size(1) + Value(8)
                newDurationElement[0] = 0x44;
                newDurationElement[1] = 0x89;
                newDurationElement[2] = 0x88; // size = 8
                newDurationElement.set(durationBytes, 3);

                // Rebuild data: before old + new element + after old
                const newData = new Uint8Array(data.length - oldElementSize + 11);
                newData.set(data.subarray(0, removeStart), 0);
                newData.set(newDurationElement, removeStart);
                newData.set(data.subarray(removeEnd), removeStart + 11);

                // Update Info size
                const newInfoSize = infoSize.value - oldElementSize + 11;
                const newSizeBytes = encodeEBMLSize(newInfoSize, infoSize.length);
                const sizePos = infoPos + SEGMENT_INFO_ID.length;
                if (inBounds(sizePos + infoSize.length)) {
                    for (let i = 0; i < infoSize.length; i++) {
                        newData[sizePos + i] = newSizeBytes[i];
                    }
                    console.log(`  [PATCH] ✓ Duration element replaced (4→8 bytes, size adjusted)`);
                }

                return newData;
            }

            // Unsupported size
            console.log(`  [PATCH] ⚠️ Duration size ${durSize.value} not supported, skipping`);
            return data;
        }

        // Insert new Duration element
        console.log('  [PATCH] Duration element not found, inserting new one...');
        // Element: ID (2) + Size (1) + Value (8) = 11 bytes
        const durationElement = new Uint8Array(11);
        durationElement[0] = 0x44;
        durationElement[1] = 0x89;
        durationElement[2] = 0x88; // size = 8
        durationElement.set(durationBytes, 3);

        const insertPos = infoHeaderEnd;
        if (!inBounds(insertPos)) {
            console.log('  [PATCH] Insert position out of bounds');
            return data;
        }

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
            console.log(`  [PATCH] ✓ Duration element inserted (${newData.length - data.length} bytes added)`);
        }

        return newData;
    } catch (e) {
        console.warn('VideoExporter: Duration patch failed, returning original blob', e);
        console.warn('  Error details:', e.message);
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

/**
 * Read float64 value from bytes (big-endian)
 */
function readFloat64(data, pos) {
    const buffer = new ArrayBuffer(8);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < 8; i++) {
        view[i] = data[pos + i];
    }
    return new DataView(buffer).getFloat64(0, false); // big-endian
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
