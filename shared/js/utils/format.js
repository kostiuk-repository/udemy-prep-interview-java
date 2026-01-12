/**
 * Format Utilities - Time, Word Count, Duration
 * Lesson Builder System
 */

/**
 * Format seconds as MM:SS
 * @param {number} seconds - Total seconds
 * @returns {string} Formatted time (e.g., "01:30")
 */
export function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format seconds as H:MM:SS (for longer durations)
 * @param {number} seconds - Total seconds
 * @returns {string} Formatted time (e.g., "1:05:30")
 */
export function formatTimeWithHours(seconds) {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
        return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return formatTime(seconds);
}

/**
 * Parse time string to seconds
 * @param {string} timeStr - Time string (e.g., "01:30" or "1:05:30")
 * @returns {number} Total seconds
 */
export function parseTime(timeStr) {
    if (!timeStr) return 0;

    const parts = timeStr.split(':').map(Number);

    if (parts.length === 3) {
        // H:MM:SS
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
        // MM:SS
        return parts[0] * 60 + parts[1];
    } else if (parts.length === 1) {
        // Just seconds
        return parts[0];
    }

    return 0;
}

/**
 * Count words in text
 * @param {string} text - Text to count
 * @returns {number} Word count
 */
export function wordCount(text) {
    if (!text || typeof text !== 'string') return 0;
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Estimate speaking duration from word count
 * Average speaking rate: ~150 words per minute (2.5 words per second)
 * @param {string|number} textOrWordCount - Text string or word count
 * @param {number} [wordsPerMinute=150] - Speaking rate
 * @returns {number} Estimated duration in seconds
 */
export function estimateDuration(textOrWordCount, wordsPerMinute = 150) {
    const count = typeof textOrWordCount === 'string'
        ? wordCount(textOrWordCount)
        : textOrWordCount;

    return Math.ceil((count / wordsPerMinute) * 60);
}

/**
 * Estimate word count from duration
 * @param {number} seconds - Duration in seconds
 * @param {number} [wordsPerMinute=150] - Speaking rate
 * @returns {number} Estimated word count
 */
export function estimateWordCount(seconds, wordsPerMinute = 150) {
    return Math.round((seconds / 60) * wordsPerMinute);
}

/**
 * Format duration as human-readable string
 * @param {number} seconds - Duration in seconds
 * @returns {string} (e.g., "2 minutes 30 seconds" or "1 hour 5 minutes")
 */
export function formatDurationHuman(seconds) {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const parts = [];

    if (hours > 0) {
        parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
    }
    if (mins > 0) {
        parts.push(`${mins} minute${mins !== 1 ? 's' : ''}`);
    }
    if (secs > 0 && hours === 0) {
        parts.push(`${secs} second${secs !== 1 ? 's' : ''}`);
    }

    if (parts.length === 0) {
        return '0 seconds';
    }

    return parts.join(' ');
}

/**
 * Format number with thousand separators
 * @param {number} num - Number to format
 * @param {string} [locale='en-US'] - Locale for formatting
 * @returns {string}
 */
export function formatNumber(num, locale = 'en-US') {
    return new Intl.NumberFormat(locale).format(num);
}

/**
 * Format bytes as human-readable size
 * @param {number} bytes - Bytes to format
 * @param {number} [decimals=2] - Decimal places
 * @returns {string} (e.g., "1.5 MB")
 */
export function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

/**
 * Format date as ISO date string (YYYY-MM-DD)
 * @param {Date} date
 * @returns {string}
 */
export function formatDate(date) {
    return date.toISOString().split('T')[0];
}

/**
 * Format date and time as locale string
 * @param {Date} date
 * @param {string} [locale='en-US']
 * @returns {string}
 */
export function formatDateTime(date, locale = 'en-US') {
    return date.toLocaleString(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Truncate text to specified length with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @param {string} [suffix='...'] - Suffix to add
 * @returns {string}
 */
export function truncate(text, maxLength, suffix = '...') {
    if (!text || text.length <= maxLength) return text;
    return text.slice(0, maxLength - suffix.length) + suffix;
}

/**
 * Truncate text by word count
 * @param {string} text - Text to truncate
 * @param {number} maxWords - Maximum words
 * @param {string} [suffix='...'] - Suffix to add
 * @returns {string}
 */
export function truncateWords(text, maxWords, suffix = '...') {
    if (!text) return text;

    const words = text.trim().split(/\s+/);
    if (words.length <= maxWords) return text;

    return words.slice(0, maxWords).join(' ') + suffix;
}

/**
 * Capitalize first letter of string
 * @param {string} str
 * @returns {string}
 */
export function capitalize(str) {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Convert string to title case
 * @param {string} str
 * @returns {string}
 */
export function titleCase(str) {
    if (!str) return str;
    return str.toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
}

/**
 * Slugify a string (for URLs/IDs)
 * @param {string} str
 * @returns {string}
 */
export function slugify(str) {
    return str
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

/**
 * Parse timing range string
 * @param {string} timing - Timing string (e.g., "00:30 - 01:30")
 * @returns {{start: number, end: number, duration: number}} Times in seconds
 */
export function parseTimingRange(timing) {
    if (!timing) return { start: 0, end: 0, duration: 0 };

    const parts = timing.split(/\s*-\s*/);
    const start = parseTime(parts[0]);
    const end = parts[1] ? parseTime(parts[1]) : start;

    return {
        start,
        end,
        duration: end - start
    };
}

/**
 * Format timing range from seconds
 * @param {number} startSeconds
 * @param {number} endSeconds
 * @returns {string} (e.g., "00:30 - 01:30")
 */
export function formatTimingRange(startSeconds, endSeconds) {
    return `${formatTime(startSeconds)} - ${formatTime(endSeconds)}`;
}
