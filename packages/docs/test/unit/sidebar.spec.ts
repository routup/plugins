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
 * The folder VitePress copies to the site root as is (redirect files).
 */
const PUBLIC_FOLDER = 'public';

/**
 * The `plugin.group` value of a page's frontmatter: the `group:` key
 * indented under the top-level `plugin:` key.
 */
function readFrontmatterGroup(markdown: string): string | undefined {
    const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---/.exec(markdown)?.[1] ?? '';
    const lines = frontmatter.split(/\r?\n/);
    const start = lines.findIndex((line) => /^plugin:\s*$/.test(line));

    if (start === -1) {
        return undefined;
    }

    for (const line of lines.slice(start + 1)) {
        if (/^\S/.test(line)) {
            break;
        }

        const match = /^\s+group:\s*(['"]?)(.+?)\1\s*$/.exec(line);

        if (match) {
            return match[2];
        }
    }

    return undefined;
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

describe('readFrontmatterGroup', () => {
    it('reads the group of the plugin block only', () => {
        expect(readFrontmatterGroup([
            '---',
            'title: CORS',
            'plugin:',
            '    package: \'@routup/cors\'',
            '    group: \'Operations\'',
            '---',
        ].join('\n'))).toBe('Operations');

        expect(readFrontmatterGroup([
            '---',
            'plugin:',
            '    package: \'@routup/cors\'',
            '',
            'meta:',
            '    group: Wrong',
            '---',
        ].join('\n'))).toBeUndefined();

        expect(readFrontmatterGroup([
            '---',
            'plugin:',
            '    package: \'@routup/cors\'',
            '',
            'group: Top',
            '---',
        ].join('\n'))).toBeUndefined();

        expect(readFrontmatterGroup([
            '---',
            'hero:',
            '    group: Wrong',
            '---',
        ].join('\n'))).toBeUndefined();
    });
});

describe('PLUGIN_PAGES', () => {
    it('lists every plugin folder of the site', () => {
        const folders = readdirSync(srcRoot, { withFileTypes: true })
            .filter((item) => item.isDirectory() && !item.name.startsWith('.') && item.name !== GUIDE_FOLDER && item.name !== PUBLIC_FOLDER)
            .map((item) => item.name)
            .sort();

        expect(folders.length).toBeGreaterThan(0);
        expect(PLUGIN_PAGES.map((item) => item.name).sort()).toEqual(folders);

        const missing = folders.filter((name) => !existsSync(path.join(srcRoot, name, 'index.md')));

        expect(missing).toEqual([]);
    });

    it('uses the group of each overview frontmatter', () => {
        const errors = PLUGIN_PAGES
            .map((item) => ({ item, group: readFrontmatterGroup(readFileSync(path.join(srcRoot, item.name, 'index.md'), 'utf8')) }))
            .filter(({ item, group }) => group !== item.group)
            .map(({ item, group }) => `${item.name}: sidebar group "${item.group}", frontmatter plugin.group "${group}"`);

        expect(errors).toEqual([]);
    });
});
