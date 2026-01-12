/**
 * AudioPlayer Component - Collapsible Script with Audio Playback
 * Lesson Builder System
 */

import { EventBus, Events } from '../core/EventBus.js';

/**
 * AudioPlayer manager - handles multiple audio players
 */
const audioPlayers = new Map();

export const AudioPlayer = {
    /**
     * Initialize an AudioPlayer instance
     * @param {Object} config
     * @param {HTMLElement} config.container - Container element
     * @param {string} config.sectionId - Section identifier
     * @param {string} [config.scriptText] - Voice script text
     * @param {string} [config.audioFile] - Audio file path
     * @param {number} [config.wordCount] - Word count
     * @param {number} [config.estimatedDuration] - Estimated duration in seconds
     * @returns {Object} AudioPlayer instance
     */
    init(config) {
        const instance = {
            container: config.container,
            sectionId: config.sectionId,
            state: {
                scriptCollapsed: false,
                audioLoaded: false,
                duration: 0
            },
            elements: {}
        };

        // Render if container is empty
        if (!config.container.querySelector('.audio-header')) {
            this._render(instance, config);
        }

        // Cache elements
        instance.elements = {
            header: config.container.querySelector('.audio-header'),
            collapseIcon: config.container.querySelector('.collapse-icon'),
            scriptContent: config.container.querySelector('.script-content'),
            scriptText: config.container.querySelector('.script-text'),
            audio: config.container.querySelector('.audio-player'),
            durationDisplay: config.container.querySelector('[data-audio-duration]'),
            copyBtn: config.container.querySelector('[data-action="copy-script"]'),
            downloadBtn: config.container.querySelector('[data-action="download-audio"]')
        };

        // Bind events
        this._bindEvents(instance, config);

        // Store instance
        audioPlayers.set(config.sectionId, instance);

        return instance;
    },

    /**
     * Render audio player HTML
     * @private
     */
    _render(instance, config) {
        const wordCount = config.wordCount || this._countWords(config.scriptText);
        const duration = config.estimatedDuration || Math.ceil(wordCount / 2.5);

        instance.container.innerHTML = `
            <div class="audio-header" data-toggle="script">
                <h3>
                    <span class="collapse-icon">▼</span>
                    🎙️ Voice Script (${duration} seconds)
                </h3>
                <div class="audio-controls">
                    <button class="btn btn-primary" data-action="copy-script">📋 Copy</button>
                </div>
            </div>
            <div class="script-content" data-script-content>
                <div class="script-text" data-script-text>${config.scriptText || ''}</div>
                <div class="word-count">
                    Word count: ~${wordCount} | Estimated duration: ${duration} seconds
                </div>
            </div>
            <div class="audio-player-container">
                <audio class="audio-player" controls preload="metadata">
                    <source src="${config.audioFile || ''}" type="audio/mpeg">
                    Your browser does not support the audio element.
                </audio>
                <div class="audio-info">
                    <span data-audio-duration>Duration: --:--</span>
                    <button class="btn btn-success" data-action="download-audio">⬇ Download Audio</button>
                </div>
            </div>
        `;
    },

    /**
     * Bind event listeners
     * @private
     */
    _bindEvents(instance, config) {
        const { elements, sectionId } = instance;

        // Toggle script visibility
        if (elements.header) {
            elements.header.addEventListener('click', (e) => {
                // Ignore if clicking on buttons
                if (e.target.closest('button')) return;
                this.toggleScript(sectionId);
            });
        }

        // Copy script button
        if (elements.copyBtn) {
            elements.copyBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.copyScript(sectionId);
            });
        }

        // Download audio button
        if (elements.downloadBtn) {
            elements.downloadBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.downloadAudio(sectionId);
            });
        }

        // Audio metadata loaded
        if (elements.audio) {
            elements.audio.addEventListener('loadedmetadata', () => {
                instance.state.audioLoaded = true;
                instance.state.duration = elements.audio.duration;
                this._updateDurationDisplay(instance);
                EventBus.emit(Events.AUDIO_METADATA_LOADED, {
                    sectionId,
                    duration: elements.audio.duration
                });
            });

            // Audio playback started
            elements.audio.addEventListener('play', () => {
                EventBus.emit(Events.AUDIO_PLAYING, { sectionId });
            });

            // Audio ended
            elements.audio.addEventListener('ended', () => {
                EventBus.emit(Events.AUDIO_ENDED, { sectionId });
            });

            // Audio error
            elements.audio.addEventListener('error', () => {
                console.log(`AudioPlayer: Audio file not found for "${sectionId}". Generate using ElevenLabs.`);
            });
        }
    },

    /**
     * Update duration display
     * @private
     */
    _updateDurationDisplay(instance) {
        if (instance.elements.durationDisplay && instance.state.duration) {
            const minutes = Math.floor(instance.state.duration / 60);
            const seconds = Math.floor(instance.state.duration % 60);
            instance.elements.durationDisplay.textContent =
                `Duration: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    },

    /**
     * Count words in text
     * @private
     */
    _countWords(text) {
        if (!text) return 0;
        return text.trim().split(/\s+/).filter(word => word.length > 0).length;
    },

    /**
     * Toggle script visibility
     * @param {string} sectionId
     */
    toggleScript(sectionId) {
        const instance = audioPlayers.get(sectionId);
        if (!instance) return;

        instance.state.scriptCollapsed = !instance.state.scriptCollapsed;

        if (instance.elements.scriptContent) {
            instance.elements.scriptContent.classList.toggle('collapsed', instance.state.scriptCollapsed);
        }

        if (instance.elements.collapseIcon) {
            instance.elements.collapseIcon.classList.toggle('collapsed', instance.state.scriptCollapsed);
        }

        EventBus.emit(Events.AUDIO_SCRIPT_TOGGLED, {
            sectionId,
            collapsed: instance.state.scriptCollapsed
        });
    },

    /**
     * Play audio
     * @param {string} sectionId
     */
    play(sectionId) {
        const instance = audioPlayers.get(sectionId);
        if (instance?.elements.audio) {
            instance.elements.audio.play();
        }
    },

    /**
     * Pause audio
     * @param {string} sectionId
     */
    pause(sectionId) {
        const instance = audioPlayers.get(sectionId);
        if (instance?.elements.audio) {
            instance.elements.audio.pause();
        }
    },

    /**
     * Copy script to clipboard
     * @param {string} sectionId
     */
    async copyScript(sectionId) {
        const instance = audioPlayers.get(sectionId);
        if (!instance?.elements.scriptText) return;

        const text = instance.elements.scriptText.textContent;

        try {
            await navigator.clipboard.writeText(text);
            // Show feedback
            const copyBtn = instance.elements.copyBtn;
            if (copyBtn) {
                const originalText = copyBtn.textContent;
                copyBtn.textContent = '✅ Copied!';
                setTimeout(() => {
                    copyBtn.textContent = originalText;
                }, 2000);
            }
        } catch (error) {
            console.error('AudioPlayer: Failed to copy script:', error);
            // Fallback for older browsers
            this._fallbackCopy(text);
        }
    },

    /**
     * Fallback copy using textarea
     * @private
     */
    _fallbackCopy(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
    },

    /**
     * Download audio file
     * @param {string} sectionId
     */
    downloadAudio(sectionId) {
        const instance = audioPlayers.get(sectionId);
        if (!instance?.elements.audio) return;

        const source = instance.elements.audio.querySelector('source');
        if (!source?.src) {
            console.warn('AudioPlayer: No audio source available');
            return;
        }

        const a = document.createElement('a');
        a.href = source.src;
        a.download = `${sectionId}-voiceover.mp3`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    },

    /**
     * Get script text
     * @param {string} sectionId
     * @returns {string}
     */
    getScript(sectionId) {
        const instance = audioPlayers.get(sectionId);
        return instance?.elements.scriptText?.textContent || '';
    },

    /**
     * Get all scripts
     * @returns {Map<string, string>}
     */
    getAllScripts() {
        const scripts = new Map();
        audioPlayers.forEach((instance, sectionId) => {
            scripts.set(sectionId, this.getScript(sectionId));
        });
        return scripts;
    },

    /**
     * Destroy an audio player instance
     * @param {string} sectionId
     */
    destroy(sectionId) {
        const instance = audioPlayers.get(sectionId);
        if (instance) {
            if (instance.elements.audio) {
                instance.elements.audio.pause();
            }
            audioPlayers.delete(sectionId);
        }
    },

    /**
     * Destroy all audio player instances
     */
    destroyAll() {
        audioPlayers.forEach((_, sectionId) => {
            this.destroy(sectionId);
        });
    }
};
