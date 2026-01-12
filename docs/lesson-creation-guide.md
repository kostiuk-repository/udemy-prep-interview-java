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

The visuals file creates animated compositions using the Visual Engine.

### Basic Structure

```javascript
import { Composition, Layer } from '../../shared/js/visual/VisualEngine.js';
import { easeOutCubic, easeInOutCubic } from '../../shared/js/utils/animation.js';

export function createVisuals() {
    return {
        'hook-transition': createHookTransition(),
        'pie-chart': createPieChart(),
        // ... more visuals
    };
}
```

> [!IMPORTANT]
> The keys in the returned object must match the `visual.id` values in `config.js`.

---

### Composition

A composition is a scene containing animated layers.

```javascript
function createMyVisual() {
    const comp = new Composition({
        width: 800,           // Canvas width in pixels
        height: 500,          // Canvas height in pixels
        fps: 60,              // Frames per second
        durationInFrames: 180 // Total animation frames
    });
    
    comp.addLayer(/* layer */);
    
    return comp;
}
```

#### Composition Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `width` | number | 800 | Canvas width in pixels |
| `height` | number | 600 | Canvas height in pixels |
| `fps` | number | 60 | Frames per second |
| `durationInFrames` | number | **required** | Total frames in animation |

---

### Layer

Layers are the individual animated elements within a composition.

```javascript
comp.addLayer(new Layer({
    id: 'my-text',
    type: 'text',
    keyframes: [
        { frame: 0, value: { x: 100, y: 100, text: 'Hello', opacity: 0 } },
        { frame: 60, value: { x: 100, y: 100, text: 'Hello', opacity: 1 } }
    ]
}).setEasing(easeOutCubic));
```

#### Layer Types

| Type | Description | Key Properties |
|------|-------------|----------------|
| `rect` | Rectangle shape | `x`, `y`, `width`, `height`, `rx`, `fill`, `stroke`, `strokeWidth`, `opacity` |
| `circle` | Circle shape | `cx`, `cy`, `r`, `fill`, `stroke`, `opacity` |
| `text` | Text element | `x`, `y`, `text`, `fontSize`, `fontFamily`, `fontWeight`, `fill`, `textAnchor`, `opacity` |
| `path` | SVG path | `d`, `fill`, `stroke`, `strokeWidth`, `opacity` |
| `line` | Line element | `x1`, `y1`, `x2`, `y2`, `stroke`, `strokeWidth`, `opacity` |
| `image` | Image element | `x`, `y`, `width`, `height`, `href`, `opacity` |

---

### Keyframes

Keyframes define property values at specific frames. The engine interpolates between them.

```javascript
keyframes: [
    { 
        frame: 0,   // Starting frame
        value: {    // Properties at this frame
            x: 0, 
            y: 100, 
            opacity: 0,
            fill: '#ef4444'
        } 
    },
    { 
        frame: 60,  // Ending frame (1 second at 60fps)
        value: { 
            x: 200, 
            y: 100, 
            opacity: 1,
            fill: '#10b981'
        } 
    }
]
```

#### Common Keyframe Properties

| Property | Type | Description |
|----------|------|-------------|
| `x`, `y` | number | Position coordinates |
| `opacity` | number | Transparency (0-1) |
| `fill` | string | Fill color (hex) |
| `stroke` | string | Stroke color (hex) |
| `strokeWidth` | number | Stroke width |
| `fontSize` | number | Text font size |
| `fontWeight` | string | Text weight (`normal`, `bold`) |
| `textAnchor` | string | Text alignment (`start`, `middle`, `end`) |

> [!TIP]
> At **60 fps**: 60 frames = 1 second, 30 frames = 0.5 seconds

---

### Easing Functions

Available easing functions from `shared/js/utils/animation.js`:

```javascript
import { 
    easeOutCubic,    // Fast start, slow end
    easeInOutCubic,  // Slow start and end
    easeOutQuad,     // Quadratic ease out
    easeInQuad       // Quadratic ease in
} from '../../shared/js/utils/animation.js';

// Apply to a layer
new Layer({...}).setEasing(easeOutCubic);
```

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
