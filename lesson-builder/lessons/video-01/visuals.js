/**
 * Lesson Visuals - Video 01: Why You Keep Failing Interviews
 * Custom visual compositions for this lesson
 */

import { Composition, Layer } from '../../shared/js/visual/VisualEngine.js';
import { easeOutCubic, easeInOutCubic } from '../../shared/js/utils/animation.js';

/**
 * Create all visual compositions for this lesson
 * @returns {Object} Map of visualId to Composition
 */
export function createVisuals() {
    return {
        'hook-transition': createHookTransition(),
        'pie-chart': createPieChart(),
        'killer1-animation': createKiller1Animation(),
        'killer2-animation': createKiller2Animation(),
        'killer3-animation': createKiller3Animation(),
        'spider-framework': createSpiderFramework()
    };
}

/**
 * Hook section - LeetCode to Interview transition
 */
function createHookTransition() {
    const comp = new Composition({
        width: 800,
        height: 500,
        fps: 60,
        durationInFrames: 180 // 3 steps at 60 frames each
    });

    // Step 1: "300+ Problems Solved" text
    comp.addLayer(new Layer({
        id: 'leetcode-count',
        type: 'text',
        keyframes: [
            { frame: 0, value: { x: 400, y: 150, text: '300+', fontSize: 72, fontFamily: 'Segoe UI', fontWeight: 'bold', fill: '#10b981', textAnchor: 'middle', opacity: 0 } },
            { frame: 30, value: { x: 400, y: 150, text: '300+', fontSize: 72, fontFamily: 'Segoe UI', fontWeight: 'bold', fill: '#10b981', textAnchor: 'middle', opacity: 1 } }
        ]
    }).setEasing(easeOutCubic));

    comp.addLayer(new Layer({
        id: 'leetcode-label',
        type: 'text',
        keyframes: [
            { frame: 0, value: { x: 400, y: 200, text: 'Problems Solved', fontSize: 24, fontFamily: 'Segoe UI', fill: '#64748b', textAnchor: 'middle', opacity: 0 } },
            { frame: 40, value: { x: 400, y: 200, text: 'Problems Solved', fontSize: 24, fontFamily: 'Segoe UI', fill: '#64748b', textAnchor: 'middle', opacity: 1 } }
        ]
    }));

    // Step 2: Interview question appears
    comp.addLayer(new Layer({
        id: 'interview-icon',
        type: 'text',
        keyframes: [
            { frame: 60, value: { x: 400, y: 280, text: '❌', fontSize: 48, textAnchor: 'middle', opacity: 0 } },
            { frame: 90, value: { x: 400, y: 280, text: '❌', fontSize: 48, textAnchor: 'middle', opacity: 1 } }
        ]
    }));

    comp.addLayer(new Layer({
        id: 'interview-question',
        type: 'text',
        keyframes: [
            { frame: 60, value: { x: 400, y: 340, text: '"Design a payment system..."', fontSize: 20, fontFamily: 'Segoe UI', fill: '#ef4444', textAnchor: 'middle', opacity: 0 } },
            { frame: 100, value: { x: 400, y: 340, text: '"Design a payment system..."', fontSize: 20, fontFamily: 'Segoe UI', fill: '#ef4444', textAnchor: 'middle', opacity: 1 } }
        ]
    }));

    // Step 3: "Both Sides" reveal
    comp.addLayer(new Layer({
        id: 'both-sides-icon',
        type: 'text',
        keyframes: [
            { frame: 120, value: { x: 400, y: 420, text: '💡', fontSize: 36, textAnchor: 'middle', opacity: 0 } },
            { frame: 150, value: { x: 400, y: 420, text: '💡', fontSize: 36, textAnchor: 'middle', opacity: 1 } }
        ]
    }));

    comp.addLayer(new Layer({
        id: 'both-sides-text',
        type: 'text',
        keyframes: [
            { frame: 120, value: { x: 400, y: 470, text: "I've Been On Both Sides", fontSize: 18, fontFamily: 'Segoe UI', fill: '#2563eb', textAnchor: 'middle', opacity: 0 } },
            { frame: 160, value: { x: 400, y: 470, text: "I've Been On Both Sides", fontSize: 18, fontFamily: 'Segoe UI', fill: '#2563eb', textAnchor: 'middle', opacity: 1 } }
        ]
    }));

    return comp;
}

/**
 * Problem section - The 30/70 split pie chart
 */
function createPieChart() {
    const comp = new Composition({
        width: 400,
        height: 400,
        fps: 60,
        durationInFrames: 180
    });

    const centerX = 200;
    const centerY = 200;
    const radius = 120;

    // Step 1: 30% slice (LeetCode)
    const slice30Degrees = 360 * 0.30;
    comp.addLayer(new Layer({
        id: 'slice-leetcode',
        type: 'path',
        keyframes: [
            { frame: 0, value: { d: createPieSlicePath(centerX, centerY, 0, 0, 0), fill: '#10b981', opacity: 0 } },
            { frame: 60, value: { d: createPieSlicePath(centerX, centerY, radius, -90, -90 + slice30Degrees), fill: '#10b981', opacity: 1 } }
        ]
    }).setEasing(easeInOutCubic));

    // Step 2: 70% slice (Real Skills)
    comp.addLayer(new Layer({
        id: 'slice-real',
        type: 'path',
        keyframes: [
            { frame: 60, value: { d: createPieSlicePath(centerX, centerY, radius, -90 + slice30Degrees, -90 + slice30Degrees), fill: '#ef4444', opacity: 0 } },
            { frame: 120, value: { d: createPieSlicePath(centerX, centerY, radius, -90 + slice30Degrees, 270), fill: '#ef4444', opacity: 1 } }
        ]
    }).setEasing(easeInOutCubic));

    // Labels
    comp.addLayer(new Layer({
        id: 'label-30',
        type: 'text',
        keyframes: [
            { frame: 30, value: { x: 240, y: 120, text: '30%', fontSize: 24, fontWeight: 'bold', fill: '#10b981', textAnchor: 'middle', opacity: 0 } },
            { frame: 60, value: { x: 240, y: 120, text: '30%', fontSize: 24, fontWeight: 'bold', fill: '#10b981', textAnchor: 'middle', opacity: 1 } }
        ]
    }));

    comp.addLayer(new Layer({
        id: 'label-70',
        type: 'text',
        keyframes: [
            { frame: 90, value: { x: 160, y: 280, text: '70%', fontSize: 32, fontWeight: 'bold', fill: '#ef4444', textAnchor: 'middle', opacity: 0 } },
            { frame: 120, value: { x: 160, y: 280, text: '70%', fontSize: 32, fontWeight: 'bold', fill: '#ef4444', textAnchor: 'middle', opacity: 1 } }
        ]
    }));

    return comp;
}

/**
 * Create SVG path for a pie slice
 */
function createPieSlicePath(cx, cy, r, startAngle, endAngle) {
    if (r === 0) return `M ${cx} ${cy}`;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy + r * Math.sin(endRad);

    const largeArc = endAngle - startAngle > 180 ? 1 : 0;

    return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
}

/**
 * Killer #1 - Business Logic Implementation Gap
 */
function createKiller1Animation() {
    const comp = new Composition({
        width: 800,
        height: 500,
        fps: 60,
        durationInFrames: 180
    });

    // Step 1: Problem card
    comp.addLayer(new Layer({
        id: 'killer-card',
        type: 'rect',
        keyframes: [
            { frame: 0, value: { x: 50, y: 50, width: 700, height: 120, rx: 12, fill: '#334155', stroke: '#ef4444', strokeWidth: 4, opacity: 0 } },
            { frame: 30, value: { x: 50, y: 50, width: 700, height: 120, rx: 12, fill: '#334155', stroke: '#ef4444', strokeWidth: 4, opacity: 1 } }
        ]
    }));

    comp.addLayer(new Layer({
        id: 'killer-number',
        type: 'text',
        keyframes: [
            { frame: 0, value: { x: 80, y: 100, text: '#1', fontSize: 48, fontWeight: 'bold', fill: '#ef4444', opacity: 0 } },
            { frame: 30, value: { x: 80, y: 100, text: '#1', fontSize: 48, fontWeight: 'bold', fill: '#ef4444', opacity: 1 } }
        ]
    }));

    comp.addLayer(new Layer({
        id: 'killer-title',
        type: 'text',
        keyframes: [
            { frame: 0, value: { x: 160, y: 90, text: 'Business Logic Complexity', fontSize: 24, fontWeight: 'bold', fill: '#f1f5f9', opacity: 0 } },
            { frame: 40, value: { x: 160, y: 90, text: 'Business Logic Complexity', fontSize: 24, fontWeight: 'bold', fill: '#f1f5f9', opacity: 1 } }
        ]
    }));

    comp.addLayer(new Layer({
        id: 'killer-subtitle',
        type: 'text',
        keyframes: [
            { frame: 0, value: { x: 160, y: 130, text: '"Implement a money transfer system"', fontSize: 16, fill: '#cbd5e1', opacity: 0 } },
            { frame: 50, value: { x: 160, y: 130, text: '"Implement a money transfer system"', fontSize: 16, fill: '#cbd5e1', opacity: 1 } }
        ]
    }));

    // Step 2: Code block appears
    comp.addLayer(new Layer({
        id: 'code-block',
        type: 'rect',
        keyframes: [
            { frame: 60, value: { x: 50, y: 190, width: 700, height: 150, rx: 8, fill: '#0f172a', opacity: 0 } },
            { frame: 90, value: { x: 50, y: 190, width: 700, height: 150, rx: 8, fill: '#0f172a', opacity: 1 } }
        ]
    }));

    // Step 3: Warning box
    comp.addLayer(new Layer({
        id: 'warning-box',
        type: 'rect',
        keyframes: [
            { frame: 120, value: { x: 50, y: 360, width: 700, height: 120, rx: 8, fill: 'rgba(239, 68, 68, 0.1)', stroke: '#ef4444', strokeWidth: 2, opacity: 0 } },
            { frame: 150, value: { x: 50, y: 360, width: 700, height: 120, rx: 8, fill: 'rgba(239, 68, 68, 0.1)', stroke: '#ef4444', strokeWidth: 2, opacity: 1 } }
        ]
    }));

    comp.addLayer(new Layer({
        id: 'fail-stat',
        type: 'text',
        keyframes: [
            { frame: 120, value: { x: 400, y: 440, text: '80% of candidates fail this', fontSize: 24, fontWeight: 'bold', fill: '#ef4444', textAnchor: 'middle', opacity: 0 } },
            { frame: 170, value: { x: 400, y: 440, text: '80% of candidates fail this', fontSize: 24, fontWeight: 'bold', fill: '#ef4444', textAnchor: 'middle', opacity: 1 } }
        ]
    }));

    return comp;
}

/**
 * Killer #2 - Theory Under Pressure
 */
function createKiller2Animation() {
    const comp = new Composition({
        width: 800,
        height: 400,
        fps: 60,
        durationInFrames: 120
    });

    // Question
    comp.addLayer(new Layer({
        id: 'main-question',
        type: 'text',
        keyframes: [
            { frame: 0, value: { x: 400, y: 80, text: '"Explain how a HashMap works"', fontSize: 28, fontWeight: 'bold', fill: '#f1f5f9', textAnchor: 'middle', opacity: 0 } },
            { frame: 30, value: { x: 400, y: 80, text: '"Explain how a HashMap works"', fontSize: 28, fontWeight: 'bold', fill: '#f1f5f9', textAnchor: 'middle', opacity: 1 } }
        ]
    }));

    // Follow-up questions
    const followUps = [
        { y: 160, text: '↳ "What happens with the load factor?"' },
        { y: 210, text: '↳ "Why is resize O(n) amortized?"' },
        { y: 260, text: '↳ "How does Java 8 handle collisions?"' }
    ];

    followUps.forEach((q, i) => {
        comp.addLayer(new Layer({
            id: `followup-${i}`,
            type: 'text',
            keyframes: [
                { frame: 60 + i * 15, value: { x: 100, y: q.y, text: q.text, fontSize: 18, fill: '#cbd5e1', opacity: 0 } },
                { frame: 80 + i * 15, value: { x: 100, y: q.y, text: q.text, fontSize: 18, fill: '#cbd5e1', opacity: 1 } }
            ]
        }));
    });

    // Gap message
    comp.addLayer(new Layer({
        id: 'gap-message',
        type: 'text',
        keyframes: [
            { frame: 90, value: { x: 400, y: 340, text: 'The gap: KNOWING vs ARTICULATING under pressure', fontSize: 16, fill: '#f97316', textAnchor: 'middle', opacity: 0 } },
            { frame: 120, value: { x: 400, y: 340, text: 'The gap: KNOWING vs ARTICULATING under pressure', fontSize: 16, fill: '#f97316', textAnchor: 'middle', opacity: 1 } }
        ]
    }));

    return comp;
}

/**
 * Killer #3 - System Design Reality
 */
function createKiller3Animation() {
    const comp = new Composition({
        width: 800,
        height: 400,
        fps: 60,
        durationInFrames: 120
    });

    // System design boxes
    const boxes = [
        { x: 100, y: 150, text: 'Load\nBalancer', color: '#3b82f6' },
        { x: 300, y: 150, text: 'API\nServer', color: '#10b981' },
        { x: 500, y: 150, text: 'Database', color: '#f97316' }
    ];

    boxes.forEach((box, i) => {
        comp.addLayer(new Layer({
            id: `box-${i}`,
            type: 'rect',
            keyframes: [
                { frame: i * 15, value: { x: box.x, y: box.y, width: 120, height: 80, rx: 8, fill: box.color, opacity: 0 } },
                { frame: 30 + i * 15, value: { x: box.x, y: box.y, width: 120, height: 80, rx: 8, fill: box.color, opacity: 1 } }
            ]
        }));
    });

    // Deep dive message
    comp.addLayer(new Layer({
        id: 'deep-dive',
        type: 'text',
        keyframes: [
            { frame: 60, value: { x: 400, y: 300, text: 'Drawing boxes is easy...', fontSize: 20, fill: '#64748b', textAnchor: 'middle', opacity: 0 } },
            { frame: 80, value: { x: 400, y: 300, text: 'Drawing boxes is easy...', fontSize: 20, fill: '#64748b', textAnchor: 'middle', opacity: 1 } }
        ]
    }));

    comp.addLayer(new Layer({
        id: 'defend-message',
        type: 'text',
        keyframes: [
            { frame: 80, value: { x: 400, y: 350, text: 'DEFENDING your choices is what matters', fontSize: 18, fontWeight: 'bold', fill: '#2563eb', textAnchor: 'middle', opacity: 0 } },
            { frame: 110, value: { x: 400, y: 350, text: 'DEFENDING your choices is what matters', fontSize: 18, fontWeight: 'bold', fill: '#2563eb', textAnchor: 'middle', opacity: 1 } }
        ]
    }));

    return comp;
}

/**
 * Solution - SPIDER Framework
 */
function createSpiderFramework() {
    const comp = new Composition({
        width: 800,
        height: 600,
        fps: 60,
        durationInFrames: 420 // 7 steps at 60 frames each
    });

    const spiderItems = [
        { letter: 'S', word: 'Scope', desc: 'Clarify requirements before coding', color: '#ef4444' },
        { letter: 'P', word: 'Plan', desc: 'Structure your solution verbally first', color: '#f97316' },
        { letter: 'I', word: 'Implement', desc: 'Write production-quality code', color: '#eab308' },
        { letter: 'D', word: 'Debug', desc: 'Trace through edge cases', color: '#22c55e' },
        { letter: 'E', word: 'Evaluate', desc: 'Discuss trade-offs honestly', color: '#3b82f6' },
        { letter: 'R', word: 'Refine', desc: 'Optimize with interviewer feedback', color: '#8b5cf6' }
    ];

    // Title
    comp.addLayer(new Layer({
        id: 'title',
        type: 'text',
        keyframes: [
            { frame: 0, value: { x: 400, y: 60, text: 'The SPIDER Framework', fontSize: 36, fontWeight: 'bold', fill: '#f1f5f9', textAnchor: 'middle', opacity: 0 } },
            { frame: 30, value: { x: 400, y: 60, text: 'The SPIDER Framework', fontSize: 36, fontWeight: 'bold', fill: '#f1f5f9', textAnchor: 'middle', opacity: 1 } }
        ]
    }));

    // SPIDER items
    spiderItems.forEach((item, i) => {
        const y = 120 + i * 70;
        const stepStart = 60 + i * 60;

        // Letter
        comp.addLayer(new Layer({
            id: `letter-${item.letter}`,
            type: 'text',
            keyframes: [
                { frame: stepStart, value: { x: 100, y: y + 30, text: item.letter, fontSize: 48, fontWeight: 'bold', fill: item.color, opacity: 0 } },
                { frame: stepStart + 30, value: { x: 100, y: y + 30, text: item.letter, fontSize: 48, fontWeight: 'bold', fill: item.color, opacity: 1 } }
            ]
        }));

        // Word
        comp.addLayer(new Layer({
            id: `word-${item.letter}`,
            type: 'text',
            keyframes: [
                { frame: stepStart, value: { x: 160, y: y + 20, text: item.word, fontSize: 24, fontWeight: 'bold', fill: '#f1f5f9', opacity: 0 } },
                { frame: stepStart + 40, value: { x: 160, y: y + 20, text: item.word, fontSize: 24, fontWeight: 'bold', fill: '#f1f5f9', opacity: 1 } }
            ]
        }));

        // Description
        comp.addLayer(new Layer({
            id: `desc-${item.letter}`,
            type: 'text',
            keyframes: [
                { frame: stepStart, value: { x: 160, y: y + 45, text: item.desc, fontSize: 14, fill: '#94a3b8', opacity: 0 } },
                { frame: stepStart + 50, value: { x: 160, y: y + 45, text: item.desc, fontSize: 14, fill: '#94a3b8', opacity: 1 } }
            ]
        }));
    });

    return comp;
}
