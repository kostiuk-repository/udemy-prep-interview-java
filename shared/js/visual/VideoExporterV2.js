/**
 * VideoExporterV2 - Professional WebM Export using webm-muxer
 * Lesson Builder System
 * 
 * Replaces MediaRecorder with direct WebM muxing for:
 * - GUARANTEED correct video duration (not dependent on recording speed)
 * - Deterministic frame-by-frame rendering
 * - No Duration metadata corruption
 * - No reliance on browser MediaRecorder quirks
 * 
 * Uses:
 * - WebCodecs VideoEncoder API for encoding
 * - webm-muxer for container creation
 * - Synchronous frame loop (not realtime)
 */

import { StateBasedEngine } from './VisualEngine.js';
import { KonvaRenderer } from './KonvaRenderer.js';

/**
 * VideoExporterV2 - Export animations to WebM using webm-muxer
 */
export class VideoExporterV2 {
    /**
     * Create a VideoExporterV2
     * @param {Object} options
     * @param {number} [options.width=3840] - Video width (4K)
     * @param {number} [options.height=2400] - Video height (4K 16:10)
     * @param {number} [options.fps=60] - Frames per second
     * @param {number} [options.bitrate=50000000] - Video bitrate (50 Mbps for 4K)
     */
    constructor(options = {}) {
        this.width = options.width ?? 3840;
        this.height = options.height ?? 2400;
        this.fps = options.fps ?? 60;
        this.bitrate = options.bitrate ?? 50_000_000; // 50 Mbps
        
        // State
        this.isExporting = false;
    }
    
    /**
     * Render entire scene to WebM video with GUARANTEED duration
     * @param {Object} scene - Scene definition
     * @param {Object} options
     * @param {Function} [options.onProgress] - Progress callback (currentFrame, totalFrames)
     * @param {number} [options.holdFrames=30] - Frames to hold on final step
     * @returns {Promise<Blob>} WebM video blob with perfect duration
     */
    async renderVideo(scene, options = {}) {
        const { onProgress, holdFrames = 30 } = options;
        
        console.log('=== VIDEO EXPORT V2 START ===');
        console.log('Scene:', scene?.id || 'unknown');
        console.log('Using: Konva + webm-muxer + VideoEncoder');
        
        if (!scene || !scene.steps || scene.steps.length === 0) {
            console.error('VideoExporterV2: No scene or steps provided!');
            throw new Error('Invalid scene: no steps defined');
        }
        
        // Check for webm-muxer availability
        if (!window.WebmMuxer) {
            throw new Error('webm-muxer not loaded! Add it to index.html');
        }
        
        // Check for VideoEncoder API
        if (!window.VideoEncoder) {
            throw new Error('VideoEncoder API not supported in this browser');
        }
        
        this.isExporting = true;
        
        try {
            // Create offscreen canvas for rendering
            const canvas = new OffscreenCanvas(this.width, this.height);
            
            // Create Konva renderer
            const renderer = new KonvaRenderer(canvas, {
                scale: 1.0,
                width: this.width,
                height: this.height
            });
            
            // Create animation engine
            const engine = new StateBasedEngine({
                width: this.width,
                height: this.height,
                fps: this.fps
            });
            
            engine.loadScene(scene);
            renderer.setEngine(engine);
            engine.easingFn = (t) => t; // Linear for export
            
            // Calculate total frames
            const framesPerStep = Math.ceil((engine.animationDuration / 1000) * this.fps);
            const animationFrames = framesPerStep * (scene.steps.length - 1);
            const totalFrames = animationFrames + holdFrames;
            
            console.log(`Frames: ${animationFrames} animation + ${holdFrames} hold = ${totalFrames} total`);
            console.log(`Duration: ${(totalFrames / this.fps * 1000).toFixed(0)} ms @ ${this.fps}fps`);
            
            // Setup webm-muxer
            const { Muxer, ArrayBufferTarget } = window.WebmMuxer;
            
            let muxer = new Muxer({
                target: new ArrayBufferTarget(),
                video: {
                    codec: 'V_VP9',
                    width: this.width,
                    height: this.height,
                    frameRate: this.fps
                },
                fastStart: false // Sequential writing
            });
            
            // Setup VideoEncoder
            const chunks = [];
            
            let videoEncoder = new VideoEncoder({
                output: (chunk, meta) => {
                    muxer.addVideoChunk(chunk, meta);
                    chunks.push(chunk);
                },
                error: (e) => {
                    console.error('[VideoEncoder] Error:', e);
                    throw e;
                }
            });
            
            videoEncoder.configure({
                codec: 'vp09.00.10.08', // VP9 Profile 0
                width: this.width,
                height: this.height,
                bitrate: this.bitrate,
                framerate: this.fps,
                latencyMode: 'quality', // Best quality, not realtime
                bitrateMode: 'constant'
            });
            
            console.log('=== FRAME GENERATION START ===');
            const startTime = performance.now();
            
            let currentStepIndex = 0;
            let frameCount = 0;
            
            // MAIN LOOP: Render frames synchronously, encode asynchronously
            for (let i = 0; i < totalFrames; i++) {
                // Calculate which step we're on
                const isHoldPhase = i >= animationFrames;
                
                if (!isHoldPhase) {
                    currentStepIndex = Math.floor(i / framesPerStep);
                    const frameInStep = i % framesPerStep;
                    const progress = frameInStep / framesPerStep;
                    
                    // Update engine to this exact frame
                    if (frameInStep === 0 && currentStepIndex < scene.steps.length) {
                        console.log(`Step ${currentStepIndex} start (frame ${i}/${totalFrames})`);
                        engine.jumpToStep(currentStepIndex);
                    }
                    
                    // Set animation progress manually
                    engine.animationProgress = progress;
                    engine.updateInterpolation();
                } else {
                    // Hold on last frame
                    if (i === animationFrames) {
                        console.log(`Hold phase: ${holdFrames} frames`);
                        engine.jumpToStep(scene.steps.length - 1);
                        engine.animationProgress = 1.0;
                        engine.updateInterpolation();
                    }
                }
                
                // Render current frame to canvas
                const state = engine.getCurrentState();
                renderer.render(state, scene.background ?? '#0a0a0a');
                
                // Convert canvas to VideoFrame
                const frameBitmap = await createImageBitmap(canvas);
                
                // Calculate exact timestamp in microseconds
                const timestamp = Math.floor((i * 1_000_000) / this.fps);
                
                const videoFrame = new VideoFrame(frameBitmap, {
                    timestamp: timestamp,
                    duration: Math.floor(1_000_000 / this.fps) // Frame duration in microseconds
                });
                
                // Encode frame (keyframe every 2 seconds)
                const isKeyframe = i % (this.fps * 2) === 0;
                videoEncoder.encode(videoFrame, { keyFrame: isKeyframe });
                
                // Clean up
                videoFrame.close();
                frameBitmap.close();
                
                frameCount++;
                
                // Report progress
                if (onProgress) {
                    onProgress(i + 1, totalFrames);
                }
                
                // Log progress every 30 frames
                if ((i + 1) % 30 === 0 || i === totalFrames - 1) {
                    const elapsed = performance.now() - startTime;
                    const avgFps = ((i + 1) / elapsed * 1000).toFixed(1);
                    console.log(`  Frame ${i + 1}/${totalFrames} (${avgFps} fps avg)`);
                }
            }
            
            console.log('=== ENCODING COMPLETE ===');
            console.log(`Rendered ${frameCount} frames`);
            
            // Flush encoder and finalize muxer
            console.log('Flushing encoder...');
            await videoEncoder.flush();
            
            console.log('Finalizing WebM container...');
            muxer.finalize();
            
            // Get final WebM data
            const { buffer } = muxer.target;
            const blob = new Blob([buffer], { type: 'video/webm' });
            
            const totalTime = ((performance.now() - startTime) / 1000).toFixed(2);
            const avgFps = (frameCount / totalTime).toFixed(1);
            
            console.log('=== VIDEO EXPORT COMPLETE ===');
            console.log(`Total time: ${totalTime}s`);
            console.log(`Average FPS: ${avgFps}`);
            console.log(`File size: ${(blob.size / 1024 / 1024).toFixed(2)} MB`);
            console.log(`Video duration: ${(totalFrames / this.fps).toFixed(2)}s (GUARANTEED)`);
            
            // Clean up
            videoEncoder.close();
            renderer.destroy();
            
            this.isExporting = false;
            
            return blob;
            
        } catch (error) {
            this.isExporting = false;
            console.error('=== VIDEO EXPORT FAILED ===');
            console.error(error);
            throw error;
        }
    }
    
    /**
     * Download video blob as file
     * @param {Blob} blob - Video blob
     * @param {string} filename - Output filename
     */
    downloadVideo(blob, filename = 'video.webm') {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }
    
    /**
     * Export scene and download as file
     * @param {Object} scene - Scene definition
     * @param {string} filename - Output filename
     * @param {Object} options - Export options
     * @returns {Promise<void>}
     */
    async exportAndDownload(scene, filename, options = {}) {
        console.log(`Exporting "${scene?.id || 'scene'}" to ${filename}...`);
        
        const blob = await this.renderVideo(scene, options);
        this.downloadVideo(blob, filename);
        
        console.log('Download complete!');
    }
}
