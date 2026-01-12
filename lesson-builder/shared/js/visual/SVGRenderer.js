/**
 * SVGRenderer - Render Compositions as SVG
 * Lesson Builder System
 */

export class SVGRenderer {
    /**
     * Create an SVG renderer
     * @param {Composition} composition - The composition to render
     */
    constructor(composition) {
        this.composition = composition;
        this.svgNS = 'http://www.w3.org/2000/svg';
    }

    /**
     * Render a specific frame as an SVG string
     * @param {number} frameIndex
     * @returns {string} SVG markup
     */
    renderFrame(frameIndex) {
        const frameState = this.composition.getFrameState(frameIndex);

        let svg = `<svg xmlns="${this.svgNS}" viewBox="0 0 ${frameState.width} ${frameState.height}" width="${frameState.width}" height="${frameState.height}">`;

        // Background
        if (frameState.background) {
            svg += `<rect x="0" y="0" width="${frameState.width}" height="${frameState.height}" fill="${frameState.background}"/>`;
        }

        // Render each layer
        frameState.layers.forEach(layer => {
            svg += this.renderLayer(layer);
        });

        svg += '</svg>';
        return svg;
    }

    /**
     * Render a single layer as SVG markup
     * @param {Object} layerState - Layer state at current frame
     * @returns {string}
     */
    renderLayer(layerState) {
        const attrs = this._buildAttributes(layerState);

        switch (layerState.type) {
            case 'rect':
                return `<rect ${attrs}/>`;

            case 'circle':
                return `<circle ${attrs}/>`;

            case 'ellipse':
                return `<ellipse ${attrs}/>`;

            case 'line':
                return `<line ${attrs}/>`;

            case 'path':
                return `<path ${attrs}/>`;

            case 'polygon':
                return `<polygon ${attrs}/>`;

            case 'polyline':
                return `<polyline ${attrs}/>`;

            case 'text':
                const text = layerState.text || '';
                return `<text ${attrs}>${this._escapeXml(text)}</text>`;

            case 'image':
                return `<image ${attrs}/>`;

            case 'group':
                let group = `<g ${attrs}>`;
                if (layerState.children) {
                    layerState.children.forEach(child => {
                        group += this.renderLayer(child);
                    });
                }
                group += '</g>';
                return group;

            default:
                return '';
        }
    }

    /**
     * Build attribute string from layer state
     * @private
     */
    _buildAttributes(state) {
        const attrs = [];

        // Common attributes
        if (state.id) attrs.push(`id="${state.id}"`);
        if (state.fill) attrs.push(`fill="${state.fill}"`);
        if (state.stroke) attrs.push(`stroke="${state.stroke}"`);
        if (state.strokeWidth) attrs.push(`stroke-width="${state.strokeWidth}"`);
        if (state.opacity !== undefined) attrs.push(`opacity="${state.opacity}"`);
        if (state.transform) attrs.push(`transform="${state.transform}"`);

        // Type-specific attributes
        switch (state.type) {
            case 'rect':
                if (state.x !== undefined) attrs.push(`x="${state.x}"`);
                if (state.y !== undefined) attrs.push(`y="${state.y}"`);
                if (state.width !== undefined) attrs.push(`width="${state.width}"`);
                if (state.height !== undefined) attrs.push(`height="${state.height}"`);
                if (state.rx !== undefined) attrs.push(`rx="${state.rx}"`);
                if (state.ry !== undefined) attrs.push(`ry="${state.ry}"`);
                break;

            case 'circle':
                if (state.cx !== undefined) attrs.push(`cx="${state.cx}"`);
                if (state.cy !== undefined) attrs.push(`cy="${state.cy}"`);
                if (state.r !== undefined) attrs.push(`r="${state.r}"`);
                break;

            case 'ellipse':
                if (state.cx !== undefined) attrs.push(`cx="${state.cx}"`);
                if (state.cy !== undefined) attrs.push(`cy="${state.cy}"`);
                if (state.rx !== undefined) attrs.push(`rx="${state.rx}"`);
                if (state.ry !== undefined) attrs.push(`ry="${state.ry}"`);
                break;

            case 'line':
                if (state.x1 !== undefined) attrs.push(`x1="${state.x1}"`);
                if (state.y1 !== undefined) attrs.push(`y1="${state.y1}"`);
                if (state.x2 !== undefined) attrs.push(`x2="${state.x2}"`);
                if (state.y2 !== undefined) attrs.push(`y2="${state.y2}"`);
                break;

            case 'path':
                if (state.d) attrs.push(`d="${state.d}"`);
                break;

            case 'polygon':
            case 'polyline':
                if (state.points) attrs.push(`points="${state.points}"`);
                break;

            case 'text':
                if (state.x !== undefined) attrs.push(`x="${state.x}"`);
                if (state.y !== undefined) attrs.push(`y="${state.y}"`);
                if (state.fontSize) attrs.push(`font-size="${state.fontSize}"`);
                if (state.fontFamily) attrs.push(`font-family="${state.fontFamily}"`);
                if (state.fontWeight) attrs.push(`font-weight="${state.fontWeight}"`);
                if (state.textAnchor) attrs.push(`text-anchor="${state.textAnchor}"`);
                if (state.dominantBaseline) attrs.push(`dominant-baseline="${state.dominantBaseline}"`);
                break;

            case 'image':
                if (state.x !== undefined) attrs.push(`x="${state.x}"`);
                if (state.y !== undefined) attrs.push(`y="${state.y}"`);
                if (state.width !== undefined) attrs.push(`width="${state.width}"`);
                if (state.height !== undefined) attrs.push(`height="${state.height}"`);
                if (state.href) attrs.push(`href="${state.href}"`);
                break;
        }

        return attrs.join(' ');
    }

    /**
     * Escape XML special characters
     * @private
     */
    _escapeXml(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }

    /**
     * Render frame to SVG DOM element
     * @param {number} frameIndex
     * @returns {SVGSVGElement}
     */
    renderFrameToElement(frameIndex) {
        const svgString = this.renderFrame(frameIndex);
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgString, 'image/svg+xml');
        return doc.documentElement;
    }

    /**
     * Convert frame to PNG blob
     * @param {number} frameIndex
     * @param {number} [scale=1] - Scale factor for output
     * @returns {Promise<Blob>}
     */
    async toPNG(frameIndex, scale = 1) {
        const svgString = this.renderFrame(frameIndex);
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        return new Promise((resolve, reject) => {
            const img = new Image();

            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = this.composition.width * scale;
                canvas.height = this.composition.height * scale;

                const ctx = canvas.getContext('2d');
                ctx.scale(scale, scale);
                ctx.drawImage(img, 0, 0);

                canvas.toBlob(blob => {
                    URL.revokeObjectURL(url);
                    resolve(blob);
                }, 'image/png');
            };

            img.onerror = (err) => {
                URL.revokeObjectURL(url);
                reject(err);
            };

            img.src = url;
        });
    }

    /**
     * Get SVG as data URL
     * @param {number} frameIndex
     * @returns {string}
     */
    toDataURL(frameIndex) {
        const svgString = this.renderFrame(frameIndex);
        const encoded = btoa(unescape(encodeURIComponent(svgString)));
        return `data:image/svg+xml;base64,${encoded}`;
    }
}
