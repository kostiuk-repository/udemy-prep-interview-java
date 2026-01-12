/**
 * VideoEncoderService - Production-Grade WebCodecs Video Export
 * Lesson Builder System - Modular Architecture
 * 
 * Uses WebCodecs API (VideoEncoder) for deterministic frame-by-frame encoding.
 * Each frame has an explicit timestamp, independent of render time.
 * 
 * Features:
 * - Perfect 60 FPS (or configured rate)
 * - Exact duration (frame count × frame duration)
 * - No timing jitter from MediaRecorder
 * - VP9 codec for quality
 * 
 * Note: webm-muxer is required for containerization.
 * If not available, falls back to MediaRecorder with optimized settings.
 */

import { StateBasedEngine } from './VisualEngine.js';
import { CanvasRenderer } from './CanvasRenderer.js';
import { Logger } from './modules/Telemetry.js';

// ==========================================================================
// WEBCODECS VIDEO ENCODER SERVICE
// ==========================================================================

/**
 * VideoEncoderService - WebCodecs-based video export
 */
export class VideoEncoderService {
    /**
     * Create a VideoEncoderService
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
        this.frameDurationMicros = Math.round(1000000 / this.fps);

        this.isRecording = false;
        this.encoder = null;
        this.muxer = null;

        // Check WebCodecs support
        this.webCodecsSupported = typeof VideoEncoder !== 'undefined';

        Logger.info('VideoEncoderService', 'Initialized', {
            width: this.width,
            height: this.height,
            fps: this.fps,
            bitrate: this.bitrate,
            webCodecsSupported: this.webCodecsSupported
        });
    }

    /**
     * Check if WebCodecs is supported
     * @returns {boolean}
     */
    isSupported() {
        return this.webCodecsSupported;
    }

    /**
     * Render scene to video using WebCodecs
     * @param {Object} scene - Scene definition
     * @param {Object} options
     * @param {Function} [options.onProgress] - Progress callback (currentFrame, totalFrames)
     * @param {number} [options.holdFrames=30] - Frames to hold on final state
     * @returns {Promise<Blob>} WebM video blob
     */
    async renderVideo(scene, options = {}) {
        const { onProgress, holdFrames = 30 } = options;
        const startTime = performance.now();

        Logger.info('VideoEncoderService', 'Export started', {
            sceneId: scene?.id,
            stepsCount: scene?.steps?.length || 0,
            useWebCodecs: this.webCodecsSupported
        });

        if (!scene || !scene.steps || scene.steps.length === 0) {
            throw new Error('Invalid scene: no steps defined');
        }

        // Use fallback if WebCodecs not available
        if (!this.webCodecsSupported) {
            Logger.warn('VideoEncoderService', 'WebCodecs not supported, using MediaRecorder fallback');
            return this._renderWithMediaRecorder(scene, options);
        }

        // Create canvas and renderer
        const canvas = new OffscreenCanvas(this.width, this.height);
        const ctx = canvas.getContext('2d');

        const renderer = new CanvasRenderer(canvas, { scale: 1.0 });
        const engine = new StateBasedEngine({
            width: this.width,
            height: this.height,
            fps: this.fps
        });

        engine.loadScene(scene);
        renderer.setEngine(engine);
        engine.easingFn = (t) => t; // Linear for export

        const animationFrames = engine.getTotalFrames();
        const totalFrames = animationFrames + holdFrames;
        const durationMs = (totalFrames / this.fps) * 1000;

        Logger.info('VideoEncoderService', 'Frame calculation', {
            animationFrames,
            holdFrames,
            totalFrames,
            durationMs
        });

        // Check for webm-muxer
        let Muxer;
        try {
            // Dynamic import for webm-muxer
            const webmMuxer = await import('webm-muxer');
            Muxer = webmMuxer.Muxer || webmMuxer.default?.Muxer;
        } catch (e) {
            Logger.warn('VideoEncoderService', 'webm-muxer not found, using MediaRecorder fallback', { error: e.message });
            return this._renderWithMediaRecorder(scene, options);
        }

        if (!Muxer) {
            Logger.warn('VideoEncoderService', 'Muxer class not found in webm-muxer');
            return this._renderWithMediaRecorder(scene, options);
        }

        // Setup muxer
        const chunks = [];
        const muxer = new Muxer({
            target: {
                push: (chunk) => chunks.push(chunk),
                flush: () => { }
            },
            video: {
                codec: 'V_VP9',
                width: this.width,
                height: this.height,
                frameRate: this.fps
            },
            firstTimestampBehavior: 'offset'
        });

        // Setup encoder
        const encoder = new VideoEncoder({
            output: (chunk, meta) => {
                muxer.addVideoChunk(chunk, meta);
            },
            error: (e) => {
                Logger.error('VideoEncoderService', 'Encoder error', { error: e.message });
            }
        });

        const encoderConfig = {
            codec: 'vp09.00.10.08',
            width: this.width,
            height: this.height,
            bitrate: this.bitrate,
            framerate: this.fps
        };

        // Check if codec is supported
        const support = await VideoEncoder.isConfigSupported(encoderConfig);
        if (!support.supported) {
            Logger.warn('VideoEncoderService', 'VP9 not supported, trying VP8');
            encoderConfig.codec = 'vp8';
            const vp8Support = await VideoEncoder.isConfigSupported(encoderConfig);
            if (!vp8Support.supported) {
                Logger.error('VideoEncoderService', 'No supported codec found');
                return this._renderWithMediaRecorder(scene, options);
            }
        }

        encoder.configure(encoderConfig);
        this.isRecording = true;

        try {
            // Render animation frames
            for (let frame = 0; frame < animationFrames; frame++) {
                if (!this.isRecording) break;

                const frameStartTime = performance.now();

                engine.seekToFrame(frame);
                const state = engine.getCurrentState();
                renderer.render(state, { background: scene.background });

                // Create VideoFrame with explicit timestamp
                const timestamp = frame * this.frameDurationMicros;
                const videoFrame = new VideoFrame(canvas, {
                    timestamp,
                    duration: this.frameDurationMicros
                });

                // Encode with keyframe every 2 seconds
                const keyFrame = frame % (this.fps * 2) === 0;
                encoder.encode(videoFrame, { keyFrame });
                videoFrame.close();

                const renderTimeMs = performance.now() - frameStartTime;

                // Log metrics periodically
                if (frame % 60 === 0) {
                    Logger.metric('RenderFrame', {
                        frameIdx: frame,
                        renderTimeMs: renderTimeMs.toFixed(2),
                        timestamp
                    });
                    if (onProgress) onProgress(frame + 1, totalFrames);
                }
            }

            // Hold frames
            const finalState = engine.getCurrentState();
            for (let h = 0; h < holdFrames; h++) {
                if (!this.isRecording) break;

                renderer.render(finalState, { background: scene.background });

                const timestamp = (animationFrames + h) * this.frameDurationMicros;
                const videoFrame = new VideoFrame(canvas, {
                    timestamp,
                    duration: this.frameDurationMicros
                });

                encoder.encode(videoFrame, { keyFrame: false });
                videoFrame.close();

                if (h % 10 === 0 && onProgress) {
                    onProgress(animationFrames + h + 1, totalFrames);
                }
            }

            // Flush and finalize
            await encoder.flush();
            encoder.close();
            muxer.finalize();

            // Create blob from chunks
            const blob = new Blob(chunks, { type: 'video/webm' });

            const totalTimeMs = performance.now() - startTime;
            Logger.info('VideoEncoderService', 'Export complete', {
                totalTimeMs: totalTimeMs.toFixed(0),
                sizeBytes: blob.size,
                sizeMB: (blob.size / 1024 / 1024).toFixed(2)
            });

            return blob;

        } catch (error) {
            Logger.error('VideoEncoderService', 'Export failed', { error: error.message });
            encoder.close();
            throw error;
        } finally {
            this.isRecording = false;
        }
    }

    /**
     * Fallback: Render using MediaRecorder with optimized settings
     * @private
     */
    async _renderWithMediaRecorder(scene, options) {
        const { onProgress, holdFrames = 30 } = options;

        Logger.info('VideoEncoderService', 'Using MediaRecorder fallback');

        // Create visible canvas (required for captureStream)
        const canvas = document.createElement('canvas');
        canvas.width = this.width;
        canvas.height = this.height;
        canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            opacity: 0;
            pointer-events: none;
            z-index: -1000;
        `;
        document.body.appendChild(canvas);

        const renderer = new CanvasRenderer(canvas, { scale: 1.0 });
        const engine = new StateBasedEngine({
            width: this.width,
            height: this.height,
            fps: this.fps
        });

        engine.loadScene(scene);
        renderer.setEngine(engine);
        engine.easingFn = (t) => t;

        const animationFrames = engine.getTotalFrames();
        const totalFrames = animationFrames + holdFrames;
        const durationMs = (totalFrames / this.fps) * 1000;

        // Setup MediaRecorder with deterministic capture
        const stream = canvas.captureStream(0);
        const videoTrack = stream.getVideoTracks()[0];

        const recorder = new MediaRecorder(stream, {
            mimeType: 'video/webm; codecs=vp9',
            videoBitsPerSecond: this.bitrate
        });

        const chunks = [];
        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunks.push(e.data);
        };

        const recordingPromise = new Promise(resolve => {
            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'video/webm' });
                resolve(blob);
            };
        });

        recorder.start();
        this.isRecording = true;

        await new Promise(r => setTimeout(r, 50));

        try {
            // Render frames with minimal delay
            for (let frame = 0; frame < animationFrames; frame++) {
                if (!this.isRecording) break;

                engine.seekToFrame(frame);
                const state = engine.getCurrentState();
                renderer.render(state, { background: scene.background });

                if (videoTrack.requestFrame) {
                    videoTrack.requestFrame();
                }

                // Small delay for MediaRecorder to capture
                // This is the "magic number" that balances speed vs reliability
                await new Promise(r => setTimeout(r, 15));

                if (frame % 30 === 0 && onProgress) {
                    onProgress(frame + 1, totalFrames);
                }
            }

            // Hold frames
            const finalState = engine.getCurrentState();
            for (let h = 0; h < holdFrames; h++) {
                if (!this.isRecording) break;

                renderer.render(finalState, { background: scene.background });
                if (videoTrack.requestFrame) {
                    videoTrack.requestFrame();
                }
                await new Promise(r => setTimeout(r, 15));

                if (h % 10 === 0 && onProgress) {
                    onProgress(animationFrames + h + 1, totalFrames);
                }
            }

            recorder.stop();

            const blob = await recordingPromise;

            // Cleanup
            if (canvas.parentNode) {
                canvas.parentNode.removeChild(canvas);
            }

            Logger.info('VideoEncoderService', 'MediaRecorder export complete', {
                sizeMB: (blob.size / 1024 / 1024).toFixed(2)
            });

            return blob;

        } catch (error) {
            recorder.stop();
            if (canvas.parentNode) {
                canvas.parentNode.removeChild(canvas);
            }
            throw error;
        } finally {
            this.isRecording = false;
        }
    }

    /**
     * Cancel ongoing recording
     */
    cancel() {
        this.isRecording = false;
        if (this.encoder) {
            try {
                this.encoder.close();
            } catch (e) { }
        }
        Logger.info('VideoEncoderService', 'Recording cancelled');
    }
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
