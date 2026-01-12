/**
 * ExportManager - Handle All Export Functionality
 * Lesson Builder System
 */

import { EventBus, Events } from '../core/EventBus.js';
import { AudioPlayer } from './AudioPlayer.js';

class ExportManagerClass {
    constructor() {
        this.config = null;
        this.initialized = false;
    }

    /**
     * Initialize with lesson configuration
     * @param {Object} config - Lesson configuration
     */
    init(config) {
        this.config = config;
        this._setupEventListeners();
        this.initialized = true;
    }

    /**
     * Setup EventBus listeners
     * @private
     */
    _setupEventListeners() {
        EventBus.on(Events.EXPORT_SELECTED, ({ type }) => {
            switch (type) {
                case 'scripts':
                    this.exportScripts();
                    break;
                case 'production':
                    this.exportProduction();
                    break;
                case 'timing':
                    this.exportTiming();
                    break;
                case 'assets':
                case 'all':
                    this.exportAll();
                    break;
                default:
                    console.warn(`ExportManager: Unknown export type "${type}"`);
            }
        });
    }

    /**
     * Export all voice scripts as a text file
     */
    exportScripts() {
        if (!this.config) {
            console.error('ExportManager: Not initialized');
            return;
        }

        let content = `# Voice Scripts: ${this.config.title}\n`;
        content += `# Generated: ${new Date().toISOString()}\n`;
        content += `# Lesson ID: ${this.config.id}\n`;
        content += `${'='.repeat(60)}\n\n`;

        this.config.sections.forEach((section, index) => {
            content += `[${section.timing || 'N/A'}] ${section.title}\n`;
            content += `${'-'.repeat(40)}\n`;

            if (section.audio?.script) {
                content += `${section.audio.script}\n`;
                content += `\nWord count: ~${section.audio.wordCount || this._countWords(section.audio.script)}`;
                content += ` | Duration: ${section.audio.estimatedDuration || 30}s\n`;
            } else {
                content += '(No script available)\n';
            }

            content += `\n${'='.repeat(60)}\n\n`;
        });

        this._downloadFile(
            content,
            `${this.config.id}-scripts.txt`,
            'text/plain'
        );
    }

    /**
     * Export production guide as Markdown
     */
    exportProduction() {
        if (!this.config) {
            console.error('ExportManager: Not initialized');
            return;
        }

        let content = `# Production Guide: ${this.config.title}\n\n`;
        content += `**Lesson ID:** ${this.config.id}\n`;
        content += `**Type:** ${this.config.type || 'Standard'}\n`;
        content += `**Total Duration:** ${this._formatDuration(this.config.duration || 0)}\n`;
        content += `**Generated:** ${new Date().toLocaleString()}\n\n`;
        content += `---\n\n`;

        // Table of contents
        content += `## Table of Contents\n\n`;
        this.config.sections.forEach((section, index) => {
            content += `${index + 1}. [${section.title}](#section-${section.id})\n`;
        });
        content += `\n---\n\n`;

        // Sections
        this.config.sections.forEach((section, index) => {
            content += `## Section: ${section.title} (${section.timing || 'N/A'})\n\n`;
            content += `<a name="section-${section.id}"></a>\n\n`;

            if (section.description) {
                content += `**Purpose:** ${section.description}\n\n`;
            }

            if (section.production) {
                const p = section.production;

                if (p.pacing) {
                    content += `**Pacing:** ${p.pacing}\n\n`;
                }

                if (p.music) {
                    content += `**Music:** ${p.music}\n\n`;
                }

                if (p.broll && p.broll.length > 0) {
                    content += `**B-Roll:**\n`;
                    p.broll.forEach(item => {
                        content += `- ${item}\n`;
                    });
                    content += `\n`;
                }

                if (p.transitions) {
                    content += `**Transition:** ${p.transitions.type}`;
                    if (p.transitions.duration) {
                        content += ` (${p.transitions.duration}s)`;
                    }
                    content += `\n\n`;
                }
            }

            // Script preview
            if (section.audio?.script) {
                content += `### Script\n\n`;
                content += `\`\`\`\n${section.audio.script}\n\`\`\`\n\n`;
            }

            content += `---\n\n`;
        });

        // Deliverables checklist
        content += `## Deliverables Checklist\n\n`;
        content += `- [ ] All audio files recorded\n`;
        content += `- [ ] Visual assets exported\n`;
        content += `- [ ] B-roll footage collected\n`;
        content += `- [ ] Transitions applied\n`;
        content += `- [ ] Music synced\n`;
        content += `- [ ] Final review completed\n`;

        this._downloadFile(
            content,
            `${this.config.id}-production.md`,
            'text/markdown'
        );
    }

    /**
     * Export timing data as JSON
     */
    exportTiming() {
        if (!this.config) {
            console.error('ExportManager: Not initialized');
            return;
        }

        const timingData = {
            lessonId: this.config.id,
            title: this.config.title,
            type: this.config.type || 'standard',
            totalDuration: this.config.duration || 0,
            generatedAt: new Date().toISOString(),
            sections: this.config.sections.map(section => ({
                id: section.id,
                title: section.title,
                timing: section.timing || null,
                start: this._parseTimingStart(section.timing),
                end: this._parseTimingEnd(section.timing),
                duration: section.audio?.estimatedDuration || 0,
                audioFile: section.audio?.file || null,
                hasVisual: !!section.visual,
                visualSteps: section.visual?.steps || 0
            }))
        };

        this._downloadFile(
            JSON.stringify(timingData, null, 2),
            `${this.config.id}-timing.json`,
            'application/json'
        );
    }

    /**
     * Export all assets as a ZIP file
     * Note: Requires JSZip library for full functionality
     */
    async exportAll() {
        if (!this.config) {
            console.error('ExportManager: Not initialized');
            return;
        }

        // Check for JSZip
        if (typeof JSZip === 'undefined') {
            // Fallback: export files individually
            console.warn('ExportManager: JSZip not available, exporting files individually');
            this.exportScripts();
            setTimeout(() => this.exportProduction(), 500);
            setTimeout(() => this.exportTiming(), 1000);
            return;
        }

        try {
            const zip = new JSZip();

            // Add scripts
            const scriptsContent = this._generateScriptsContent();
            zip.file('scripts.txt', scriptsContent);

            // Add production guide
            const productionContent = this._generateProductionContent();
            zip.file('production.md', productionContent);

            // Add timing JSON
            const timingContent = this._generateTimingContent();
            zip.file('timing.json', timingContent);

            // Generate and download ZIP
            const blob = await zip.generateAsync({ type: 'blob' });
            this._downloadBlob(blob, `${this.config.id}-assets.zip`);

        } catch (error) {
            console.error('ExportManager: Failed to create ZIP:', error);
            // Fallback to individual exports
            this.exportScripts();
            this.exportProduction();
            this.exportTiming();
        }
    }

    /**
     * Generate scripts content (for ZIP)
     * @private
     */
    _generateScriptsContent() {
        let content = `Voice Scripts: ${this.config.title}\n`;
        content += `Generated: ${new Date().toISOString()}\n\n`;

        this.config.sections.forEach(section => {
            content += `[${section.timing || 'N/A'}] ${section.title}\n`;
            content += `${section.audio?.script || '(No script)'}\n\n`;
        });

        return content;
    }

    /**
     * Generate production content (for ZIP)
     * @private
     */
    _generateProductionContent() {
        // Reuse exportProduction logic but return string
        let content = `# Production Guide: ${this.config.title}\n\n`;
        // ... (similar to exportProduction)
        return content;
    }

    /**
     * Generate timing content (for ZIP)
     * @private
     */
    _generateTimingContent() {
        const data = {
            lessonId: this.config.id,
            sections: this.config.sections.map(s => ({
                id: s.id,
                title: s.title,
                timing: s.timing
            }))
        };
        return JSON.stringify(data, null, 2);
    }

    /**
     * Download a file with content
     * @private
     */
    _downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        this._downloadBlob(blob, filename);
    }

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
    }

    /**
     * Count words in text
     * @private
     */
    _countWords(text) {
        if (!text) return 0;
        return text.trim().split(/\s+/).filter(w => w.length > 0).length;
    }

    /**
     * Format duration in seconds to MM:SS
     * @private
     */
    _formatDuration(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * Parse timing string start (e.g., "00:30 - 01:30" -> "00:30")
     * @private
     */
    _parseTimingStart(timing) {
        if (!timing) return null;
        const match = timing.match(/^(\d{2}:\d{2})/);
        return match ? match[1] : null;
    }

    /**
     * Parse timing string end (e.g., "00:30 - 01:30" -> "01:30")
     * @private
     */
    _parseTimingEnd(timing) {
        if (!timing) return null;
        const match = timing.match(/(\d{2}:\d{2})$/);
        return match ? match[1] : null;
    }
}

// Create singleton instance
export const ExportManager = new ExportManagerClass();

// Also export the class
export { ExportManagerClass };
