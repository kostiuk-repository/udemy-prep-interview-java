/**
 * EventBus - Component Communication System
 * Lesson Builder System
 * 
 * Simple pub/sub pattern for decoupled component communication.
 * Components emit events, other components listen without direct coupling.
 */

class EventBusClass {
    constructor() {
        this.listeners = new Map();
    }

    /**
     * Register an event listener
     * @param {string} eventName - Name of the event to listen for
     * @param {Function} callback - Function to call when event is emitted
     * @returns {Function} Unsubscribe function
     */
    on(eventName, callback) {
        if (!this.listeners.has(eventName)) {
            this.listeners.set(eventName, new Set());
        }
        this.listeners.get(eventName).add(callback);
        
        // Return unsubscribe function
        return () => this.off(eventName, callback);
    }

    /**
     * Unregister an event listener
     * @param {string} eventName - Name of the event
     * @param {Function} callback - The callback to remove
     */
    off(eventName, callback) {
        if (this.listeners.has(eventName)) {
            this.listeners.get(eventName).delete(callback);
            
            // Clean up empty event sets
            if (this.listeners.get(eventName).size === 0) {
                this.listeners.delete(eventName);
            }
        }
    }

    /**
     * Emit an event with optional payload
     * @param {string} eventName - Name of the event to emit
     * @param {*} payload - Data to pass to listeners
     */
    emit(eventName, payload) {
        if (this.listeners.has(eventName)) {
            this.listeners.get(eventName).forEach(callback => {
                try {
                    callback(payload);
                } catch (error) {
                    console.error(`EventBus: Error in listener for "${eventName}":`, error);
                }
            });
        }
    }

    /**
     * Register a one-time event listener
     * @param {string} eventName - Name of the event
     * @param {Function} callback - Function to call once
     * @returns {Function} Unsubscribe function
     */
    once(eventName, callback) {
        const onceWrapper = (payload) => {
            this.off(eventName, onceWrapper);
            callback(payload);
        };
        return this.on(eventName, onceWrapper);
    }

    /**
     * Remove all listeners for a specific event or all events
     * @param {string} [eventName] - Optional event name. If not provided, clears all.
     */
    clear(eventName) {
        if (eventName) {
            this.listeners.delete(eventName);
        } else {
            this.listeners.clear();
        }
    }

    /**
     * Get the number of listeners for an event
     * @param {string} eventName - Name of the event
     * @returns {number} Number of listeners
     */
    listenerCount(eventName) {
        return this.listeners.has(eventName) 
            ? this.listeners.get(eventName).size 
            : 0;
    }

    /**
     * Check if an event has any listeners
     * @param {string} eventName - Name of the event
     * @returns {boolean}
     */
    hasListeners(eventName) {
        return this.listenerCount(eventName) > 0;
    }
}

// Create singleton instance
export const EventBus = new EventBusClass();

// Also export the class for testing purposes
export { EventBusClass };

// Event name constants for type safety
export const Events = {
    // TopNav events
    MENU_TOGGLE: 'menu:toggle',
    EXPORT_SELECTED: 'export:selected',
    
    // Timeline events
    TIMELINE_SECTION_CLICKED: 'timeline:section-clicked',
    TIMELINE_CHECKBOX_CHANGED: 'timeline:checkbox-changed',
    TIMELINE_CLOSED: 'timeline:closed',
    
    // Section events
    SECTION_VISIBLE: 'section:visible',
    SECTION_DESCRIPTION_TOGGLED: 'section:description-toggled',
    
    // Audio events
    AUDIO_SCRIPT_TOGGLED: 'audio:script-toggled',
    AUDIO_PLAYING: 'audio:playing',
    AUDIO_ENDED: 'audio:ended',
    AUDIO_METADATA_LOADED: 'audio:metadata-loaded',
    
    // Step Navigator events
    STEP_CHANGED: 'step:changed',
    
    // Visual events
    VISUAL_STEP_RENDERED: 'visual:step-rendered',
    VISUAL_EXPORT_STARTED: 'visual:export-started',
    VISUAL_EXPORT_PROGRESS: 'visual:export-progress',
    VISUAL_EXPORT_COMPLETE: 'visual:export-complete',
    
    // Lesson core events
    LESSON_INITIALIZED: 'lesson:initialized',
    LESSON_DESTROYED: 'lesson:destroyed',
    PROGRESS_UPDATED: 'progress:updated'
};
