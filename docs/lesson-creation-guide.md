# Lesson Creation Guide

This guide explains how to create new lessons in the Lesson Builder System.

## Directory Structure

Each lesson lives in its own folder under `lessons/`:

```
lessons/
└── video-01/
    ├── config.js      # Lesson configuration
    ├── visuals.js     # Visual compositions
    └── index.html     # Entry point
```

---

## 1. Configuration File (`config.js`)

The configuration file defines the lesson metadata and all sections with their content.

### Basic Structure

```javascript
export const lessonConfig = {
    id: 'video-01',           // Unique lesson identifier
    title: 'Lesson Title',    // Display title
    type: 'introduction',     // Lesson type
    duration: 420,            // Duration in seconds

    sections: [
        { /* section objects */ }
    ]
};
```

### Root Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✅ | Unique identifier for the lesson (e.g., `video-01`) |
| `title` | string | ✅ | Human-readable lesson title |
| `type` | string | ✅ | Lesson category: `introduction`, `deep-dive`, `practical`, `system-design` |
| `duration` | number | ✅ | Total lesson duration in seconds |
| `sections` | array | ✅ | Array of section objects |

---

### Section Object

Each section represents a logical segment of the lesson.

```javascript
{
    id: 'hook',
    title: 'The Hook',
    timing: '00:00 - 00:30',
    type: 'opening',
    description: 'Purpose of this section',
    
    visual: { /* visual config */ },
    audio: { /* audio config */ },
    production: { /* production notes */ }
}
```

#### Section Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✅ | Unique section ID (used for DOM elements) |
| `title` | string | ✅ | Section title displayed in UI |
| `timing` | string | ✅ | Time range (e.g., `'00:00 - 00:30'`) |
| `type` | string | ✅ | Section type: `opening`, `problem-definition`, `core-content`, `solution`, `credibility`, `closing` |
| `description` | string | ✅ | Brief description of section purpose |
| `visual` | object | ❌ | Visual composition reference |
| `audio` | object | ❌ | Audio/script configuration |
| `production` | object | ❌ | Production notes for editors |

---

### Visual Configuration

Links a section to its visual composition.

```javascript
visual: {
    id: 'hook-transition',      // Must match visuals.js export key
    title: 'LeetCode to Interview Transition',
    steps: 3,                   // Number of animation steps
    
    // Optional: sync points for script highlighting
    syncPoints: [
        { step: 1, highlight: "Text to highlight" },
        { step: 2, highlight: "Another highlight" }
    ]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✅ | Visual ID matching key in `visuals.js` |
| `title` | string | ✅ | Title shown above the visual |
| `steps` | number | ✅ | Total number of animation steps |
| `syncPoints` | array | ❌ | Maps steps to script text highlights |

---

### Audio Configuration

Defines the voice script for the section.

```javascript
audio: {
    file: 'audio/hook-section.mp3',
    script: `Your voice script here.
Can be multi-line.`,
    wordCount: 85,
    estimatedDuration: 30
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | string | ✅ | Path to audio file (relative to lesson folder) |
| `script` | string | ✅ | Voice-over script text |
| `wordCount` | number | ✅ | Word count for reference |
| `estimatedDuration` | number | ✅ | Estimated duration in seconds |

---

### Production Configuration

Notes for video editors.

```javascript
production: {
    pacing: 'fast',
    music: 'dramatic-tense',
    broll: [
        'LeetCode profile screenshot',
        'Zoom interview mockup'
    ],
    transitions: {
        type: 'quick-fade',
        duration: 0.5
    }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `pacing` | string | Speed: `fast`, `medium`, `medium-slow`, `sincere`, `energetic`, `inspiring` |
| `music` | string | Music mood/style descriptor |
| `broll` | array | List of B-roll footage suggestions |
| `transitions.type` | string | Transition style: `fade`, `quick-fade`, `slide-left`, `zoom`, `reveal`, `fade-to-black` |
| `transitions.duration` | number | Transition duration in seconds |

---

## 2. Visuals File (`visuals.js`)

The visuals file creates animated scenes using the State-Based Animation Engine.

### Basic Structure

```javascript
export function createVisuals() {
    return {
        'hook-transition': hookTransitionScene,
        'pie-chart': pieChartScene,
        // ... more scenes
    };
}

export const hookTransitionScene = {
    id: 'hook-transition',
    duration: 800,       // Transition duration in ms
    background: '#1a1a2e',
    
    steps: [
        { id: 'step1', objects: [/* ... */] },
        { id: 'step2', objects: [/* ... */] }
    ]
};
```

> [!IMPORTANT]
> The keys in the returned object must match the `visual.id` values in `config.js`.

---

### Scene Definition

A scene contains steps, each with objects that auto-interpolate between states.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✅ | Unique scene identifier |
| `duration` | number | ✅ | Default transition duration in ms |
| `background` | string | ❌ | Background color (e.g., `'#1a1a2e'`) |
| `steps` | array | ✅ | Array of step objects |

---

### Step Object

Each step defines the visual state of all objects.

```javascript
{
    id: 'step1',
    duration: 800,  // Override scene duration
    objects: [
        { id: 'title', type: 'text', props: { x: 50, y: 30, text: 'Hello' } },
        { id: 'box', type: 'rect', props: { x: 50, y: 60, width: 20, height: 10 } }
    ]
}
```

**Key Behaviors:**
- Objects in next step with same `id` → properties auto-animate
- New objects → fade in (opacity 0→1)
- Removed objects → fade out (opacity 1→0)
- Missing properties → use defaults for smooth interpolation

---

### Object Types

| Type | Description | Key Properties |
|------|-------------|----------------|
| `rect` | Rectangle | `x`, `y`, `width`, `height`, `rx`, `fill`, `stroke`, `opacity` |
| `circle` | Circle | `x`, `y`, `radius`, `fill`, `stroke`, `opacity` |
| `text` | Text element | `x`, `y`, `text`, `fontSize`, `fontWeight`, `fill`, `opacity` |
| `path` | SVG path | `x`, `y`, `d`, `fill`, `stroke`, `opacity` |
| `line` | Line | `x1`, `y1`, `x2`, `y2`, `stroke`, `strokeWidth` |
| `group` | Container | `x`, `y`, `scale`, `rotation`, `opacity`, `children` |
| `connectionArrow` | Smart arrow | `startTarget`, `endTarget`, `startAnchor`, `endAnchor` |

---

### Coordinate System

All coordinates are **percentages (0-100)** of canvas dimensions:

```javascript
props: {
    x: 50,    // Center horizontally (50%)
    y: 25,    // 25% from top
    width: 20, // 20% of canvas width
    height: 10 // 10% of canvas height
}
```

> [!TIP]
> Canvas resolution is **3840×2400** (4K 16:10). Previews render at 0.5x, exports at 1.0x.

---

### Z-Depth (Pseudo-3D)

Use the `z` property for depth effects:

```javascript
props: {
    z: 20,   // Closer (larger), scale = 1.20
    z: 0,    // Neutral
    z: -30   // Farther (smaller), scale = 0.70, slight opacity reduction
}
```

---

### Groups

Groups transform children together:

```javascript
{
    id: 'service-box',
    type: 'group',
    props: {
        x: 25, y: 50,
        scale: 1,
        rotation: 0,
        shadow: { blur: 20, color: 'rgba(0,0,0,0.3)' }
    },
    children: [
        { type: 'rect', props: { width: 15, height: 10, fill: '#3b82f6', rx: 8 } },
        { type: 'text', props: { y: 0, text: 'API Server', fontSize: 14, fill: '#fff' } }
    ]
}
```

---

### Connection Arrows

Smart arrows that connect to target objects:

```javascript
{
    id: 'arrow-1',
    type: 'connectionArrow',
    props: {
        startTarget: 'box-a',      // ID of source object
        endTarget: 'box-b',        // ID of destination object
        startAnchor: 'right',      // 'top' | 'bottom' | 'left' | 'right' | 'center'
        endAnchor: 'left',
        stroke: '#2196F3',
        strokeWidth: 2,
        curve: 0.2                 // Bezier curve amount
    }
}
```

---

### Shadows

Add shadows to any object:

```javascript
props: {
    shadow: {
        blur: 20,
        color: 'rgba(76, 175, 80, 0.4)',
        offset: { x: 0, y: 10 }
    }
}
```

---

### Common Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `x`, `y` | number | 0 | Position (0-100%) |
| `width`, `height` | number | 100 | Size (0-100%) |
| `opacity` | number | 1 | Transparency (0-1) |
| `scale` | number | 1 | Scale factor |
| `rotation` | number | 0 | Rotation in degrees |
| `z` | number | 0 | Depth (affects scale) |
| `zIndex` | number | 0 | Render order |
| `fill` | string | `'#000'` | Fill color |
| `stroke` | string | - | Stroke color |
| `strokeWidth` | number | 1 | Stroke width |

---

## 3. HTML Entry Point (`index.html`)

The HTML file ties everything together.

### Minimal Template

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Video XX: Title | Lesson Builder</title>
    
    <!-- Shared CSS -->
    <link rel="stylesheet" href="../../shared/css/base.css">
    <link rel="stylesheet" href="../../shared/css/components.css">
    <link rel="stylesheet" href="../../shared/css/animations.css">
</head>

<body>
    <!-- Navigation -->
    <div id="topNav"></div>
    <div id="sidebarOverlay" class="sidebar-overlay"></div>
    <div id="timelineSidebar" class="timeline-sidebar"></div>

    <!-- Main Content -->
    <div class="container">
        <div class="lesson-header">
            <h1>Lesson Title</h1>
            <div class="meta">Duration: X:XX | Type: Category</div>
        </div>

        <!-- Section placeholders -->
        <div id="section-hook"></div>
        <div id="section-content"></div>
        <!-- Add more as needed -->
    </div>

    <!-- Initialize -->
    <script type="module">
        import { LessonCore } from '../../shared/js/core/LessonCore.js';
        import { lessonConfig } from './config.js';
        import { createVisuals } from './visuals.js';

        document.addEventListener('DOMContentLoaded', async () => {
            await LessonCore.init(lessonConfig, createVisuals());
        });
    </script>
</body>
</html>
```

> [!NOTE]
> Section `<div>` IDs must match the format `section-{id}` where `{id}` is the section's `id` from config.

---

## Quick Start Checklist

1. [ ] Create lesson folder: `lessons/video-XX/`
2. [ ] Create `config.js` with lesson metadata and sections
3. [ ] Create `visuals.js` with visual compositions
4. [ ] Create `index.html` with proper imports
5. [ ] Ensure visual IDs match between config and visuals files
6. [ ] Add audio files to `lessons/video-XX/audio/`
7. [ ] Test in browser
