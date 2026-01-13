/**
 * StepNavigator Component - Arrow Navigation for Multi-Step Visuals
 * Lesson Builder System
 */

import { EventBus, Events } from '../core/EventBus.js';

/**
 * StepNavigator manager - handles multiple navigators
 */
const navigators = new Map();

export const StepNavigator = {
    /**
     * Initialize a StepNavigator instance
     * @param {Object} config
     * @param {HTMLElement} config.container - Container element
     * @param {string} config.visualId - Visual identifier
     * @param {number} config.totalSteps - Total number of steps
     * @param {number} [config.initialStep=1] - Starting step (1-indexed)
     * @param {Function} [config.onStepChange] - Callback when step changes
     * @returns {Object} StepNavigator instance
     */
    init(config) {
        const instance = {
            container: config.container,
            visualId: config.visualId,
            state: {
                currentStep: config.initialStep || 1,
                totalSteps: config.totalSteps
            },
            onStepChange: config.onStepChange,
            elements: {}
        };

        this._render(instance);
        this._bindEvents(instance);

        // Store instance
        navigators.set(config.visualId, instance);

        // Update button states
        this._updateButtons(instance);

        return instance;
    },

    /**
     * Render navigator HTML
     * @private
     */
    _render(instance) {
        const { currentStep, totalSteps } = instance.state;

        instance.container.innerHTML = `
            <button class="step-nav-btn" data-direction="prev" aria-label="Previous step">
                ◀
            </button>
            <span class="step-indicator" data-step-indicator>
                Step: ${currentStep}/${totalSteps}
            </span>
            <button class="step-nav-btn" data-direction="next" aria-label="Next step">
                ▶
            </button>
        `;

        // Cache elements
        instance.elements = {
            prevBtn: instance.container.querySelector('[data-direction="prev"]'),
            nextBtn: instance.container.querySelector('[data-direction="next"]'),
            indicator: instance.container.querySelector('[data-step-indicator]')
        };
    },

    /**
     * Bind event listeners
     * @private
     */
    _bindEvents(instance) {
        const { elements, visualId } = instance;

        // Previous button
        if (elements.prevBtn) {
            elements.prevBtn.addEventListener('click', () => {
                this.prevStep(visualId);
            });
        }

        // Next button
        if (elements.nextBtn) {
            elements.nextBtn.addEventListener('click', () => {
                this.nextStep(visualId);
            });
        }

        // Keyboard navigation
        instance.container.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                this.prevStep(visualId);
            } else if (e.key === 'ArrowRight') {
                this.nextStep(visualId);
            }
        });
    },

    /**
     * Update button disabled states
     * @private
     */
    _updateButtons(instance) {
        const { currentStep, totalSteps } = instance.state;
        const { prevBtn, nextBtn, indicator } = instance.elements;

        if (prevBtn) {
            prevBtn.disabled = currentStep <= 1;
        }

        if (nextBtn) {
            nextBtn.disabled = currentStep >= totalSteps;
        }

        if (indicator) {
            indicator.textContent = `Step: ${currentStep}/${totalSteps}`;
        }
    },

    /**
     * Go to a specific step
     * @param {string} visualId
     * @param {number} stepNumber - 1-indexed step number
     */
    goToStep(visualId, stepNumber) {
        const instance = navigators.get(visualId);
        if (!instance) return;

        const { totalSteps } = instance.state;

        // Clamp to valid range
        const newStep = Math.max(1, Math.min(stepNumber, totalSteps));

        if (newStep !== instance.state.currentStep) {
            instance.state.currentStep = newStep;
            this._updateButtons(instance);

            // Enable coordinate logging for next render
if (typeof window !== 'undefined' && window.DEBUG === true) {
            // Debug enabled via global DEBUG flag
            }

            // Emit event
            EventBus.emit(Events.STEP_CHANGED, {
                visualId,
                step: newStep,
                totalSteps
            });

            // Call callback if provided
            if (instance.onStepChange) {
                instance.onStepChange(newStep);
            }
        }
    },

    /**
     * Go to next step
     * @param {string} visualId
     */
    nextStep(visualId) {
        const instance = navigators.get(visualId);
        if (instance) {
            this.goToStep(visualId, instance.state.currentStep + 1);
        }
    },

    /**
     * Go to previous step
     * @param {string} visualId
     */
    prevStep(visualId) {
        const instance = navigators.get(visualId);
        if (instance) {
            this.goToStep(visualId, instance.state.currentStep - 1);
        }
    },

    /**
     * Get current step
     * @param {string} visualId
     * @returns {number}
     */
    getCurrentStep(visualId) {
        const instance = navigators.get(visualId);
        return instance?.state.currentStep || 1;
    },

    /**
     * Get total steps
     * @param {string} visualId
     * @returns {number}
     */
    getTotalSteps(visualId) {
        const instance = navigators.get(visualId);
        return instance?.state.totalSteps || 0;
    },

    /**
     * Set total steps (useful for dynamic content)
     * @param {string} visualId
     * @param {number} totalSteps
     */
    setTotalSteps(visualId, totalSteps) {
        const instance = navigators.get(visualId);
        if (instance) {
            instance.state.totalSteps = totalSteps;
            // Clamp current step if needed
            if (instance.state.currentStep > totalSteps) {
                instance.state.currentStep = totalSteps;
            }
            this._updateButtons(instance);
        }
    },

    /**
     * Reset to first step
     * @param {string} visualId
     */
    reset(visualId) {
        this.goToStep(visualId, 1);
    },

    /**
     * Destroy a navigator instance
     * @param {string} visualId
     */
    destroy(visualId) {
        const instance = navigators.get(visualId);
        if (instance) {
            if (instance.container) {
                instance.container.innerHTML = '';
            }
            navigators.delete(visualId);
        }
    },

    /**
     * Destroy all navigator instances
     */
    destroyAll() {
        navigators.forEach((_, visualId) => {
            this.destroy(visualId);
        });
    }
};
