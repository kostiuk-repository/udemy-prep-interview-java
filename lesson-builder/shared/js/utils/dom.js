/**
 * DOM Utilities - DOM Manipulation Helpers
 * Lesson Builder System
 */

/**
 * Query selector shorthand
 * @param {string} selector - CSS selector
 * @param {Element} [context=document] - Context element
 * @returns {Element|null}
 */
export function $(selector, context = document) {
    return context.querySelector(selector);
}

/**
 * Query selector all shorthand
 * @param {string} selector - CSS selector
 * @param {Element} [context=document] - Context element
 * @returns {NodeList}
 */
export function $$(selector, context = document) {
    return context.querySelectorAll(selector);
}

/**
 * Create an element with attributes and children
 * @param {string} tag - Tag name
 * @param {Object} [attrs] - Attributes object
 * @param {Array|string} [children] - Child elements or text content
 * @returns {Element}
 */
export function createElement(tag, attrs = {}, children = []) {
    const element = document.createElement(tag);

    // Set attributes
    Object.entries(attrs).forEach(([key, value]) => {
        if (key === 'className') {
            element.className = value;
        } else if (key === 'dataset') {
            Object.entries(value).forEach(([dataKey, dataValue]) => {
                element.dataset[dataKey] = dataValue;
            });
        } else if (key === 'style' && typeof value === 'object') {
            Object.assign(element.style, value);
        } else if (key.startsWith('on') && typeof value === 'function') {
            const eventName = key.slice(2).toLowerCase();
            element.addEventListener(eventName, value);
        } else if (value !== null && value !== undefined) {
            element.setAttribute(key, value);
        }
    });

    // Add children
    if (typeof children === 'string') {
        element.textContent = children;
    } else if (Array.isArray(children)) {
        children.forEach(child => {
            if (typeof child === 'string') {
                element.appendChild(document.createTextNode(child));
            } else if (child instanceof Node) {
                element.appendChild(child);
            }
        });
    }

    return element;
}

/**
 * Add class(es) to element
 * @param {Element} element
 * @param {...string} classNames
 */
export function addClass(element, ...classNames) {
    element.classList.add(...classNames.filter(Boolean));
}

/**
 * Remove class(es) from element
 * @param {Element} element
 * @param {...string} classNames
 */
export function removeClass(element, ...classNames) {
    element.classList.remove(...classNames.filter(Boolean));
}

/**
 * Toggle class on element
 * @param {Element} element
 * @param {string} className
 * @param {boolean} [force] - Force add/remove
 * @returns {boolean} - Whether class is now present
 */
export function toggleClass(element, className, force) {
    return element.classList.toggle(className, force);
}

/**
 * Check if element has class
 * @param {Element} element
 * @param {string} className
 * @returns {boolean}
 */
export function hasClass(element, className) {
    return element.classList.contains(className);
}

/**
 * Set multiple styles on element
 * @param {Element} element
 * @param {Object} styles - Style object
 */
export function setStyles(element, styles) {
    Object.assign(element.style, styles);
}

/**
 * Get element's computed style value
 * @param {Element} element
 * @param {string} property - CSS property name
 * @returns {string}
 */
export function getStyle(element, property) {
    return getComputedStyle(element).getPropertyValue(property);
}

/**
 * Set data attribute(s)
 * @param {Element} element
 * @param {string|Object} key - Data key or object of key-value pairs
 * @param {*} [value] - Value if key is string
 */
export function setData(element, key, value) {
    if (typeof key === 'object') {
        Object.entries(key).forEach(([k, v]) => {
            element.dataset[k] = v;
        });
    } else {
        element.dataset[key] = value;
    }
}

/**
 * Get data attribute
 * @param {Element} element
 * @param {string} key
 * @returns {string|undefined}
 */
export function getData(element, key) {
    return element.dataset[key];
}

/**
 * Remove element from DOM
 * @param {Element} element
 */
export function remove(element) {
    if (element && element.parentNode) {
        element.parentNode.removeChild(element);
    }
}

/**
 * Empty an element's contents
 * @param {Element} element
 */
export function empty(element) {
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
}

/**
 * Insert element after reference element
 * @param {Element} newElement
 * @param {Element} referenceElement
 */
export function insertAfter(newElement, referenceElement) {
    referenceElement.parentNode.insertBefore(newElement, referenceElement.nextSibling);
}

/**
 * Wrap element with another element
 * @param {Element} element - Element to wrap
 * @param {Element} wrapper - Wrapper element
 */
export function wrap(element, wrapper) {
    element.parentNode.insertBefore(wrapper, element);
    wrapper.appendChild(element);
}

/**
 * Check if element is in viewport
 * @param {Element} element
 * @param {number} [threshold=0] - Percentage threshold (0-1)
 * @returns {boolean}
 */
export function isInViewport(element, threshold = 0) {
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    const windowWidth = window.innerWidth || document.documentElement.clientWidth;

    const verticalVisible = (rect.top <= windowHeight * (1 - threshold)) &&
        (rect.bottom >= windowHeight * threshold);
    const horizontalVisible = (rect.left <= windowWidth * (1 - threshold)) &&
        (rect.right >= windowWidth * threshold);

    return verticalVisible && horizontalVisible;
}

/**
 * Scroll element into view with options
 * @param {Element} element
 * @param {Object} [options]
 */
export function scrollTo(element, options = {}) {
    element.scrollIntoView({
        behavior: options.behavior || 'smooth',
        block: options.block || 'start',
        inline: options.inline || 'nearest'
    });
}

/**
 * Wait for DOM content loaded
 * @param {Function} callback
 */
export function ready(callback) {
    if (document.readyState !== 'loading') {
        callback();
    } else {
        document.addEventListener('DOMContentLoaded', callback);
    }
}

/**
 * Delegate event handling
 * @param {Element} parent - Parent element to attach listener to
 * @param {string} eventType - Event type
 * @param {string} selector - Child selector to match
 * @param {Function} handler - Event handler
 * @returns {Function} - Cleanup function
 */
export function delegate(parent, eventType, selector, handler) {
    const listener = (event) => {
        const target = event.target.closest(selector);
        if (target && parent.contains(target)) {
            handler.call(target, event, target);
        }
    };

    parent.addEventListener(eventType, listener);

    return () => parent.removeEventListener(eventType, listener);
}

/**
 * Debounce function
 * @param {Function} fn
 * @param {number} delay - Delay in milliseconds
 * @returns {Function}
 */
export function debounce(fn, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn.apply(this, args), delay);
    };
}

/**
 * Throttle function
 * @param {Function} fn
 * @param {number} limit - Minimum time between calls in milliseconds
 * @returns {Function}
 */
export function throttle(fn, limit) {
    let inThrottle;
    return function (...args) {
        if (!inThrottle) {
            fn.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}
