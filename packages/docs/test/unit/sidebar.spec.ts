import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { GUIDE_PAGES, PLUGIN_PAGES } from '../../src/.vitepress/config.mts';
import { buildSidebar, definePluginPages } from '../../src/.vitepress/domains/sidebar';

const srcRoot = fileURLToPath(new URL('../../src', import.meta.url));

/**
 * The folder of the site that holds the guide pages, not a plugin.
 */
const GUIDE_FOLDER = 'guide';

/**
 * The `plugin.group` value of a page's frontmatter.
 */
function readFrontmatterGroup(file: string): string | undefined {
    const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---/.exec(readFileSync(file, 'utf8'))?.[1] ?? '';
    const match = /^\s+group:\s*['"]?(.+?)['"]?\s*$/m.exec(frontmatter);

    return match?.[1];
}

const plugins = [
    {
        name: 'basic',
        group: 'Bundles',
        pages: [{ text: 'Overview', link: '/basic/' }],
    },
    {
        name: 'rate-limit',
        group: 'Operations',
        pages: [
            { text: 'Overview', link: '/rate-limit/' },
            { text: 'Configuration', link: '/rate-limit/configuration' },
        ],
    },
    {
        name: 'cors',
        group: 'Operations',
        pages: [{ text: 'Overview', link: '/cors/' }],
    },
];

const guide = [
    { text: 'Getting Started', link: '/guide/getting-started' },
    { text: 'Combining Plugins', link: '/guide/combining' },
];

const guideGroup = { text: 'Guide', items: guide };

const groups = [
    guideGroup,
    {
        text: 'Overview',
        items: [{ text: 'All plugins', link: '/' }],
    },
    {
        text: 'Bundles',
        items: [{ text: 'basic', link: '/basic/' }],
    },
    {
        text: 'Operations',
        items: [
            { text: 'rate-limit', link: '/rate-limit/' },
            { text: 'cors', link: '/cors/' },
        ],
    },
];

describe('buildSidebar', () => {
    it('shows the guide and the plugin groups at the root and under /guide/', () => {
        const sidebar = buildSidebar(plugins, guide);

        expect(sidebar['/']).toEqual(groups);
        expect(sidebar['/guide/']).toEqual(groups);
    });

    it('puts the guide first and then the pages of a plugin under its own path', () => {
        const sidebar = buildSidebar(plugins, guide);

        expect(sidebar['/rate-limit/']).toEqual([
            guideGroup,
            {
                text: 'rate-limit',
                items: [
                    { text: 'Overview', link: '/rate-limit/' },
                    { text: 'Configuration', link: '/rate-limit/configuration' },
                ],
            },
            ...groups.slice(1),
        ]);
        expect(sidebar['/basic/']?.[1]).toEqual({
            text: 'basic',
            items: [{ text: 'Overview', link: '/basic/' }],
        });
    });

    it('has one key per plugin plus / and /guide/', () => {
        expect(Object.keys(buildSidebar(plugins, guide)).sort()).toEqual(['/', '/basic/', '/cors/', '/guide/', '/rate-limit/']);
    });

    it('rejects a plugin whose first page is not its overview', () => {
        expect(() => buildSidebar([{
            name: 'cors',
            group: 'Operations',
            pages: [{ text: 'Helpers', link: '/cors/helpers' }],
        }], guide)).toThrow('cors: the first page must link to /cors/');
    });
});

describe('GUIDE_PAGES', () => {
    it('lists every page of the guide folder, which has no index page', () => {
        const folder = path.join(srcRoot, GUIDE_FOLDER);
        const files = readdirSync(folder)
            .filter((name) => name.endsWith('.md'))
            .map((name) => `/${GUIDE_FOLDER}/${name.slice(0, -3)}`)
            .sort();

        expect(files).not.toContain(`/${GUIDE_FOLDER}/index`);
        expect(GUIDE_PAGES.map((item) => item.link).sort()).toEqual(files);
    });
});

describe('definePluginPages', () => {
    it('maps page names to titled links', () => {
        expect(definePluginPages('cors', 'Operations', ['index', 'helpers'])).toEqual({
            name: 'cors',
            group: 'Operations',
            pages: [
                { text: 'Overview', link: '/cors/' },
                { text: 'Helpers', link: '/cors/helpers' },
            ],
        });
    });

    it('rejects a page name without a title', () => {
        expect(() => definePluginPages('cors', 'Operations', ['index', 'faq']))
            .toThrow('cors: page "faq" has no entry in PAGE_TITLES');
    });
});

describe('PLUGIN_PAGES', () => {
    it('lists every plugin folder of the site', () => {
        const folders = readdirSync(srcRoot, { withFileTypes: true })
            .filter((item) => item.isDirectory() && !item.name.startsWith('.') && item.name !== GUIDE_FOLDER)
            .map((item) => item.name)
            .sort();

        expect(folders.length).toBeGreaterThan(0);
        expect(PLUGIN_PAGES.map((item) => item.name).sort()).toEqual(folders);

        const missing = folders.filter((name) => !existsSync(path.join(srcRoot, name, 'index.md')));

        expect(missing).toEqual([]);
    });

    it('uses the group of each overview frontmatter', () => {
        const errors = PLUGIN_PAGES
            .map((item) => ({ item, group: readFrontmatterGroup(path.join(srcRoot, item.name, 'index.md')) }))
            .filter(({ item, group }) => group !== item.group)
            .map(({ item, group }) => `${item.name}: sidebar group "${item.group}", frontmatter plugin.group "${group}"`);

        expect(errors).toEqual([]);
    });
});
