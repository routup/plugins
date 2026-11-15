import { createSSRApp, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

import RtFooter from '../../src/components/RtFooter.vue';
import { resolveFooter } from '../../src/footer';
import { isExternalLink } from '../../src/links';

const data = vi.hoisted(() => ({ theme: {} as Record<string, unknown> }));

vi.mock('vitepress', () => ({
    useData: () => ({
        site: { value: { title: 'Routup Plugins' } },
        theme: { value: data.theme },
    }),
    withBase: (path: string) => path,
}));

function renderFooter() {
    return renderToString(createSSRApp({ render: () => h(RtFooter) }));
}

describe('resolveFooter', () => {
    it('returns undefined without rtFooter', () => {
        expect(resolveFooter({})).toBeUndefined();
        expect(resolveFooter(undefined)).toBeUndefined();
    });

    it('drops a column without links', () => {
        const footer = resolveFooter({
            rtFooter: {
                tagline: 'Plugins for routup.',
                columns: [
                    { title: 'Empty', links: [] },
                    { title: 'Docs', links: [{ text: 'All plugins', link: '/' }] },
                ],
            },
        });

        expect(footer?.columns.map((column) => column.title)).toEqual(['Docs']);
    });

    it('throws for a link without link', () => {
        expect(() => resolveFooter({
            rtFooter: {
                tagline: 'Plugins for routup.',
                columns: [
                    { title: 'Docs', links: [{ text: 'All plugins', link: '/' }] },
                    { title: 'Project', links: [{ text: 'GitHub', link: 'https://github.com/routup/plugins' }, { text: 'Releases' }] },
                ],
            },
        })).toThrow('themeConfig.rtFooter.columns[1].links[1].link is missing');
    });
});

describe('isExternalLink', () => {
    it('treats only absolute and protocol-relative URLs as external', () => {
        expect(isExternalLink('/guide/')).toBe(false);
        expect(isExternalLink('https://routup.dev')).toBe(true);
        expect(isExternalLink('http://routup.dev')).toBe(true);
        expect(isExternalLink('//x.dev')).toBe(true);
    });
});

describe('RtFooter', () => {
    beforeEach(() => {
        data.theme = {};
    });

    it('renders nothing without rtFooter', async () => {
        const html = await renderFooter();

        expect(html).not.toContain('<footer');
        expect(html).toBe('<!---->');
    });

    it('renders tagline, columns and note', async () => {
        data.theme = {
            rtFooter: {
                tagline: 'Plugins for routup.',
                columns: [
                    { title: 'Docs', links: [{ text: 'All plugins', link: '/' }] },
                    { title: 'Project', links: [{ text: 'GitHub', link: 'https://github.com/routup/plugins' }] },
                ],
                note: 'MIT licensed',
            },
        };

        const html = await renderFooter();

        expect(html).toContain('<footer');
        expect(html).toContain('Plugins for routup.');
        expect(html).toContain('All plugins');
        expect(html).toContain('MIT licensed');
        expect(html).toMatch(/href="https:\/\/github\.com\/routup\/plugins"[^>]*target="_blank"[^>]*rel="noopener"/);
        expect(html).not.toMatch(/href="\/"[^>]*target=/);
    });

    it('renders columns with the same title and links with the same target', async () => {
        data.theme = {
            rtFooter: {
                tagline: 'Plugins for routup.',
                columns: [
                    { title: 'Docs', links: [{ text: 'Home', link: '/' }, { text: 'Start', link: '/' }] },
                    { title: 'Docs', links: [{ text: 'Plugins', link: '/' }] },
                ],
            },
        };

        const html = await renderFooter();

        expect(html.match(/<nav /g)).toHaveLength(2);
        expect(html).toContain('Home');
        expect(html).toContain('Start');
        expect(html).toContain('Plugins');
    });
});
