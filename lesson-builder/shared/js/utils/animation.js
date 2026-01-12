/**
 * Animation Utilities - Easing Functions and Interpolation
 * Lesson Builder System
 */

// ==========================================================================
// INTERPOLATION
// ==========================================================================

/**
 * Linear interpolation between two values
 * @param {number} start - Start value
 * @param {number} end - End value
 * @param {number} t - Progress (0-1)
 * @returns {number}
 */
export function lerp(start, end, t) {
    return start + (end - start) * t;
}

/**
 * Inverse linear interpolation - find t given a value between start and end
 * @param {number} start
 * @param {number} end
 * @param {number} value
 * @returns {number}
 */
export function inverseLerp(start, end, value) {
    if (start === end) return 0;
    return (value - start) / (end - start);
}

/**
 * Map a value from one range to another
 * @param {number} value - Input value
 * @param {number} inMin - Input range minimum
 * @param {number} inMax - Input range maximum
 * @param {number} outMin - Output range minimum
 * @param {number} outMax - Output range maximum
 * @returns {number}
 */
export function map(value, inMin, inMax, outMin, outMax) {
    return lerp(outMin, outMax, inverseLerp(inMin, inMax, value));
}

/**
 * Clamp a value between min and max
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

// ==========================================================================
// EASING FUNCTIONS
// ==========================================================================

/**
 * Linear (no easing)
 * @param {number} t - Progress (0-1)
 * @returns {number}
 */
export function linear(t) {
    return t;
}

// Quadratic
export function easeInQuad(t) {
    return t * t;
}

export function easeOutQuad(t) {
    return t * (2 - t);
}

export function easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

// Cubic
export function easeInCubic(t) {
    return t * t * t;
}

export function easeOutCubic(t) {
    return (--t) * t * t + 1;
}

export function easeInOutCubic(t) {
    return t < 0.5
        ? 4 * t * t * t
        : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
}

// Quartic
export function easeInQuart(t) {
    return t * t * t * t;
}

export function easeOutQuart(t) {
    return 1 - (--t) * t * t * t;
}

export function easeInOutQuart(t) {
    return t < 0.5
        ? 8 * t * t * t * t
        : 1 - 8 * (--t) * t * t * t;
}

// Quintic
export function easeInQuint(t) {
    return t * t * t * t * t;
}

export function easeOutQuint(t) {
    return 1 + (--t) * t * t * t * t;
}

export function easeInOutQuint(t) {
    return t < 0.5
        ? 16 * t * t * t * t * t
        : 1 + 16 * (--t) * t * t * t * t;
}

// Sine
export function easeInSine(t) {
    return 1 - Math.cos((t * Math.PI) / 2);
}

export function easeOutSine(t) {
    return Math.sin((t * Math.PI) / 2);
}

export function easeInOutSine(t) {
    return -(Math.cos(Math.PI * t) - 1) / 2;
}

// Exponential
export function easeInExpo(t) {
    return t === 0 ? 0 : Math.pow(2, 10 * t - 10);
}

export function easeOutExpo(t) {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

export function easeInOutExpo(t) {
    if (t === 0) return 0;
    if (t === 1) return 1;
    return t < 0.5
        ? Math.pow(2, 20 * t - 10) / 2
        : (2 - Math.pow(2, -20 * t + 10)) / 2;
}

// Circular
export function easeInCirc(t) {
    return 1 - Math.sqrt(1 - t * t);
}

export function easeOutCirc(t) {
    return Math.sqrt(1 - (--t) * t);
}

export function easeInOutCirc(t) {
    return t < 0.5
        ? (1 - Math.sqrt(1 - 4 * t * t)) / 2
        : (Math.sqrt(1 - Math.pow(-2 * t + 2, 2)) + 1) / 2;
}

// Back (overshoot)
export function easeInBack(t) {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return c3 * t * t * t - c1 * t * t;
}

export function easeOutBack(t) {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

export function easeInOutBack(t) {
    const c1 = 1.70158;
    const c2 = c1 * 1.525;
    return t < 0.5
        ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
        : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
}

// Elastic
export function easeInElastic(t) {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1
        : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
}

export function easeOutElastic(t) {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1
        : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
}

export function easeInOutElastic(t) {
    const c5 = (2 * Math.PI) / 4.5;
    return t === 0 ? 0 : t === 1 ? 1 : t < 0.5
        ? -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * c5)) / 2
        : (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * c5)) / 2 + 1;
}

// Bounce
export function easeOutBounce(t) {
    const n1 = 7.5625;
    const d1 = 2.75;

    if (t < 1 / d1) {
        return n1 * t * t;
    } else if (t < 2 / d1) {
        return n1 * (t -= 1.5 / d1) * t + 0.75;
    } else if (t < 2.5 / d1) {
        return n1 * (t -= 2.25 / d1) * t + 0.9375;
    } else {
        return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
}

export function easeInBounce(t) {
    return 1 - easeOutBounce(1 - t);
}

export function easeInOutBounce(t) {
    return t < 0.5
        ? (1 - easeOutBounce(1 - 2 * t)) / 2
        : (1 + easeOutBounce(2 * t - 1)) / 2;
}

// ==========================================================================
// EASING LOOKUP
// ==========================================================================

/**
 * Get easing function by name
 * @param {string} name - Easing function name (e.g., 'easeInOutCubic')
 * @returns {Function}
 */
export function getEasing(name) {
    const easings = {
        linear,
        easeInQuad, easeOutQuad, easeInOutQuad,
        easeInCubic, easeOutCubic, easeInOutCubic,
        easeInQuart, easeOutQuart, easeInOutQuart,
        easeInQuint, easeOutQuint, easeInOutQuint,
        easeInSine, easeOutSine, easeInOutSine,
        easeInExpo, easeOutExpo, easeInOutExpo,
        easeInCirc, easeOutCirc, easeInOutCirc,
        easeInBack, easeOutBack, easeInOutBack,
        easeInElastic, easeOutElastic, easeInOutElastic,
        easeInBounce, easeOutBounce, easeInOutBounce
    };

    return easings[name] || linear;
}

// ==========================================================================
// ANIMATION HELPERS
// ==========================================================================

/**
 * Simple animation loop
 * @param {Object} config
 * @param {number} config.duration - Duration in milliseconds
 * @param {Function} config.onUpdate - Called each frame with progress (0-1)
 * @param {Function} [config.easing] - Easing function
 * @param {Function} [config.onComplete] - Called when animation completes
 * @returns {{cancel: Function}} Control object
 */
export function animate(config) {
    const {
        duration,
        onUpdate,
        easing = linear,
        onComplete
    } = config;

    let startTime = null;
    let animationId = null;
    let cancelled = false;

    function step(timestamp) {
        if (cancelled) return;

        if (startTime === null) {
            startTime = timestamp;
        }

        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easing(progress);

        onUpdate(easedProgress);

        if (progress < 1) {
            animationId = requestAnimationFrame(step);
        } else if (onComplete) {
            onComplete();
        }
    }

    animationId = requestAnimationFrame(step);

    return {
        cancel: () => {
            cancelled = true;
            if (animationId) {
                cancelAnimationFrame(animationId);
            }
        }
    };
}

/**
 * Spring animation
 * @param {Object} config
 * @param {number} config.from - Start value
 * @param {number} config.to - End value
 * @param {Function} config.onUpdate - Called each frame with current value
 * @param {number} [config.stiffness=100] - Spring stiffness
 * @param {number} [config.damping=10] - Spring damping
 * @param {Function} [config.onComplete] - Called when animation completes
 * @returns {{cancel: Function}}
 */
export function spring(config) {
    const {
        from,
        to,
        onUpdate,
        stiffness = 100,
        damping = 10,
        onComplete
    } = config;

    let value = from;
    let velocity = 0;
    let animationId = null;
    let cancelled = false;
    let lastTime = performance.now();

    function step(timestamp) {
        if (cancelled) return;

        const dt = Math.min((timestamp - lastTime) / 1000, 0.064);
        lastTime = timestamp;

        const springForce = -stiffness * (value - to);
        const dampingForce = -damping * velocity;
        const acceleration = springForce + dampingForce;

        velocity += acceleration * dt;
        value += velocity * dt;

        onUpdate(value);

        // Check if animation is complete (velocity and position near target)
        if (Math.abs(velocity) < 0.01 && Math.abs(value - to) < 0.01) {
            value = to;
            onUpdate(value);
            if (onComplete) onComplete();
        } else {
            animationId = requestAnimationFrame(step);
        }
    }

    animationId = requestAnimationFrame(step);

    return {
        cancel: () => {
            cancelled = true;
            if (animationId) {
                cancelAnimationFrame(animationId);
            }
        }
    };
}
