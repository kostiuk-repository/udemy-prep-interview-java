/**
 * Demo Scene - State-Based Animation Engine Test
 * Lesson Builder System
 * 
 * This demo showcases all features:
 * - State-based transitions
 * - Groups with children
 * - Connection arrows
 * - Z-depth and shadows
 * - Text and shapes
 */

import { Position } from './VisualEngine.js';

/**
 * Microservices Architecture Demo Scene
 */
export const demoScene = {
    id: 'microservices_demo',
    duration: 1500, // Default transition duration
    background: '#0a0a1a',

    steps: [
        // Step 1: Title appears
        {
            id: 'step1_title',
            duration: 1000,
            objects: [
                {
                    id: 'title',
                    type: 'text',
                    props: {
                        x: 50,
                        y: 50,
                        text: 'Microservices Architecture',
                        fontSize: 72,
                        fontWeight: 'bold',
                        fill: '#ffffff',
                        opacity: 1,
                        z: 0,
                        zIndex: 10
                    }
                },
                {
                    id: 'subtitle',
                    type: 'text',
                    props: {
                        x: 50,
                        y: 60,
                        text: 'Building Scalable Systems',
                        fontSize: 32,
                        fill: '#888888',
                        opacity: 1,
                        z: -10,
                        zIndex: 9
                    }
                }
            ]
        },

        // Step 2: Title moves up, services appear
        {
            id: 'step2_services',
            duration: 1500,
            objects: [
                // Title moves to top
                {
                    id: 'title',
                    type: 'text',
                    props: {
                        x: 50,
                        y: 10,
                        text: 'Microservices Architecture',
                        fontSize: 48,
                        fontWeight: 'bold',
                        fill: '#ffffff',
                        opacity: 1,
                        z: -20,
                        zIndex: 10
                    }
                },
                // Subtitle fades out (not included = auto fade out)

                // User Service Group
                {
                    id: 'user_service',
                    type: 'group',
                    props: {
                        x: 25,
                        y: 45,
                        z: 0,
                        scale: 1,
                        opacity: 1,
                        zIndex: 5,
                        shadow: {
                            color: 'rgba(76, 175, 80, 0.4)',
                            blur: 30,
                            offset: { x: 0, y: 10 }
                        }
                    },
                    children: [
                        {
                            type: 'rect',
                            props: {
                                x: 0,
                                y: 0,
                                width: 18,
                                height: 12,
                                fill: '#1b5e20',
                                rx: 12,
                                stroke: '#4CAF50',
                                strokeWidth: 2
                            }
                        },
                        {
                            type: 'text',
                            props: {
                                x: 0,
                                y: -2,
                                text: '👤',
                                fontSize: 48,
                                fill: '#ffffff'
                            }
                        },
                        {
                            type: 'text',
                            props: {
                                x: 0,
                                y: 3,
                                text: 'User Service',
                                fontSize: 20,
                                fontWeight: 'bold',
                                fill: '#ffffff'
                            }
                        }
                    ]
                },

                // Order Service Group
                {
                    id: 'order_service',
                    type: 'group',
                    props: {
                        x: 75,
                        y: 45,
                        z: 0,
                        scale: 1,
                        opacity: 1,
                        zIndex: 5,
                        shadow: {
                            color: 'rgba(255, 152, 0, 0.4)',
                            blur: 30,
                            offset: { x: 0, y: 10 }
                        }
                    },
                    children: [
                        {
                            type: 'rect',
                            props: {
                                x: 0,
                                y: 0,
                                width: 18,
                                height: 12,
                                fill: '#e65100',
                                rx: 12,
                                stroke: '#FF9800',
                                strokeWidth: 2
                            }
                        },
                        {
                            type: 'text',
                            props: {
                                x: 0,
                                y: -2,
                                text: '📦',
                                fontSize: 48,
                                fill: '#ffffff'
                            }
                        },
                        {
                            type: 'text',
                            props: {
                                x: 0,
                                y: 3,
                                text: 'Order Service',
                                fontSize: 20,
                                fontWeight: 'bold',
                                fill: '#ffffff'
                            }
                        }
                    ]
                },

                // Database
                {
                    id: 'database',
                    type: 'group',
                    props: {
                        x: 50,
                        y: 80,
                        z: -30,
                        scale: 0.9,
                        opacity: 1,
                        zIndex: 2,
                        shadow: {
                            color: 'rgba(33, 150, 243, 0.3)',
                            blur: 20,
                            offset: { x: 0, y: 5 }
                        }
                    },
                    children: [
                        {
                            type: 'rect',
                            props: {
                                x: 0,
                                y: 0,
                                width: 12,
                                height: 8,
                                fill: '#0d47a1',
                                rx: 8,
                                stroke: '#2196F3',
                                strokeWidth: 2
                            }
                        },
                        {
                            type: 'text',
                            props: {
                                x: 0,
                                y: -1,
                                text: '🗄️',
                                fontSize: 36,
                                fill: '#ffffff'
                            }
                        },
                        {
                            type: 'text',
                            props: {
                                x: 0,
                                y: 2.5,
                                text: 'Database',
                                fontSize: 16,
                                fill: '#ffffff'
                            }
                        }
                    ]
                }
            ]
        },

        // Step 3: Add connection arrows
        {
            id: 'step3_connections',
            duration: 1000,
            objects: [
                // Keep existing objects
                {
                    id: 'title',
                    type: 'text',
                    props: {
                        x: 50,
                        y: 10,
                        text: 'Microservices Architecture',
                        fontSize: 48,
                        fontWeight: 'bold',
                        fill: '#ffffff',
                        z: -20,
                        zIndex: 10
                    }
                },
                {
                    id: 'user_service',
                    type: 'group',
                    props: {
                        x: 25,
                        y: 45,
                        z: 10, // Bring closer
                        scale: 1,
                        zIndex: 5,
                        shadow: {
                            color: 'rgba(76, 175, 80, 0.5)',
                            blur: 40,
                            offset: { x: 0, y: 15 }
                        }
                    },
                    children: [
                        {
                            type: 'rect',
                            props: {
                                x: 0, y: 0,
                                width: 18, height: 12,
                                fill: '#1b5e20', rx: 12,
                                stroke: '#4CAF50', strokeWidth: 2
                            }
                        },
                        { type: 'text', props: { x: 0, y: -2, text: '👤', fontSize: 48 } },
                        { type: 'text', props: { x: 0, y: 3, text: 'User Service', fontSize: 20, fontWeight: 'bold', fill: '#ffffff' } }
                    ]
                },
                {
                    id: 'order_service',
                    type: 'group',
                    props: {
                        x: 75,
                        y: 45,
                        z: 10, // Bring closer
                        scale: 1,
                        zIndex: 5,
                        shadow: {
                            color: 'rgba(255, 152, 0, 0.5)',
                            blur: 40,
                            offset: { x: 0, y: 15 }
                        }
                    },
                    children: [
                        {
                            type: 'rect',
                            props: {
                                x: 0, y: 0,
                                width: 18, height: 12,
                                fill: '#e65100', rx: 12,
                                stroke: '#FF9800', strokeWidth: 2
                            }
                        },
                        { type: 'text', props: { x: 0, y: -2, text: '📦', fontSize: 48 } },
                        { type: 'text', props: { x: 0, y: 3, text: 'Order Service', fontSize: 20, fontWeight: 'bold', fill: '#ffffff' } }
                    ]
                },
                {
                    id: 'database',
                    type: 'group',
                    props: {
                        x: 50,
                        y: 80,
                        z: -30,
                        scale: 0.9,
                        zIndex: 2,
                        shadow: {
                            color: 'rgba(33, 150, 243, 0.3)',
                            blur: 20,
                            offset: { x: 0, y: 5 }
                        }
                    },
                    children: [
                        {
                            type: 'rect',
                            props: {
                                x: 0, y: 0,
                                width: 12, height: 8,
                                fill: '#0d47a1', rx: 8,
                                stroke: '#2196F3', strokeWidth: 2
                            }
                        },
                        { type: 'text', props: { x: 0, y: -1, text: '🗄️', fontSize: 36 } },
                        { type: 'text', props: { x: 0, y: 2.5, text: 'Database', fontSize: 16, fill: '#ffffff' } }
                    ]
                },

                // Connection: User -> Order
                {
                    id: 'arrow_user_order',
                    type: 'connectionArrow',
                    props: {
                        startTarget: 'user_service',
                        endTarget: 'order_service',
                        startAnchor: 'right',
                        endAnchor: 'left',
                        stroke: '#4CAF50',
                        strokeWidth: 3,
                        arrowSize: 15,
                        curve: 0.1,
                        zIndex: 3
                    }
                },

                // Connection: User -> Database
                {
                    id: 'arrow_user_db',
                    type: 'connectionArrow',
                    props: {
                        startTarget: 'user_service',
                        endTarget: 'database',
                        startAnchor: 'bottom',
                        endAnchor: 'left',
                        stroke: '#2196F3',
                        strokeWidth: 2,
                        arrowSize: 12,
                        curve: 0.2,
                        zIndex: 3
                    }
                },

                // Connection: Order -> Database
                {
                    id: 'arrow_order_db',
                    type: 'connectionArrow',
                    props: {
                        startTarget: 'order_service',
                        endTarget: 'database',
                        startAnchor: 'bottom',
                        endAnchor: 'right',
                        stroke: '#2196F3',
                        strokeWidth: 2,
                        arrowSize: 12,
                        curve: 0.2,
                        zIndex: 3
                    }
                }
            ]
        },

        // Step 4: Highlight communication (zoom effect)
        {
            id: 'step4_highlight',
            duration: 1500,
            objects: [
                {
                    id: 'title',
                    type: 'text',
                    props: {
                        x: 50,
                        y: 8,
                        text: 'Service Communication',
                        fontSize: 42,
                        fontWeight: 'bold',
                        fill: '#4CAF50',
                        z: -20,
                        zIndex: 10
                    }
                },
                {
                    id: 'user_service',
                    type: 'group',
                    props: {
                        x: 20,
                        y: 50,
                        z: 30, // Much closer
                        scale: 1.2,
                        rotation: -5,
                        zIndex: 6,
                        shadow: {
                            color: 'rgba(76, 175, 80, 0.6)',
                            blur: 50,
                            offset: { x: 0, y: 20 }
                        }
                    },
                    children: [
                        {
                            type: 'rect',
                            props: {
                                x: 0, y: 0,
                                width: 18, height: 12,
                                fill: '#2e7d32', rx: 12,
                                stroke: '#81C784', strokeWidth: 3
                            }
                        },
                        { type: 'text', props: { x: 0, y: -2, text: '👤', fontSize: 48 } },
                        { type: 'text', props: { x: 0, y: 3, text: 'User Service', fontSize: 20, fontWeight: 'bold', fill: '#ffffff' } }
                    ]
                },
                {
                    id: 'order_service',
                    type: 'group',
                    props: {
                        x: 80,
                        y: 50,
                        z: 30, // Much closer
                        scale: 1.2,
                        rotation: 5,
                        zIndex: 6,
                        shadow: {
                            color: 'rgba(255, 152, 0, 0.6)',
                            blur: 50,
                            offset: { x: 0, y: 20 }
                        }
                    },
                    children: [
                        {
                            type: 'rect',
                            props: {
                                x: 0, y: 0,
                                width: 18, height: 12,
                                fill: '#ef6c00', rx: 12,
                                stroke: '#FFB74D', strokeWidth: 3
                            }
                        },
                        { type: 'text', props: { x: 0, y: -2, text: '📦', fontSize: 48 } },
                        { type: 'text', props: { x: 0, y: 3, text: 'Order Service', fontSize: 20, fontWeight: 'bold', fill: '#ffffff' } }
                    ]
                },
                {
                    id: 'database',
                    type: 'group',
                    props: {
                        x: 50,
                        y: 85,
                        z: -50, // Push back
                        scale: 0.7,
                        opacity: 0.6,
                        zIndex: 1
                    },
                    children: [
                        {
                            type: 'rect',
                            props: {
                                x: 0, y: 0,
                                width: 12, height: 8,
                                fill: '#0d47a1', rx: 8,
                                stroke: '#2196F3', strokeWidth: 2
                            }
                        },
                        { type: 'text', props: { x: 0, y: -1, text: '🗄️', fontSize: 36 } },
                        { type: 'text', props: { x: 0, y: 2.5, text: 'Database', fontSize: 16, fill: '#ffffff' } }
                    ]
                },
                {
                    id: 'arrow_user_order',
                    type: 'connectionArrow',
                    props: {
                        startTarget: 'user_service',
                        endTarget: 'order_service',
                        startAnchor: 'right',
                        endAnchor: 'left',
                        stroke: '#81C784',
                        strokeWidth: 5,
                        arrowSize: 20,
                        curve: 0,
                        zIndex: 5
                    }
                },
                // Message indicator
                {
                    id: 'message_icon',
                    type: 'text',
                    props: {
                        x: 50,
                        y: 45,
                        text: '📨',
                        fontSize: 64,
                        opacity: 1,
                        z: 50,
                        zIndex: 7
                    }
                }
            ]
        }
    ]
};

/**
 * Simple shape demo for testing individual features
 */
export const shapeDemoScene = {
    id: 'shape_demo',
    duration: 1000,
    background: '#1a1a2e',

    steps: [
        {
            id: 'shapes',
            duration: 500,
            objects: [
                {
                    id: 'rect1',
                    type: 'rect',
                    props: {
                        x: 25, y: 30,
                        width: 15, height: 10,
                        fill: '#e91e63',
                        rx: 8,
                        shadow: { blur: 20, color: 'rgba(233, 30, 99, 0.5)' }
                    }
                },
                {
                    id: 'circle1',
                    type: 'circle',
                    props: {
                        x: 50, y: 30,
                        radius: 8,
                        fill: '#9c27b0',
                        shadow: { blur: 20, color: 'rgba(156, 39, 176, 0.5)' }
                    }
                },
                {
                    id: 'rect2',
                    type: 'rect',
                    props: {
                        x: 75, y: 30,
                        width: 15, height: 10,
                        fill: '#673ab7',
                        rx: 8,
                        shadow: { blur: 20, color: 'rgba(103, 58, 183, 0.5)' }
                    }
                },
                {
                    id: 'text1',
                    type: 'text',
                    props: {
                        x: 50, y: 70,
                        text: 'State-Based Animation Engine',
                        fontSize: 36,
                        fontWeight: 'bold',
                        fill: '#ffffff'
                    }
                }
            ]
        },
        {
            id: 'shapes_moved',
            duration: 1000,
            objects: [
                {
                    id: 'rect1',
                    type: 'rect',
                    props: {
                        x: 25, y: 50, // Moved down
                        width: 15, height: 10,
                        fill: '#f44336', // Color changed
                        rx: 16, // More rounded
                        rotation: 10,
                        shadow: { blur: 30, color: 'rgba(244, 67, 54, 0.6)' }
                    }
                },
                {
                    id: 'circle1',
                    type: 'circle',
                    props: {
                        x: 50, y: 50,
                        radius: 12, // Bigger
                        fill: '#e91e63',
                        z: 20, // Closer
                        shadow: { blur: 30, color: 'rgba(233, 30, 99, 0.6)' }
                    }
                },
                {
                    id: 'rect2',
                    type: 'rect',
                    props: {
                        x: 75, y: 50,
                        width: 15, height: 10,
                        fill: '#9c27b0',
                        rx: 16,
                        rotation: -10,
                        shadow: { blur: 30, color: 'rgba(156, 39, 176, 0.6)' }
                    }
                },
                {
                    id: 'text1',
                    type: 'text',
                    props: {
                        x: 50, y: 80,
                        text: '4K • 60 FPS • WebM Export',
                        fontSize: 28,
                        fill: '#888888'
                    }
                }
            ]
        }
    ]
};
