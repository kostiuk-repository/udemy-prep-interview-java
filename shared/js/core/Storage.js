/**
 * Storage - LocalStorage Wrapper
 * Lesson Builder System
 * 
 * Provides JSON serialization/deserialization for localStorage
 * with error handling and fallback support.
 */

class StorageClass {
    constructor(prefix = 'lesson-builder') {
        this.prefix = prefix;
        this.isAvailable = this._checkAvailability();

        // In-memory fallback if localStorage is not available
        this.memoryStore = new Map();
    }

    /**
     * Check if localStorage is available
     * @private
     * @returns {boolean}
     */
    _checkAvailability() {
        try {
            const testKey = '__storage_test__';
            window.localStorage.setItem(testKey, testKey);
            window.localStorage.removeItem(testKey);
            return true;
        } catch (e) {
            console.warn('Storage: localStorage not available, using in-memory fallback');
            return false;
        }
    }

    /**
     * Build the full storage key with prefix
     * @private
     * @param {string} key - The key to prefix
     * @returns {string}
     */
    _buildKey(key) {
        return `${this.prefix}:${key}`;
    }

    /**
     * Set a value in storage
     * @param {string} key - Storage key
     * @param {*} value - Value to store (will be JSON stringified)
     * @returns {boolean} Success status
     */
    set(key, value) {
        const fullKey = this._buildKey(key);

        try {
            const serialized = JSON.stringify(value);

            if (this.isAvailable) {
                localStorage.setItem(fullKey, serialized);
            } else {
                this.memoryStore.set(fullKey, serialized);
            }

            return true;
        } catch (error) {
            if (error.name === 'QuotaExceededError') {
                console.error('Storage: Quota exceeded. Consider clearing old data.');
            } else {
                console.error('Storage: Error saving value:', error);
            }
            return false;
        }
    }

    /**
     * Get a value from storage
     * @param {string} key - Storage key
     * @param {*} defaultValue - Default value if key doesn't exist
     * @returns {*} The stored value or default
     */
    get(key, defaultValue = null) {
        const fullKey = this._buildKey(key);

        try {
            const serialized = this.isAvailable
                ? localStorage.getItem(fullKey)
                : this.memoryStore.get(fullKey);

            if (serialized === null || serialized === undefined) {
                return defaultValue;
            }

            return JSON.parse(serialized);
        } catch (error) {
            console.error('Storage: Error reading value:', error);
            return defaultValue;
        }
    }

    /**
     * Remove a value from storage
     * @param {string} key - Storage key
     * @returns {boolean} Success status
     */
    remove(key) {
        const fullKey = this._buildKey(key);

        try {
            if (this.isAvailable) {
                localStorage.removeItem(fullKey);
            } else {
                this.memoryStore.delete(fullKey);
            }
            return true;
        } catch (error) {
            console.error('Storage: Error removing value:', error);
            return false;
        }
    }

    /**
     * Check if a key exists in storage
     * @param {string} key - Storage key
     * @returns {boolean}
     */
    has(key) {
        const fullKey = this._buildKey(key);

        if (this.isAvailable) {
            return localStorage.getItem(fullKey) !== null;
        }
        return this.memoryStore.has(fullKey);
    }

    /**
     * Clear all lesson builder data from storage
     * @returns {boolean} Success status
     */
    clear() {
        try {
            if (this.isAvailable) {
                // Only remove keys with our prefix
                const keysToRemove = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith(this.prefix)) {
                        keysToRemove.push(key);
                    }
                }
                keysToRemove.forEach(key => localStorage.removeItem(key));
            } else {
                this.memoryStore.clear();
            }
            return true;
        } catch (error) {
            console.error('Storage: Error clearing storage:', error);
            return false;
        }
    }

    /**
     * Get all keys with the current prefix
     * @returns {string[]} Array of keys (without prefix)
     */
    keys() {
        const result = [];
        const prefixLength = this.prefix.length + 1; // +1 for the colon

        if (this.isAvailable) {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(this.prefix)) {
                    result.push(key.substring(prefixLength));
                }
            }
        } else {
            this.memoryStore.forEach((_, key) => {
                if (key.startsWith(this.prefix)) {
                    result.push(key.substring(prefixLength));
                }
            });
        }

        return result;
    }

    /**
     * Get storage usage info
     * @returns {{used: number, available: boolean}}
     */
    getUsageInfo() {
        let used = 0;

        if (this.isAvailable) {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(this.prefix)) {
                    const value = localStorage.getItem(key);
                    used += key.length + (value ? value.length : 0);
                }
            }
        }

        return {
            used: used * 2, // Approximate bytes (UTF-16)
            available: this.isAvailable
        };
    }
}

// Create singleton instance
export const Storage = new StorageClass();

// Also export the class for custom instances
export { StorageClass };

// Convenience functions for lesson-specific storage
export const LessonStorage = {
    /**
     * Get progress for a specific lesson
     * @param {string} lessonId 
     * @returns {string[]} Array of completed section IDs
     */
    getProgress(lessonId) {
        return Storage.get(`${lessonId}-progress`, []);
    },

    /**
     * Set progress for a specific lesson
     * @param {string} lessonId 
     * @param {string[]} completedSections 
     */
    setProgress(lessonId, completedSections) {
        Storage.set(`${lessonId}-progress`, completedSections);
    },

    /**
     * Mark a section as completed
     * @param {string} lessonId 
     * @param {string} sectionId 
     */
    markCompleted(lessonId, sectionId) {
        const progress = this.getProgress(lessonId);
        if (!progress.includes(sectionId)) {
            progress.push(sectionId);
            this.setProgress(lessonId, progress);
        }
    },

    /**
     * Unmark a section as completed
     * @param {string} lessonId 
     * @param {string} sectionId 
     */
    unmarkCompleted(lessonId, sectionId) {
        const progress = this.getProgress(lessonId);
        const index = progress.indexOf(sectionId);
        if (index > -1) {
            progress.splice(index, 1);
            this.setProgress(lessonId, progress);
        }
    },

    /**
     * Check if a section is completed
     * @param {string} lessonId 
     * @param {string} sectionId 
     * @returns {boolean}
     */
    isCompleted(lessonId, sectionId) {
        return this.getProgress(lessonId).includes(sectionId);
    },

    /**
     * Get the completion percentage
     * @param {string} lessonId 
     * @param {number} totalSections 
     * @returns {number} Percentage 0-100
     */
    getCompletionPercentage(lessonId, totalSections) {
        if (totalSections === 0) return 0;
        const completed = this.getProgress(lessonId).length;
        return Math.round((completed / totalSections) * 100);
    }
};
