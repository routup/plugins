import type { Component } from 'vue';
import { createSSRApp, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { describe, expect, it } from 'vitest';

import RtButton from '../../src/components/RtButton.vue';
import RtCard from '../../src/components/RtCard.vue';
import RtCodePanel from '../../src/components/RtCodePanel.vue';
import RtHeading from '../../src/components/RtHeading.vue';
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

describe('RtHeading', () => {
    it('renders the highlight after the title, inside the heading, in the gradient', async () => {
        const html = await render(RtHeading, { title: 'Write it once.', highlight: 'Run it anywhere.' });
        // Drop Vue's SSR fragment markers.
        const markup = html.replace(/<!--[^>]*-->/g, '');

        expect(markup).toMatch(/<h2[^>]*>Write it once\. <span class="rt-heading__highlight">Run it anywhere\.<\/span><\/h2>/);
    });

    it('renders no highlight span without a highlight', async () => {
        const html = await render(RtHeading, { title: 'Routing' });

        expect(html).toContain('Routing');
        expect(html).not.toContain('rt-heading__highlight');
    });

    it('renders the highlight as text, not markup', async () => {
        const html = await render(RtHeading, { title: 'A', highlight: '<b>x</b>' });

        expect(html).toContain('&lt;b&gt;x&lt;/b&gt;');
    });
});

describe('RtCard', () => {
    it('renders an external link with rel="noopener"', async () => {
        const html = await render(RtCard, { href: 'https://plugins.routup.dev/cors/' }, 'cors');

        expect(html).toContain('<a');
        expect(html).toContain('rel="noopener"');
        expect(html).toContain('target="_blank"');
    });

    it('treats a protocol-relative link as external', async () => {
        const html = await render(RtCard, { href: '//plugins.routup.dev/cors/' }, 'cors');

        expect(html).toContain('target="_blank"');
    });

    it('renders no link without href', async () => {
        const html = await render(RtCard, {}, 'plain');

        expect(html).not.toContain('<a');
        expect(html).toContain('plain');
    });
});

describe('RtButton', () => {
    it('opens an external link in a new tab', async () => {
        const html = await render(RtButton, { href: 'https://github.com/routup/plugins' }, 'GitHub');

        expect(html).toContain('target="_blank"');
        expect(html).toContain('rel="noopener"');
    });

    it('keeps an internal link in the same tab', async () => {
        const html = await render(RtButton, { href: '#plugins' }, 'Browse');

        expect(html).not.toContain('target=');
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

    it('clamps active to the tab range', async () => {
        const tabs = [
            { label: 'Install', code: 'npm install routup' },
            { label: 'Define', code: 'const app = new App();' },
        ];

        const past = await render(RtCodePanel, { tabs, active: 5 });

        expect(past).toContain('const app = new App();');
        expect(past).toMatch(/aria-selected="true"[^>]*>.*Define/);

        const negative = await render(RtCodePanel, { tabs, active: -1 });

        expect(negative).toContain('npm install routup');
        expect(negative).toMatch(/aria-selected="true"[^>]*>.*Install/);
    });

    it('makes only the active tab focusable', async () => {
        const html = await render(RtCodePanel, {
            tabs: [
                { label: 'Install', code: 'npm install routup' },
                { label: 'Define', code: 'const app = new App();' },
                { label: 'Serve', code: 'serve(app);' },
            ],
            active: 1,
        });

        const tabindexes = html.matchAll(/role="tab"[^>]*tabindex="(-?\d)"/g).map((match) => match[1]).toArray();

        expect(tabindexes).toEqual(['-1', '0', '-1']);
    });

    it('keeps the file label outside the tablist', async () => {
        const html = await render(RtCodePanel, {
            title: 'app.ts',
            tabs: [{ label: 'Install', code: 'npm install routup' }],
        });

        const tablist = html.match(/<div[^>]*role="tablist"[^>]*>(.*?)<\/div>/)?.[1] ?? '';

        expect(html).toContain('app.ts');
        expect(tablist).not.toContain('app.ts');
    });

    it('makes the code focusable for keyboard scrolling', async () => {
        const html = await render(RtCodePanel, { code: 'a' });

        expect(html).toMatch(/<pre[^>]*tabindex="0"/);
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
