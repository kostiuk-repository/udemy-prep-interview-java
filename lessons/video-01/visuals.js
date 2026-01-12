/**
 * Lesson Visuals - Video 01: Why You Keep Failing Interviews
 * State-Based Animation Scenes
 */

/**
 * Create all visual scenes for this lesson
 * @returns {Object} Map of visualId to Scene definition
 */
export function createVisuals() {
    return {
        'hook-transition': hookTransitionScene,
        'pie-chart': pieChartScene,
        'killer1-animation': killer1Scene,
        'killer2-animation': killer2Scene,
        'killer3-animation': killer3Scene,
        'spider-framework': spiderFrameworkScene
    };
}

// ==========================================================================
// HOOK SECTION - LeetCode to Interview Transition
// ==========================================================================

export const hookTransitionScene = {
    id: 'hook-transition',
    duration: 800,
    background: '#1a1a2e',

    steps: [
        // Step 1: "300+ Problems Solved" 
        {
            id: 'step1',
            duration: 600,
            objects: [
                {
                    id: 'leetcode-count',
                    type: 'text',
                    props: {
                        x: 50, y: 35,
                        text: '300+',
                        fontSize: 72,
                        fontWeight: 'bold',
                        fill: '#10b981',
                        opacity: 1
                    }
                },
                {
                    id: 'leetcode-label',
                    type: 'text',
                    props: {
                        x: 50, y: 45,
                        text: 'Problems Solved',
                        fontSize: 24,
                        fill: '#64748b',
                        opacity: 1
                    }
                }
            ]
        },

        // Step 2: Interview question appears
        {
            id: 'step2',
            duration: 800,
            objects: [
                {
                    id: 'leetcode-count',
                    props: { y: 25, opacity: 0.5 }
                },
                {
                    id: 'leetcode-label',
                    props: { y: 35, opacity: 0.5 }
                },
                {
                    id: 'interview-icon',
                    type: 'text',
                    props: {
                        x: 50, y: 55,
                        text: '❌',
                        fontSize: 48,
                        opacity: 1
                    }
                },
                {
                    id: 'interview-question',
                    type: 'text',
                    props: {
                        x: 50, y: 68,
                        text: '"Design a payment system..."',
                        fontSize: 20,
                        fill: '#ef4444',
                        opacity: 1
                    }
                }
            ]
        },

        // Step 3: "Both Sides" reveal
        {
            id: 'step3',
            duration: 600,
            objects: [
                { id: 'leetcode-count', props: { y: 15, opacity: 0.3 } },
                { id: 'leetcode-label', props: { y: 25, opacity: 0.3 } },
                { id: 'interview-icon', props: { y: 45, opacity: 0.6 } },
                { id: 'interview-question', props: { y: 55, opacity: 0.6 } },
                {
                    id: 'both-sides-icon',
                    type: 'text',
                    props: {
                        x: 50, y: 75,
                        text: '💡',
                        fontSize: 36,
                        opacity: 1
                    }
                },
                {
                    id: 'both-sides-text',
                    type: 'text',
                    props: {
                        x: 50, y: 88,
                        text: "I've Been On Both Sides",
                        fontSize: 18,
                        fill: '#2563eb',
                        opacity: 1
                    }
                }
            ]
        }
    ]
};

// ==========================================================================
// PIE CHART - The 30/70 Split
// ==========================================================================

export const pieChartScene = {
    id: 'pie-chart',
    duration: 1000,
    background: '#1a1a2e',

    steps: [
        // Step 1: 30% slice appears
        {
            id: 'step1',
            duration: 800,
            objects: [
                {
                    id: 'slice-30',
                    type: 'path',
                    props: {
                        x: 50, y: 50,
                        d: createPieSlicePath(0, 0, 15, -90, 18),
                        fill: '#10b981',
                        opacity: 1,
                        zIndex: 2
                    }
                },
                {
                    id: 'label-30',
                    type: 'text',
                    props: {
                        x: 62, y: 30,
                        text: '30%',
                        fontSize: 24,
                        fontWeight: 'bold',
                        fill: '#10b981',
                        opacity: 1
                    }
                },
                {
                    id: 'label-30-desc',
                    type: 'text',
                    props: {
                        x: 62, y: 38,
                        text: 'LeetCode',
                        fontSize: 14,
                        fill: '#10b981',
                        opacity: 0.8
                    }
                }
            ]
        },

        // Step 2: 70% slice appears
        {
            id: 'step2',
            duration: 1000,
            objects: [
                {
                    id: 'slice-30',
                    props: { opacity: 1 }
                },
                { id: 'label-30', props: { opacity: 1 } },
                { id: 'label-30-desc', props: { opacity: 1 } },
                {
                    id: 'slice-70',
                    type: 'path',
                    props: {
                        x: 50, y: 50,
                        d: createPieSlicePath(0, 0, 15, 18, 270),
                        fill: '#ef4444',
                        opacity: 1,
                        zIndex: 1
                    }
                },
                {
                    id: 'label-70',
                    type: 'text',
                    props: {
                        x: 38, y: 70,
                        text: '70%',
                        fontSize: 32,
                        fontWeight: 'bold',
                        fill: '#ef4444',
                        opacity: 1
                    }
                },
                {
                    id: 'label-70-desc',
                    type: 'text',
                    props: {
                        x: 38, y: 80,
                        text: 'Real Skills',
                        fontSize: 14,
                        fill: '#ef4444',
                        opacity: 0.8
                    }
                }
            ]
        },

        // Step 3: Emphasis
        {
            id: 'step3',
            duration: 600,
            objects: [
                { id: 'slice-30', props: { opacity: 0.6 } },
                { id: 'label-30', props: { opacity: 0.6 } },
                { id: 'label-30-desc', props: { opacity: 0.5 } },
                { id: 'slice-70', props: { opacity: 1, z: 10 } },
                { id: 'label-70', props: { opacity: 1, fontSize: 36 } },
                { id: 'label-70-desc', props: { opacity: 1 } }
            ]
        }
    ]
};

// ==========================================================================
// KILLER #1 - Business Logic
// ==========================================================================

export const killer1Scene = {
    id: 'killer1-animation',
    duration: 800,
    background: '#1a1a2e',

    steps: [
        // Step 1: Problem card
        {
            id: 'step1',
            objects: [
                {
                    id: 'killer-card',
                    type: 'group',
                    props: {
                        x: 50, y: 20,
                        shadow: { blur: 20, color: 'rgba(239, 68, 68, 0.3)' }
                    },
                    children: [
                        {
                            type: 'rect',
                            props: {
                                width: 85, height: 18,
                                fill: '#334155',
                                stroke: '#ef4444',
                                strokeWidth: 3,
                                rx: 12
                            }
                        },
                        {
                            type: 'text',
                            props: {
                                x: -38, y: 0,
                                text: '#1',
                                fontSize: 36,
                                fontWeight: 'bold',
                                fill: '#ef4444'
                            }
                        },
                        {
                            type: 'text',
                            props: {
                                x: 5, y: -3,
                                text: 'Business Logic Complexity',
                                fontSize: 20,
                                fontWeight: 'bold',
                                fill: '#f1f5f9'
                            }
                        },
                        {
                            type: 'text',
                            props: {
                                x: 5, y: 5,
                                text: '"Implement a money transfer system"',
                                fontSize: 14,
                                fill: '#cbd5e1'
                            }
                        }
                    ]
                }
            ]
        },

        // Step 2: Code block
        {
            id: 'step2',
            objects: [
                { id: 'killer-card', props: { y: 15 } },
                {
                    id: 'code-block',
                    type: 'rect',
                    props: {
                        x: 50, y: 50,
                        width: 85, height: 25,
                        fill: '#0f172a',
                        rx: 8,
                        opacity: 1
                    }
                },
                {
                    id: 'code-text',
                    type: 'text',
                    props: {
                        x: 50, y: 50,
                        text: '// Missing: Transaction safety, idempotency, race conditions...',
                        fontSize: 12,
                        fill: '#94a3b8',
                        opacity: 1
                    }
                }
            ]
        },

        // Step 3: Warning
        {
            id: 'step3',
            objects: [
                { id: 'killer-card', props: { y: 12 } },
                { id: 'code-block', props: { y: 42 } },
                { id: 'code-text', props: { y: 42 } },
                {
                    id: 'warning-box',
                    type: 'group',
                    props: {
                        x: 50, y: 78,
                        shadow: { blur: 15, color: 'rgba(239, 68, 68, 0.4)' }
                    },
                    children: [
                        {
                            type: 'rect',
                            props: {
                                width: 85, height: 18,
                                fill: 'rgba(239, 68, 68, 0.1)',
                                stroke: '#ef4444',
                                strokeWidth: 2,
                                rx: 8
                            }
                        },
                        {
                            type: 'text',
                            props: {
                                x: 0, y: 0,
                                text: '80% of candidates fail this',
                                fontSize: 24,
                                fontWeight: 'bold',
                                fill: '#ef4444'
                            }
                        }
                    ]
                }
            ]
        }
    ]
};

// ==========================================================================
// KILLER #2 - Theory Under Pressure
// ==========================================================================

export const killer2Scene = {
    id: 'killer2-animation',
    duration: 800,
    background: '#1a1a2e',

    steps: [
        // Step 1: Main question
        {
            id: 'step1',
            objects: [
                {
                    id: 'main-question',
                    type: 'text',
                    props: {
                        x: 50, y: 20,
                        text: '"Explain how a HashMap works"',
                        fontSize: 28,
                        fontWeight: 'bold',
                        fill: '#f1f5f9',
                        opacity: 1
                    }
                }
            ]
        },

        // Step 2: Follow-up questions
        {
            id: 'step2',
            objects: [
                { id: 'main-question', props: { y: 15 } },
                {
                    id: 'followup-1',
                    type: 'text',
                    props: {
                        x: 25, y: 40,
                        text: '↳ "What happens with the load factor?"',
                        fontSize: 16,
                        fill: '#cbd5e1',
                        opacity: 1
                    }
                },
                {
                    id: 'followup-2',
                    type: 'text',
                    props: {
                        x: 25, y: 52,
                        text: '↳ "Why is resize O(n) amortized?"',
                        fontSize: 16,
                        fill: '#cbd5e1',
                        opacity: 1
                    }
                },
                {
                    id: 'followup-3',
                    type: 'text',
                    props: {
                        x: 25, y: 64,
                        text: '↳ "How does Java 8 handle collisions?"',
                        fontSize: 16,
                        fill: '#cbd5e1',
                        opacity: 1
                    }
                },
                {
                    id: 'gap-message',
                    type: 'text',
                    props: {
                        x: 50, y: 85,
                        text: 'The gap: KNOWING vs ARTICULATING under pressure',
                        fontSize: 16,
                        fill: '#f97316',
                        opacity: 1
                    }
                }
            ]
        }
    ]
};

// ==========================================================================
// KILLER #3 - System Design
// ==========================================================================

export const killer3Scene = {
    id: 'killer3-animation',
    duration: 800,
    background: '#1a1a2e',

    steps: [
        // Step 1: System boxes
        {
            id: 'step1',
            objects: [
                {
                    id: 'box-lb',
                    type: 'group',
                    props: { x: 25, y: 40 },
                    children: [
                        { type: 'rect', props: { width: 15, height: 12, fill: '#3b82f6', rx: 8 } },
                        { type: 'text', props: { y: 0, text: 'Load\nBalancer', fontSize: 12, fill: '#fff' } }
                    ]
                },
                {
                    id: 'box-api',
                    type: 'group',
                    props: { x: 50, y: 40 },
                    children: [
                        { type: 'rect', props: { width: 15, height: 12, fill: '#10b981', rx: 8 } },
                        { type: 'text', props: { y: 0, text: 'API\nServer', fontSize: 12, fill: '#fff' } }
                    ]
                },
                {
                    id: 'box-db',
                    type: 'group',
                    props: { x: 75, y: 40 },
                    children: [
                        { type: 'rect', props: { width: 15, height: 12, fill: '#f97316', rx: 8 } },
                        { type: 'text', props: { y: 0, text: 'Database', fontSize: 12, fill: '#fff' } }
                    ]
                }
            ]
        },

        // Step 2: Deep dive message
        {
            id: 'step2',
            objects: [
                { id: 'box-lb', props: { opacity: 0.7 } },
                { id: 'box-api', props: { opacity: 0.7 } },
                { id: 'box-db', props: { opacity: 0.7 } },
                {
                    id: 'deep-dive',
                    type: 'text',
                    props: {
                        x: 50, y: 70,
                        text: 'Drawing boxes is easy...',
                        fontSize: 20,
                        fill: '#64748b',
                        opacity: 1
                    }
                },
                {
                    id: 'defend-message',
                    type: 'text',
                    props: {
                        x: 50, y: 82,
                        text: 'DEFENDING your choices is what matters',
                        fontSize: 18,
                        fontWeight: 'bold',
                        fill: '#2563eb',
                        opacity: 1
                    }
                }
            ]
        }
    ]
};

// ==========================================================================
// SPIDER FRAMEWORK
// ==========================================================================

const spiderItems = [
    { letter: 'S', word: 'Scope', desc: 'Clarify requirements before coding', color: '#ef4444' },
    { letter: 'P', word: 'Plan', desc: 'Structure your solution verbally first', color: '#f97316' },
    { letter: 'I', word: 'Implement', desc: 'Write production-quality code', color: '#eab308' },
    { letter: 'D', word: 'Debug', desc: 'Trace through edge cases', color: '#22c55e' },
    { letter: 'E', word: 'Evaluate', desc: 'Discuss trade-offs honestly', color: '#3b82f6' },
    { letter: 'R', word: 'Refine', desc: 'Optimize with interviewer feedback', color: '#8b5cf6' }
];

export const spiderFrameworkScene = {
    id: 'spider-framework',
    duration: 600,
    background: '#1a1a2e',

    steps: [
        // Step 1: Title
        {
            id: 'step1',
            objects: [
                {
                    id: 'title',
                    type: 'text',
                    props: {
                        x: 50, y: 8,
                        text: 'The SPIDER Framework',
                        fontSize: 36,
                        fontWeight: 'bold',
                        fill: '#f1f5f9',
                        opacity: 1
                    }
                }
            ]
        },
        // Steps 2-7: Each SPIDER letter
        ...spiderItems.map((item, i) => ({
            id: `step${i + 2}`,
            duration: 500,
            objects: [
                { id: 'title', props: { opacity: 1 } },
                ...spiderItems.slice(0, i + 1).map((it, j) => ({
                    id: `spider-${it.letter}`,
                    type: 'group',
                    props: {
                        x: 15, y: 18 + j * 12,
                        opacity: 1
                    },
                    children: [
                        {
                            type: 'text',
                            props: {
                                x: 0, y: 0,
                                text: it.letter,
                                fontSize: 36,
                                fontWeight: 'bold',
                                fill: it.color
                            }
                        },
                        {
                            type: 'text',
                            props: {
                                x: 8, y: -2,
                                text: it.word,
                                fontSize: 20,
                                fontWeight: 'bold',
                                fill: '#f1f5f9'
                            }
                        },
                        {
                            type: 'text',
                            props: {
                                x: 8, y: 4,
                                text: it.desc,
                                fontSize: 12,
                                fill: '#94a3b8'
                            }
                        }
                    ]
                }))
            ]
        }))
    ]
};

// ==========================================================================
// HELPER FUNCTIONS
// ==========================================================================

/**
 * Create SVG path for a pie slice (using percentage coordinates)
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
