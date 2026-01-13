/**
 * Lesson Visuals - Video 01: Why You Keep Failing Interviews
 * State-Based Animation Scenes
 * 
 * Modern Dark Mode / Product UI Design
 * Color Palette: Slate/Inter theme
 * - Background: #0f172a (darkest)
 * - Cards: #1e293b with #334155 border
 * - Accents: #38bdf8 (Blue), #f43f5e (Rose), #10b981 (Emerald)
 */

// ==========================================================================
// COLOR PALETTE
// ==========================================================================

const COLORS = {
    bg: {
        dark: '#0f172a',
        card: '#1e293b',
        cardLight: '#334155',
        overlay: 'rgba(15, 23, 42, 0.9)'
    },
    accent: {
        blue: '#38bdf8',
        rose: '#f43f5e',
        emerald: '#10b981',
        amber: '#f59e0b',
        violet: '#8b5cf6',
        cyan: '#22d3ee'
    },
    text: {
        primary: '#f8fafc',
        secondary: '#94a3b8',
        muted: '#64748b'
    }
};

// ==========================================================================
// SCALING FOR 4K RESOLUTION
// ==========================================================================

// Font sizes should be 2.5x larger for 4K (3840x2400) than web (1536x960)
const FONT_SCALE = 2.5;

// Safe zone: 10% margin on all sides to prevent cutoff
const SAFE = {
    left: 10,   // Min X position
    right: 90,  // Max X position
    top: 10,    // Min Y position
    bottom: 90, // Max Y position
    centerX: 50,
    centerY: 50
};

// Stroke widths also need scaling for visibility
const STROKE_SCALE = 2;

// Standard shadow for depth
const SHADOW = { blur: 40, color: 'rgba(0, 0, 0, 0.5)', offset: { x: 0, y: 20 } };
const SHADOW_GLOW = (color) => ({ blur: 60, color: color, offset: { x: 0, y: 0 } });

/**
 * Create all visual scenes for this lesson
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
// HOOK SECTION - Code Window with Progress Bar
// ==========================================================================

export const hookTransitionScene = {
    id: 'hook-transition',
    duration: 800,
    background: COLORS.bg.dark,

    steps: [
        // Step 1: Code window appears with "300+ Problems Solved"
        {
            id: 'step1',
            duration: 800,
            objects: [
                // Window Frame
                {
                    id: 'code-window',
                    type: 'group',
                    props: {
                        x: 50, y: 50,
                        z: 0,
                        opacity: 1,
                        shadow: SHADOW
                    },
                    children: [
                        // Window background
                        {
                            id: 'window-bg',
                            type: 'rect',
                            props: {
                                x: 0, y: 0,
                                width: 50, height: 35,
                                fill: COLORS.bg.card,
                                stroke: COLORS.bg.cardLight,
                                strokeWidth: 2,
                                rx: 12
                            }
                        },
                        // Title bar
                        {
                            id: 'title-bar',
                            type: 'rect',
                            props: {
                                x: 0, y: -14,
                                width: 50, height: 6,
                                fill: COLORS.bg.cardLight,
                                rx: 0
                            }
                        },
                        // macOS buttons
                        {
                            id: 'btn-close',
                            type: 'circle',
                            props: { x: -20, y: -14, radius: 1.2, fill: COLORS.accent.rose }
                        },
                        {
                            id: 'btn-min',
                            type: 'circle',
                            props: { x: -16, y: -14, radius: 1.2, fill: COLORS.accent.amber }
                        },
                        {
                            id: 'btn-max',
                            type: 'circle',
                            props: { x: -12, y: -14, radius: 1.2, fill: COLORS.accent.emerald }
                        }
                    ]
                },
                // Progress bar (LeetCode progress)
                {
                    id: 'progress-bg',
                    type: 'rect',
                    props: {
                        x: 50, y: 42,
                        width: 40, height: 2,
                        fill: COLORS.bg.cardLight,
                        rx: 4,
                        z: 1
                    }
                },
                {
                    id: 'progress-fill',
                    type: 'rect',
                    props: {
                        x: 35, y: 42,
                        width: 30, height: 2,
                        fill: COLORS.accent.emerald,
                        rx: 4,
                        z: 2,
                        shadow: SHADOW_GLOW('rgba(16, 185, 129, 0.4)')
                    }
                },
                // Counter text
                {
                    id: 'counter',
                    type: 'text',
                    props: {
                        x: 50, y: 50,
                        text: '300+',
                        fontSize: 120,
                        fontWeight: 'bold',
                        fill: COLORS.accent.emerald,
                        z: 3,
                        shadow: SHADOW_GLOW('rgba(16, 185, 129, 0.3)')
                    }
                },
                {
                    id: 'subtitle',
                    type: 'text',
                    props: {
                        x: 50, y: 62,
                        text: 'LeetCode Problems Solved',
                        fontSize: 36,
                        fill: COLORS.text.secondary
                    }
                }
            ]
        },

        // Step 2: Interview question appears, code window shrinks
        {
            id: 'step2',
            duration: 800,
            objects: [
                {
                    id: 'code-window',
                    props: { y: 30, scale: 0.6, opacity: 0.5, z: -2 }
                },
                { id: 'progress-bg', props: { y: 28, opacity: 0.3 } },
                { id: 'progress-fill', props: { y: 28, opacity: 0.3 } },
                { id: 'counter', props: { y: 30, opacity: 0.4, scale: 0.5 } },
                { id: 'subtitle', props: { y: 38, opacity: 0.3 } },
                // Interview card
                {
                    id: 'interview-card',
                    type: 'rect',
                    props: {
                        x: 50, y: 65,
                        width: 55, height: 20,
                        fill: COLORS.bg.card,
                        stroke: COLORS.accent.rose,
                        strokeWidth: 2,
                        rx: 12,
                        z: 5,
                        shadow: SHADOW
                    }
                },
                {
                    id: 'interview-icon',
                    type: 'text',
                    props: {
                        x: 28, y: 65,
                        text: '❌',
                        fontSize: 48,
                        z: 6
                    }
                },
                {
                    id: 'interview-text',
                    type: 'text',
                    props: {
                        x: 55, y: 63,
                        text: '"Design a payment system',
                        fontSize: 28,
                        fill: COLORS.text.primary,
                        z: 6
                    }
                },
                {
                    id: 'interview-text2',
                    type: 'text',
                    props: {
                        x: 55, y: 70,
                        text: 'handling 10k TPS..."',
                        fontSize: 28,
                        fill: COLORS.accent.rose,
                        z: 6
                    }
                }
            ]
        },

        // Step 3: Reveal "Both Sides" insight
        {
            id: 'step3',
            duration: 600,
            objects: [
                { id: 'code-window', props: { y: 20, scale: 0.4, opacity: 0.2, z: -5 } },
                { id: 'progress-bg', props: { opacity: 0 } },
                { id: 'progress-fill', props: { opacity: 0 } },
                { id: 'counter', props: { y: 20, opacity: 0.2, scale: 0.3 } },
                { id: 'subtitle', props: { opacity: 0 } },
                { id: 'interview-card', props: { y: 45, opacity: 0.5, z: 0 } },
                { id: 'interview-icon', props: { y: 45, opacity: 0.4 } },
                { id: 'interview-text', props: { y: 43, opacity: 0.4 } },
                { id: 'interview-text2', props: { y: 50, opacity: 0.4 } },
                // Insight card
                {
                    id: 'insight-card',
                    type: 'rect',
                    props: {
                        x: 50, y: 72,
                        width: 50, height: 18,
                        fill: COLORS.bg.card,
                        stroke: COLORS.accent.blue,
                        strokeWidth: 2,
                        rx: 12,
                        z: 10,
                        shadow: SHADOW_GLOW('rgba(56, 189, 248, 0.3)')
                    }
                },
                {
                    id: 'insight-icon',
                    type: 'text',
                    props: {
                        x: 30, y: 72,
                        text: '💡',
                        fontSize: 42,
                        z: 11
                    }
                },
                {
                    id: 'insight-text',
                    type: 'text',
                    props: {
                        x: 55, y: 72,
                        text: "I've Been On Both Sides",
                        fontSize: 32,
                        fontWeight: 'bold',
                        fill: COLORS.accent.blue,
                        z: 11
                    }
                }
            ]
        }
    ]
};

// ==========================================================================
// DONUT CHART - The 30/70 Split with Glow
// ==========================================================================

export const pieChartScene = {
    id: 'pie-chart',
    duration: 1000,
    background: COLORS.bg.dark,

    steps: [
        // Step 1: 30% segment glows
        {
            id: 'step1',
            duration: 800,
            objects: [
                // Donut ring (background)
                {
                    id: 'donut-bg',
                    type: 'circle',
                    props: {
                        x: 40, y: 50,
                        radius: 18,
                        fill: 'transparent',
                        stroke: COLORS.bg.cardLight,
                        strokeWidth: 8,
                        z: 0
                    }
                },
                // 30% arc (emerald)
                {
                    id: 'arc-30',
                    type: 'path',
                    props: {
                        x: 40, y: 50,
                        d: createArcPath(18, -90, 18), // 30% = 108 degrees, but 30/100*360 = 108. Let's use 30% as approx 18 deg offset
                        fill: 'transparent',
                        stroke: COLORS.accent.emerald,
                        strokeWidth: 8,
                        z: 2,
                        shadow: SHADOW_GLOW('rgba(16, 185, 129, 0.5)')
                    }
                },
                // Label card
                {
                    id: 'label-30-card',
                    type: 'rect',
                    props: {
                        x: 72, y: 35,
                        width: 22, height: 12,
                        fill: COLORS.bg.card,
                        stroke: COLORS.accent.emerald,
                        strokeWidth: 2,
                        rx: 8,
                        z: 3
                    }
                },
                {
                    id: 'label-30-pct',
                    type: 'text',
                    props: {
                        x: 72, y: 33,
                        text: '30%',
                        fontSize: 36,
                        fontWeight: 'bold',
                        fill: COLORS.accent.emerald,
                        z: 4
                    }
                },
                {
                    id: 'label-30-desc',
                    type: 'text',
                    props: {
                        x: 72, y: 40,
                        text: 'LeetCode Skills',
                        fontSize: 18,
                        fill: COLORS.text.secondary,
                        z: 4
                    }
                }
            ]
        },

        // Step 2: 70% segment appears
        {
            id: 'step2',
            duration: 1000,
            objects: [
                { id: 'donut-bg', props: {} },
                { id: 'arc-30', props: { opacity: 0.6 } },
                { id: 'label-30-card', props: { opacity: 0.6 } },
                { id: 'label-30-pct', props: { opacity: 0.6 } },
                { id: 'label-30-desc', props: { opacity: 0.6 } },
                // 70% arc (rose)
                {
                    id: 'arc-70',
                    type: 'path',
                    props: {
                        x: 40, y: 50,
                        d: createArcPath(18, 18, 270), // Remaining arc
                        fill: 'transparent',
                        stroke: COLORS.accent.rose,
                        strokeWidth: 8,
                        z: 2,
                        shadow: SHADOW_GLOW('rgba(244, 63, 94, 0.5)')
                    }
                },
                // Label card
                {
                    id: 'label-70-card',
                    type: 'rect',
                    props: {
                        x: 72, y: 60,
                        width: 25, height: 14,
                        fill: COLORS.bg.card,
                        stroke: COLORS.accent.rose,
                        strokeWidth: 2,
                        rx: 8,
                        z: 3
                    }
                },
                {
                    id: 'label-70-pct',
                    type: 'text',
                    props: {
                        x: 72, y: 57,
                        text: '70%',
                        fontSize: 42,
                        fontWeight: 'bold',
                        fill: COLORS.accent.rose,
                        z: 4
                    }
                },
                {
                    id: 'label-70-desc',
                    type: 'text',
                    props: {
                        x: 72, y: 66,
                        text: 'System Design',
                        fontSize: 18,
                        fill: COLORS.text.secondary,
                        z: 4
                    }
                }
            ]
        }
    ]
};

// ==========================================================================
// KILLER #1 - Race Condition Collision Cards
// ==========================================================================

export const killer1Scene = {
    id: 'killer1-animation',
    duration: 800,
    background: COLORS.bg.dark,

    steps: [
        // Step 1: Two transaction cards appear
        {
            id: 'step1',
            duration: 600,
            objects: [
                // Title
                {
                    id: 'title',
                    type: 'text',
                    props: {
                        x: 50, y: 15,
                        text: 'Interview Killer #1',
                        fontSize: 42,
                        fontWeight: 'bold',
                        fill: COLORS.accent.rose,
                        z: 10
                    }
                },
                {
                    id: 'subtitle',
                    type: 'text',
                    props: {
                        x: 50, y: 23,
                        text: 'The Implementation Gap',
                        fontSize: 28,
                        fill: COLORS.text.secondary,
                        z: 10
                    }
                },
                // Transaction Card 1 (left)
                {
                    id: 'tx-card-1',
                    type: 'group',
                    props: {
                        x: 30, y: 55,
                        z: 5,
                        rotation: -5,
                        shadow: SHADOW
                    },
                    children: [
                        {
                            id: 'tx-bg-1',
                            type: 'rect',
                            props: {
                                width: 25, height: 20,
                                fill: COLORS.bg.card,
                                stroke: COLORS.accent.blue,
                                strokeWidth: 2,
                                rx: 10
                            }
                        },
                        {
                            id: 'tx-icon-1',
                            type: 'text',
                            props: { y: -4, text: '💳', fontSize: 36 }
                        },
                        {
                            id: 'tx-label-1',
                            type: 'text',
                            props: { y: 5, text: 'TX-001', fontSize: 20, fill: COLORS.text.primary }
                        },
                        {
                            id: 'tx-amount-1',
                            type: 'text',
                            props: { y: 11, text: '$500', fontSize: 24, fontWeight: 'bold', fill: COLORS.accent.blue }
                        }
                    ]
                },
                // Transaction Card 2 (right)
                {
                    id: 'tx-card-2',
                    type: 'group',
                    props: {
                        x: 70, y: 55,
                        z: 5,
                        rotation: 5,
                        shadow: SHADOW
                    },
                    children: [
                        {
                            id: 'tx-bg-2',
                            type: 'rect',
                            props: {
                                width: 25, height: 20,
                                fill: COLORS.bg.card,
                                stroke: COLORS.accent.violet,
                                strokeWidth: 2,
                                rx: 10
                            }
                        },
                        {
                            id: 'tx-icon-2',
                            type: 'text',
                            props: { y: -4, text: '💳', fontSize: 36 }
                        },
                        {
                            id: 'tx-label-2',
                            type: 'text',
                            props: { y: 5, text: 'TX-002', fontSize: 20, fill: COLORS.text.primary }
                        },
                        {
                            id: 'tx-amount-2',
                            type: 'text',
                            props: { y: 11, text: '$500', fontSize: 24, fontWeight: 'bold', fill: COLORS.accent.violet }
                        }
                    ]
                }
            ]
        },

        // Step 2: Cards collide (race condition!)
        {
            id: 'step2',
            duration: 600,
            objects: [
                { id: 'title', props: {} },
                { id: 'subtitle', props: {} },
                // Cards move toward center
                {
                    id: 'tx-card-1',
                    props: { x: 45, rotation: 0, z: 8 }
                },
                {
                    id: 'tx-card-2',
                    props: { x: 55, rotation: 0, z: 7 }
                },
                // Collision effect
                {
                    id: 'collision-glow',
                    type: 'circle',
                    props: {
                        x: 50, y: 55,
                        radius: 8,
                        fill: 'transparent',
                        stroke: COLORS.accent.rose,
                        strokeWidth: 3,
                        z: 15,
                        shadow: SHADOW_GLOW('rgba(244, 63, 94, 0.6)')
                    }
                },
                {
                    id: 'collision-text',
                    type: 'text',
                    props: {
                        x: 50, y: 80,
                        text: '⚡ RACE CONDITION',
                        fontSize: 32,
                        fontWeight: 'bold',
                        fill: COLORS.accent.rose,
                        z: 15
                    }
                }
            ]
        },

        // Step 3: Error state
        {
            id: 'step3',
            duration: 600,
            objects: [
                { id: 'title', props: {} },
                { id: 'subtitle', props: {} },
                { id: 'tx-card-1', props: { x: 45, opacity: 0.4 } },
                { id: 'tx-card-2', props: { x: 55, opacity: 0.4 } },
                { id: 'collision-glow', props: { radius: 15, opacity: 0.3 } },
                { id: 'collision-text', props: { y: 75 } },
                // Error card
                {
                    id: 'error-card',
                    type: 'rect',
                    props: {
                        x: 50, y: 55,
                        width: 40, height: 15,
                        fill: COLORS.accent.rose,
                        rx: 10,
                        z: 20,
                        shadow: SHADOW
                    }
                },
                {
                    id: 'error-text',
                    type: 'text',
                    props: {
                        x: 50, y: 55,
                        text: '❌ Balance: -$500',
                        fontSize: 28,
                        fontWeight: 'bold',
                        fill: COLORS.text.primary,
                        z: 21
                    }
                }
            ]
        }
    ]
};

// ==========================================================================
// KILLER #2 - Scaling Problems
// ==========================================================================

export const killer2Scene = {
    id: 'killer2-animation',
    duration: 800,
    background: COLORS.bg.dark,

    steps: [
        // Step 1: Single server
        {
            id: 'step1',
            duration: 600,
            objects: [
                {
                    id: 'title',
                    type: 'text',
                    props: {
                        x: 50, y: 15,
                        text: 'Interview Killer #2',
                        fontSize: 42,
                        fontWeight: 'bold',
                        fill: COLORS.accent.amber,
                        z: 10
                    }
                },
                {
                    id: 'subtitle',
                    type: 'text',
                    props: {
                        x: 50, y: 23,
                        text: 'The Scaling Nightmare',
                        fontSize: 28,
                        fill: COLORS.text.secondary,
                        z: 10
                    }
                },
                // Single server
                {
                    id: 'server',
                    type: 'group',
                    props: {
                        x: 50, y: 55,
                        z: 5,
                        shadow: SHADOW
                    },
                    children: [
                        {
                            type: 'rect',
                            props: {
                                width: 20, height: 25,
                                fill: COLORS.bg.card,
                                stroke: COLORS.accent.emerald,
                                strokeWidth: 2,
                                rx: 8
                            }
                        },
                        {
                            type: 'text',
                            props: { y: -6, text: '🖥️', fontSize: 32 }
                        },
                        {
                            type: 'text',
                            props: { y: 4, text: 'Server', fontSize: 18, fill: COLORS.text.primary }
                        },
                        {
                            type: 'text',
                            props: { y: 10, text: '100 TPS', fontSize: 16, fill: COLORS.accent.emerald }
                        }
                    ]
                }
            ]
        },

        // Step 2: Traffic spike
        {
            id: 'step2',
            duration: 800,
            objects: [
                { id: 'title', props: {} },
                { id: 'subtitle', props: {} },
                {
                    id: 'server',
                    props: { rotation: 5 }
                },
                // Traffic arrows
                {
                    id: 'traffic-1',
                    type: 'text',
                    props: { x: 20, y: 55, text: '→', fontSize: 48, fill: COLORS.accent.rose, z: 3 }
                },
                {
                    id: 'traffic-2',
                    type: 'text',
                    props: { x: 25, y: 45, text: '→', fontSize: 48, fill: COLORS.accent.rose, z: 3 }
                },
                {
                    id: 'traffic-3',
                    type: 'text',
                    props: { x: 22, y: 65, text: '→', fontSize: 48, fill: COLORS.accent.rose, z: 3 }
                },
                {
                    id: 'spike-label',
                    type: 'text',
                    props: {
                        x: 50, y: 80,
                        text: '📈 10,000 TPS Incoming!',
                        fontSize: 28,
                        fill: COLORS.accent.rose,
                        z: 10
                    }
                }
            ]
        },

        // Step 3: Server crash
        {
            id: 'step3',
            duration: 600,
            objects: [
                { id: 'title', props: {} },
                { id: 'subtitle', props: {} },
                {
                    id: 'server',
                    props: { rotation: 15, opacity: 0.5 }
                },
                { id: 'traffic-1', props: { x: 35 } },
                { id: 'traffic-2', props: { x: 38 } },
                { id: 'traffic-3', props: { x: 36 } },
                { id: 'spike-label', props: { opacity: 0.5 } },
                {
                    id: 'crash',
                    type: 'text',
                    props: {
                        x: 50, y: 55,
                        text: '💥',
                        fontSize: 72,
                        z: 20
                    }
                },
                {
                    id: 'crash-label',
                    type: 'text',
                    props: {
                        x: 50, y: 75,
                        text: 'SERVER CRASHED',
                        fontSize: 36,
                        fontWeight: 'bold',
                        fill: COLORS.accent.rose,
                        z: 20
                    }
                }
            ]
        }
    ]
};

// ==========================================================================
// KILLER #3 - Edge Cases
// ==========================================================================

export const killer3Scene = {
    id: 'killer3-animation',
    duration: 800,
    background: COLORS.bg.dark,

    steps: [
        // Step 1: Clean code
        {
            id: 'step1',
            duration: 600,
            objects: [
                {
                    id: 'title',
                    type: 'text',
                    props: {
                        x: 50, y: 15,
                        text: 'Interview Killer #3',
                        fontSize: 42,
                        fontWeight: 'bold',
                        fill: COLORS.accent.violet,
                        z: 10
                    }
                },
                {
                    id: 'subtitle',
                    type: 'text',
                    props: {
                        x: 50, y: 23,
                        text: 'The Edge Case Trap',
                        fontSize: 28,
                        fill: COLORS.text.secondary,
                        z: 10
                    }
                },
                // Code block
                {
                    id: 'code-card',
                    type: 'rect',
                    props: {
                        x: 50, y: 55,
                        width: 50, height: 30,
                        fill: COLORS.bg.card,
                        stroke: COLORS.accent.emerald,
                        strokeWidth: 2,
                        rx: 10,
                        z: 5,
                        shadow: SHADOW
                    }
                },
                {
                    id: 'code-check',
                    type: 'text',
                    props: {
                        x: 50, y: 50,
                        text: '✓ Solution Works',
                        fontSize: 32,
                        fill: COLORS.accent.emerald,
                        z: 6
                    }
                },
                {
                    id: 'code-status',
                    type: 'text',
                    props: {
                        x: 50, y: 60,
                        text: 'All tests passing',
                        fontSize: 22,
                        fill: COLORS.text.secondary,
                        z: 6
                    }
                }
            ]
        },

        // Step 2: Edge case appears
        {
            id: 'step2',
            duration: 600,
            objects: [
                { id: 'title', props: {} },
                { id: 'subtitle', props: {} },
                {
                    id: 'code-card',
                    props: { stroke: COLORS.accent.amber }
                },
                {
                    id: 'code-check',
                    props: { text: '⚠️ Wait...', fill: COLORS.accent.amber }
                },
                {
                    id: 'code-status',
                    props: { text: 'Interviewer asks:', fill: COLORS.text.muted }
                },
                {
                    id: 'edge-case',
                    type: 'text',
                    props: {
                        x: 50, y: 78,
                        text: '"What if the array is empty?"',
                        fontSize: 28,
                        fill: COLORS.accent.rose,
                        z: 10
                    }
                }
            ]
        },

        // Step 3: Crash
        {
            id: 'step3',
            duration: 600,
            objects: [
                { id: 'title', props: {} },
                { id: 'subtitle', props: {} },
                {
                    id: 'code-card',
                    props: { stroke: COLORS.accent.rose }
                },
                {
                    id: 'code-check',
                    props: { text: '❌ FAILED', fill: COLORS.accent.rose }
                },
                {
                    id: 'code-status',
                    props: { text: 'NullPointerException', fill: COLORS.accent.rose, fontFamily: 'monospace' }
                },
                {
                    id: 'edge-case',
                    props: { opacity: 0.5 }
                },
                {
                    id: 'rejection',
                    type: 'text',
                    props: {
                        x: 50, y: 85,
                        text: '💔 REJECTED',
                        fontSize: 36,
                        fontWeight: 'bold',
                        fill: COLORS.accent.rose,
                        z: 20
                    }
                }
            ]
        }
    ]
};

// ==========================================================================
// SPIDER FRAMEWORK - FIXED LAYOUT (proper spacing)
// ==========================================================================

export const spiderFrameworkScene = {
    id: 'spider-framework',
    duration: 800,
    background: COLORS.bg.dark,

    steps: [
        // Step 1: Title Only
        {
            id: 'step1',
            duration: 600,
            objects: [
                {
                    id: 'main-title',
                    type: 'text',
                    props: {
                        x: 50, y: 40,
                        text: 'The SPIDER Framework',
                        fontSize: 52,
                        fontWeight: 'bold',
                        fill: COLORS.accent.cyan,
                        z: 10,
                        shadow: SHADOW_GLOW('rgba(34, 211, 238, 0.4)')
                    }
                },
                {
                    id: 'main-subtitle',
                    type: 'text',
                    props: {
                        x: 50, y: 50,
                        text: 'Your System Design Secret Weapon',
                        fontSize: 28,
                        fill: COLORS.text.secondary,
                        z: 10
                    }
                }
            ]
        },

        // Step 2: S - Scope (y: 20, height 9 -> occupies ~15.5-24.5%)
        {
            id: 'step2',
            duration: 500,
            objects: [
                { id: 'main-title', props: { y: 8, fontSize: 36 } },
                { id: 'main-subtitle', props: { opacity: 0 } },
                {
                    id: 'card-s',
                    type: 'group',
                    props: { x: 50, y: 20, z: 10, shadow: SHADOW },
                    children: [
                        { type: 'rect', props: { width: 50, height: 9, fill: COLORS.bg.card, stroke: COLORS.accent.emerald, strokeWidth: 2, rx: 8 } },
                        { type: 'text', props: { x: -28, text: 'S', fontSize: 32, fontWeight: 'bold', fill: COLORS.accent.emerald } },
                        { type: 'text', props: { x: 5, text: 'Scope: Clarify requirements', fontSize: 22, fill: COLORS.text.primary } }
                    ]
                }
            ]
        },

        // Step 3: P - Plan (y: 32, gap of 3% from previous card)
        {
            id: 'step3',
            duration: 500,
            objects: [
                { id: 'main-title', props: { y: 8, fontSize: 36 } },
                { id: 'card-s', props: { y: 20, z: 5, opacity: 0.7 } },
                {
                    id: 'card-p',
                    type: 'group',
                    props: { x: 50, y: 32, z: 10, shadow: SHADOW },
                    children: [
                        { type: 'rect', props: { width: 50, height: 9, fill: COLORS.bg.card, stroke: COLORS.accent.blue, strokeWidth: 2, rx: 8 } },
                        { type: 'text', props: { x: -28, text: 'P', fontSize: 32, fontWeight: 'bold', fill: COLORS.accent.blue } },
                        { type: 'text', props: { x: 5, text: 'Plan: Structure verbally', fontSize: 22, fill: COLORS.text.primary } }
                    ]
                }
            ]
        },

        // Step 4: I - Implement (y: 44)
        {
            id: 'step4',
            duration: 500,
            objects: [
                { id: 'main-title', props: { y: 8, fontSize: 36 } },
                { id: 'card-s', props: { opacity: 0.5 } },
                { id: 'card-p', props: { z: 5, opacity: 0.7 } },
                {
                    id: 'card-i',
                    type: 'group',
                    props: { x: 50, y: 44, z: 10, shadow: SHADOW },
                    children: [
                        { type: 'rect', props: { width: 50, height: 9, fill: COLORS.bg.card, stroke: COLORS.accent.violet, strokeWidth: 2, rx: 8 } },
                        { type: 'text', props: { x: -28, text: 'I', fontSize: 32, fontWeight: 'bold', fill: COLORS.accent.violet } },
                        { type: 'text', props: { x: 5, text: 'Implement: Production code', fontSize: 22, fill: COLORS.text.primary } }
                    ]
                }
            ]
        },

        // Step 5: D - Debug (y: 56)
        {
            id: 'step5',
            duration: 500,
            objects: [
                { id: 'main-title', props: { y: 8, fontSize: 36 } },
                { id: 'card-i', props: { z: 5, opacity: 0.7 } },
                {
                    id: 'card-d',
                    type: 'group',
                    props: { x: 50, y: 56, z: 10, shadow: SHADOW },
                    children: [
                        { type: 'rect', props: { width: 50, height: 9, fill: COLORS.bg.card, stroke: COLORS.accent.amber, strokeWidth: 2, rx: 8 } },
                        { type: 'text', props: { x: -28, text: 'D', fontSize: 32, fontWeight: 'bold', fill: COLORS.accent.amber } },
                        { type: 'text', props: { x: 5, text: 'Debug: Trace edge cases', fontSize: 22, fill: COLORS.text.primary } }
                    ]
                }
            ]
        },

        // Step 6: E - Evaluate (y: 68)
        {
            id: 'step6',
            duration: 500,
            objects: [
                { id: 'main-title', props: { y: 8, fontSize: 36 } },
                { id: 'card-d', props: { z: 5, opacity: 0.7 } },
                {
                    id: 'card-e',
                    type: 'group',
                    props: { x: 50, y: 68, z: 10, shadow: SHADOW },
                    children: [
                        { type: 'rect', props: { width: 50, height: 9, fill: COLORS.bg.card, stroke: COLORS.accent.rose, strokeWidth: 2, rx: 8 } },
                        { type: 'text', props: { x: -28, text: 'E', fontSize: 32, fontWeight: 'bold', fill: COLORS.accent.rose } },
                        { type: 'text', props: { x: 5, text: 'Evaluate: Trade-offs', fontSize: 22, fill: COLORS.text.primary } }
                    ]
                }
            ]
        },

        // Step 7: R - Refine (y: 80)
        {
            id: 'step7',
            duration: 500,
            objects: [
                { id: 'main-title', props: { y: 8, fontSize: 36 } },
                { id: 'card-e', props: { z: 5, opacity: 0.7 } },
                {
                    id: 'card-r',
                    type: 'group',
                    props: { x: 50, y: 80, z: 10, shadow: SHADOW },
                    children: [
                        { type: 'rect', props: { width: 50, height: 9, fill: COLORS.bg.card, stroke: COLORS.accent.cyan, strokeWidth: 2, rx: 8 } },
                        { type: 'text', props: { x: -28, text: 'R', fontSize: 32, fontWeight: 'bold', fill: COLORS.accent.cyan } },
                        { type: 'text', props: { x: 5, text: 'Refine: Optimize', fontSize: 22, fill: COLORS.text.primary } }
                    ]
                }
            ]
        }
    ]
};

// ==========================================================================
// HELPER FUNCTIONS
// ==========================================================================

/**
 * Create an arc path for donut chart
 */
function createArcPath(radius, startAngle, endAngle) {
    const start = polarToCartesian(0, 0, radius, endAngle);
    const end = polarToCartesian(0, 0, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;

    return [
        'M', start.x, start.y,
        'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y
    ].join(' ');
}

function polarToCartesian(cx, cy, radius, angleDeg) {
    const angleRad = (angleDeg - 90) * Math.PI / 180;
    return {
        x: cx + radius * Math.cos(angleRad),
        y: cy + radius * Math.sin(angleRad)
    };
}
