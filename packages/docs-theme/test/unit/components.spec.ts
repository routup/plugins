import type { Component } from 'vue';
import { createSSRApp, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { describe, expect, it } from 'vitest';

import RtCard from '../../src/components/RtCard.vue';
import RtCodePanel from '../../src/components/RtCodePanel.vue';
import RtLogo from '../../src/components/RtLogo.vue';
import RtMethodBadge from '../../src/components/RtMethodBadge.vue';
import RtSection from '../../src/components/RtSection.vue';

function render(component: Component, props: Record<string, unknown> = {}, slot?: string) {
    const app = createSSRApp({ render: () => h(component, props, slot ? () => slot : undefined) });

    return renderToString(app);
}

describe('RtSection', () => {
    it('renders the surface class and an inner container', async () => {
        const html = await render(RtSection, { surface: 'aurora' }, 'body');

        expect(html).toContain('rt-section--aurora');
        expect(html).toContain('rt-container');
        expect(html).toContain('body');
    });
});

describe('RtCard', () => {
    it('renders an external link with rel="noopener"', async () => {
        const html = await render(RtCard, { href: 'https://plugins.routup.dev/cors/' }, 'cors');

        expect(html).toContain('<a');
        expect(html).toContain('rel="noopener"');
        expect(html).toContain('target="_blank"');
    });

    it('renders no link without href', async () => {
        const html = await render(RtCard, {}, 'plain');

        expect(html).not.toContain('<a');
        expect(html).toContain('plain');
    });
});

describe('RtCodePanel', () => {
    it('renders only the active tab code and every tab label', async () => {
        const html = await render(RtCodePanel, {
            tabs: [
                { label: 'Install', code: 'npm install routup' },
                { label: 'Define', code: 'const app = new App();' },
            ],
            active: 1,
        });

        expect(html).toContain('const app = new App();');
        expect(html).not.toContain('npm install routup');
        expect(html).toContain('Install');
        expect(html).toContain('Define');
    });
});

describe('RtMethodBadge', () => {
    it('renders the method', async () => {
        const html = await render(RtMethodBadge, { method: 'GET' });

        expect(html).toContain('GET');
    });

    it('renders an unknown method', async () => {
        const html = await render(RtMethodBadge, { method: 'TRACE' });

        expect(html).toContain('TRACE');
    });
});

describe('RtLogo', () => {
    it('gives every instance its own gradient id', async () => {
        const app = createSSRApp({ render: () => [h(RtLogo), h(RtLogo)] });
        const html = await renderToString(app);

        const ids = html.matchAll(/<linearGradient id="([^"]+)"/g).map((match) => match[1]).toArray();

        expect(ids).toHaveLength(2);
        expect(ids[0]).not.toBe(ids[1]);
        expect(html).toContain(`url(#${ids[0]})`);
        expect(html).toContain(`url(#${ids[1]})`);
    });
});
