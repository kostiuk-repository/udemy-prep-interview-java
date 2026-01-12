/**
 * Telemetry - Structured Logging and Metrics
 * Lesson Builder System - Modular Architecture
 * 
 * High-value telemetry with structured JSON output.
 * Logs answer "WHY", not just "WHAT".
 */

// ==========================================================================
// LOG LEVELS
// ==========================================================================

export const LogLevel = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
    METRIC: 4
};

// ==========================================================================
// TELEMETRY CLASS
// ==========================================================================

/**
 * Logger - Structured telemetry for render and export operations
 */
class TelemetryLogger {
    constructor() {
        this.level = LogLevel.INFO;
        this.enabled = true;
        this.metrics = [];
        this.maxMetrics = 1000;
    }

    /**
     * Set minimum log level
     * @param {number} level - LogLevel value
     */
    setLevel(level) {
        this.level = level;
    }

    /**
     * Enable/disable logging
     * @param {boolean} enabled
     */
    setEnabled(enabled) {
        this.enabled = enabled;
    }

    /**
     * Log a debug message
     * @param {string} component - Component name (e.g., 'VisualEngine')
     * @param {string} message - Message
     * @param {Object} [data] - Additional context
     */
    debug(component, message, data = {}) {
        this._log(LogLevel.DEBUG, component, message, data);
    }

    /**
     * Log an info message
     * @param {string} component - Component name
     * @param {string} message - Message
     * @param {Object} [data] - Additional context
     */
    info(component, message, data = {}) {
        this._log(LogLevel.INFO, component, message, data);
    }

    /**
     * Log a warning
     * @param {string} component - Component name
     * @param {string} message - Message
     * @param {Object} [data] - Additional context
     */
    warn(component, message, data = {}) {
        this._log(LogLevel.WARN, component, message, data);
    }

    /**
     * Log an error
     * @param {string} component - Component name
     * @param {string} message - Message
     * @param {Object} [data] - Additional context
     */
    error(component, message, data = {}) {
        this._log(LogLevel.ERROR, component, message, data);
    }

    /**
     * Log a performance metric
     * @param {string} name - Metric name (e.g., 'RenderFrame', 'EncodeChunk')
     * @param {Object} data - Metric data
     */
    metric(name, data = {}) {
        if (!this.enabled) return;

        const entry = {
            type: 'metric',
            name,
            timestamp: performance.now(),
            data
        };

        this.metrics.push(entry);

        // Prevent unbounded growth
        if (this.metrics.length > this.maxMetrics) {
            this.metrics.shift();
        }

        if (this.level <= LogLevel.METRIC) {
            console.log(`[METRIC] ${name}`, JSON.stringify(data));
        }
    }

    /**
     * Log a state diff (for debugging object persistence)
     * @param {string} stepId - Step identifier
     * @param {Object} diff - { added: [], removed: [], changed: [] }
     */
    stateDiff(stepId, diff) {
        this._log(LogLevel.DEBUG, 'StateDiff', `Step: ${stepId}`, {
            added: diff.added?.map(o => o.id) || [],
            removed: diff.removed?.map(o => o.id) || [],
            changed: diff.changed?.map(o => ({ id: o.id, props: Object.keys(o.changedProps || {}) })) || []
        });
    }

    /**
     * Get collected metrics
     * @returns {Array} Collected metrics
     */
    getMetrics() {
        return [...this.metrics];
    }

    /**
     * Clear collected metrics
     */
    clearMetrics() {
        this.metrics = [];
    }

    /**
     * Get metrics summary
     * @returns {Object} Summary of collected metrics
     */
    getSummary() {
        const byName = {};
        for (const m of this.metrics) {
            if (!byName[m.name]) {
                byName[m.name] = { count: 0, samples: [] };
            }
            byName[m.name].count++;
            byName[m.name].samples.push(m.data);
        }
        return byName;
    }

    // Private logging method
    _log(level, component, message, data) {
        if (!this.enabled || level < this.level) return;

        const levelName = Object.keys(LogLevel).find(k => LogLevel[k] === level) || 'LOG';
        const timestamp = new Date().toISOString();

        const logEntry = {
            level: levelName,
            component,
            message,
            timestamp,
            ...data
        };

        const consoleMethod = level >= LogLevel.ERROR ? 'error'
            : level >= LogLevel.WARN ? 'warn'
                : level >= LogLevel.INFO ? 'info'
                    : 'log';

        console[consoleMethod](`[${levelName}] ${component}: ${message}`,
            Object.keys(data).length > 0 ? data : '');
    }
}

// ==========================================================================
// SINGLETON INSTANCE
// ==========================================================================

export const Logger = new TelemetryLogger();

// Re-export class for testing
export { TelemetryLogger };
