/**
 * VideoService - Professional Video Export
 * Lesson Builder System
 * 
 * Clean video export using:
 * - VideoEncoder API (hardware-accelerated encoding)
 * - webm-muxer (proper WebM container creation)
 * - Deterministic frame-by-frame rendering
 * - GUARANTEED correct video duration
 * 
 * No MediaRecorder quirks, no Duration corruption.
 */

/**
 * VideoService - Export Konva scenes to WebM video
 */
export class VideoService {
    /**
     * Create a VideoService
     * @param {Object} [options]
     * @param {number} [options.width=3840] - Video width
     * @param {number} [options.height=2400] - Video height
     * @param {number} [options.fps=60] - Frames per second
     * @param {number} [options.bitrate=50000000] - Video bitrate (50 Mbps for 4K)
     */
    constructor(options = {}) {
        this.width = options.width ?? 3840;
        this.height = options.height ?? 2400;
        this.fps = options.fps ?? 60;
        this.bitrate = options.bitrate ?? 50_000_000;
        
        this.isExporting = false;
    }
    
    /**
     * Export scene to video
     * @param {import('../engine/StageManager.js').StageManager} stageManager - Stage manager
     * @param {import('../engine/SceneBuilder.js').SceneBuilder} sceneBuilder - Scene builder
     * @param {Object} options
     * @param {Function} [options.onProgress] - Progress callback (current, total)
     * @param {number} [options.holdFrames=30] - Frames to hold on final step
     * @returns {Promise<Blob>} WebM video blob
     */
    async export(stageManager, sceneBuilder, options = {}) {
        const { onProgress, holdFrames = 30 } = options;
        
        console.log('=== VIDEO EXPORT START ===');
        console.log('Engine: Konva.js + VideoEncoder + webm-muxer');
        
        // Check dependencies
        if (!window.WebmMuxer) {
            throw new Error('webm-muxer not loaded! Add it to index.html');
        }
        if (!window.VideoEncoder) {
            throw new Error('VideoEncoder API not supported in this browser');
        }
        
        this.isExporting = true;
        
        try {
            const totalSteps = sceneBuilder.getTotalSteps();
            const scene = sceneBuilder.scene;
            
            // Calculate frames
            const stepDuration = scene.duration ?? 1000; // ms per transition
            const framesPerTransition = Math.ceil((stepDuration / 1000) * this.fps);
            const animationFrames = framesPerTransition * (totalSteps - 1); // -1 because first step is instant
            const totalFrames = animationFrames + holdFrames;
            
            console.log(`Steps: ${totalSteps}`);
            console.log(`Frames: ${animationFrames} animation + ${holdFrames} hold = ${totalFrames} total`);
            console.log(`Duration: ${(totalFrames / this.fps).toFixed(2)}s @ ${this.fps}fps`);
            
            // Create offscreen stage for export
            const exportContainer = document.createElement('div');
            exportContainer.style.cssText = 'position: absolute; top: -10000px; left: -10000px;';
            document.body.appendChild(exportContainer);
            
            const { StageManager } = await import('../engine/StageManager.js');
            const { SceneBuilder: SceneBuilderClass } = await import('../engine/SceneBuilder.js');
            
            const exportStage = new StageManager(exportContainer, this.width, this.height, {
                scale: 1.0 // Full resolution
            });
            
            const exportScene = new SceneBuilderClass(exportStage);
            exportScene.build(scene);
            
            // Setup webm-muxer
            const { Muxer, ArrayBufferTarget } = window.WebmMuxer;
            
            const muxer = new Muxer({
                target: new ArrayBufferTarget(),
                video: {
                    codec: 'V_VP9',
                    width: this.width,
                    height: this.height,
                    frameRate: this.fps
                },
                fastStart: false
            });
            
            // Setup VideoEncoder
            const encoder = new VideoEncoder({
                output: (chunk, meta) => {
                    muxer.addVideoChunk(chunk, meta);
                },
                error: (e) => {
                    console.error('[VideoEncoder] Error:', e);
                    throw e;
                }
            });
            
            encoder.configure({
                codec: 'vp09.00.10.08', // VP9 Profile 0
                width: this.width,
                height: this.height,
                bitrate: this.bitrate,
                framerate: this.fps,
                latencyMode: 'quality',
                bitrateMode: 'constant'
            });
            
            console.log('=== FRAME GENERATION START ===');
            const startTime = performance.now();
            
            // MAIN EXPORT LOOP
            let currentStepIndex = 0;
            
            for (let i = 0; i < totalFrames; i++) {
                const isHoldPhase = i >= animationFrames;
                
                if (!isHoldPhase) {
                    // Calculate current step and progress
                    const stepProgress = i / framesPerTransition;
                    const newStepIndex = Math.floor(stepProgress);
                    const progressInStep = stepProgress - newStepIndex;
                    
                    // Transition to new step if needed
                    if (newStepIndex !== currentStepIndex) {
                        currentStepIndex = newStepIndex;
                        exportScene.goToStep(currentStepIndex, stepDuration);
                        console.log(`  Step ${currentStepIndex}/${totalSteps - 1} (frame ${i})`);
                    }
                    
                    // Update all active tweens to current progress
                    // Konva tweens run automatically, but we need to advance time manually
                    // This is done by seeking to specific frame time
                    const frameTime = progressInStep * stepDuration;
                    this.updateTweensToTime(exportScene, frameTime);
                    
                } else if (i === animationFrames) {
                    // Start hold phase - ensure on last step
                    exportScene.goToStep(totalSteps - 1, 0);
                    console.log(`  Hold phase: ${holdFrames} frames`);
                }
                
                // Draw current frame
                exportStage.draw();
                
                // Get canvas and convert to VideoFrame
                const canvas = exportStage.toCanvas({ scale: 1.0 });
                const frameBitmap = await createImageBitmap(canvas);
                
                const timestamp = Math.floor((i * 1_000_000) / this.fps);
                
                const videoFrame = new VideoFrame(frameBitmap, {
                    timestamp: timestamp,
                    duration: Math.floor(1_000_000 / this.fps)
                });
                
                // Encode (keyframe every 2 seconds)
                const isKeyframe = i % (this.fps * 2) === 0;
                encoder.encode(videoFrame, { keyFrame: isKeyframe });
                
                // Clean up
                videoFrame.close();
                frameBitmap.close();
                
                // Progress callback
                if (onProgress) {
                    onProgress(i + 1, totalFrames);
                }
                
                // Log progress
                if ((i + 1) % 30 === 0 || i === totalFrames - 1) {
                    const elapsed = performance.now() - startTime;
                    const avgFps = ((i + 1) / elapsed * 1000).toFixed(1);
                    console.log(`  Frame ${i + 1}/${totalFrames} (${avgFps} fps avg)`);
                }
            }
            
            console.log('=== ENCODING COMPLETE ===');
            
            // Finalize
            await encoder.flush();
            muxer.finalize();
            
            // Clean up export stage
            exportStage.destroy();
            document.body.removeChild(exportContainer);
            
            // Get blob
            const { buffer } = muxer.target;
            const blob = new Blob([buffer], { type: 'video/webm' });
            
            const totalTime = ((performance.now() - startTime) / 1000).toFixed(2);
            
            console.log('=== VIDEO EXPORT COMPLETE ===');
            console.log(`Time: ${totalTime}s`);
            console.log(`Size: ${(blob.size / 1024 / 1024).toFixed(2)} MB`);
            console.log(`Duration: ${(totalFrames / this.fps).toFixed(2)}s (GUARANTEED)`);
            
            encoder.close();
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
     * Update Konva tweens to specific time
     * @param {import('../engine/SceneBuilder.js').SceneBuilder} sceneBuilder
     * @param {number} time - Time in ms
     * @private
     */
    updateTweensToTime(sceneBuilder, time) {
        // Get all active tweens and seek them to current time
        for (const tween of sceneBuilder.tweens.values()) {
            if (tween) {
                const duration = tween.duration * 1000; // Convert to ms
                const progress = Math.min(time / duration, 1.0);
                tween.seek(progress);
            }
        }
    }
    
    /**
     * Download video blob as file
     * @param {Blob} blob - Video blob
     * @param {string} filename - Filename
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
     * Export and download
     * @param {import('../engine/StageManager.js').StageManager} stageManager
     * @param {import('../engine/SceneBuilder.js').SceneBuilder} sceneBuilder
     * @param {string} filename - Output filename
     * @param {Object} options - Export options
     * @returns {Promise<void>}
     */
    async exportAndDownload(stageManager, sceneBuilder, filename, options = {}) {
        const blob = await this.export(stageManager, sceneBuilder, options);
        this.downloadVideo(blob, filename);
    }
}
