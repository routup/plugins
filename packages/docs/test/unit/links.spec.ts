import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isActive } from 'vitepress/dist/client/shared.js';
import { describe, expect, it } from 'vitest';
import config from '../../src/.vitepress/config.mts';
import { readFrontmatterLinks, readHeadingSlugs, readLinks } from '../doc-checks';

const docsRoot = fileURLToPath(new URL('../..', import.meta.url));
const srcRoot = path.join(docsRoot, 'src');
const repoRoot = path.resolve(docsRoot, '..', '..');

const SITE = 'https://plugins.routup.dev';

type NavItem = {
    text: string;
    link: string;
    activeMatch?: string;
};

/**
 * Anchors a page gets from a component instead of a heading: page ->
 * component file (relative to src/) and the ids it renders.
 */
const COMPONENT_ANCHORS: Record<string, { component: string; ids: string[] }> = { 'index.md': { component: '.vitepress/components/home/PluginsGrid.vue', ids: ['plugins'] } };

/**
 * Every page the site had before the plugin pages were reorganised (commit
 * b8958d3). READMEs published to npm with older releases link to them, so
 * each must stay a page or become a redirect file under src/public.
 */
const PUBLISHED_PAGES = [
    'assets/configuration',
    'assets/index',
    'basic/configuration',
    'basic/index',
    'body/configuration',
    'body/helpers',
    'body/index',
    'cookie/helpers',
    'cookie/index',
    'cors/helpers',
    'cors/index',
    'decorators/controllers',
    'decorators/index',
    'decorators/parameters',
    'i18n/index',
    'index',
    'logger/helpers',
    'logger/index',
    'prometheus/configuration',
    'prometheus/index',
    'query/helpers',
    'query/index',
    'rate-limit-redis/index',
    'rate-limit/configuration',
    'rate-limit/index',
    'swagger-ui/index',
];

/**
 * The target of the `<meta http-equiv="refresh">` of a redirect file.
 */
function readRedirectTarget(html: string): string | undefined {
    return /<meta\s+http-equiv="refresh"\s+content="0;\s*url=([^"]+)"/i.exec(html)?.[1];
}

/**
 * The Markdown pages of the site, relative to src/.
 */
function readPages(): string[] {
    return (readdirSync(srcRoot, { recursive: true }) as string[])
        .filter((file) => file.endsWith('.md') && !file.startsWith('.vitepress'))
        .map((file) => file.split(path.sep).join('/'))
        .sort();
}

const slugCache = new Map<string, Set<string>>();

function readSlugs(page: string): Set<string> {
    let slugs = slugCache.get(page);

    if (!slugs) {
        slugs = readHeadingSlugs(readFileSync(path.join(srcRoot, page), 'utf8'));
        COMPONENT_ANCHORS[page]?.ids.forEach((id) => slugs!.add(id));
        slugCache.set(page, slugs);
    }

    return slugs;
}

/**
 * The error of one link, or undefined when it resolves. `from` is the page
 * (relative to src/) a same-page anchor refers to.
 */
function checkLink(link: string, from: string | undefined): string | undefined {
    const [target = '', anchor] = (link.startsWith(SITE) ? link.slice(SITE.length) || '/' : link).split('#', 2);
    let page: string;

    if (target === '') {
        if (!from) {
            return 'a same-page anchor outside the site';
        }

        page = from;
    } else if (target.startsWith('/')) {
        if (/\.(md|html)$/.test(target)) {
            return 'has an extension';
        }

        page = target.endsWith('/') ? `${target.slice(1)}index.md` : `${target.slice(1)}.md`;

        if (!existsSync(path.join(srcRoot, page))) {
            return `no page src/${page}`;
        }
    } else {
        return 'not root-relative';
    }

    if (anchor !== undefined && !readSlugs(page).has(anchor)) {
        return `no heading with the anchor #${anchor} on ${page}`;
    }

    return undefined;
}

describe('links', () => {
    const pages = readPages();

    it('finds the pages and their links', () => {
        expect(pages).toContain('index.md');
        expect(pages).toContain('guide/getting-started.md');
        expect(pages.flatMap((page) => readLinks(readFileSync(path.join(srcRoot, page), 'utf8'))).length).toBeGreaterThan(100);
    });

    it('resolves every internal link of the docs pages to a page and a heading', () => {
        const errors: string[] = [];

        for (const page of pages) {
            const markdown = readFileSync(path.join(srcRoot, page), 'utf8');

            for (const link of [...readFrontmatterLinks(markdown), ...readLinks(markdown)]) {
                if (/^[a-z]+:/i.test(link) && !link.startsWith(`${SITE}/`) && link !== SITE) {
                    continue;
                }

                const error = checkLink(link, page);

                if (error) {
                    errors.push(`src/${page}: ${link}: ${error}`);
                }
            }
        }

        expect(errors).toEqual([]);
    });

    it('renders the component anchors it relies on', () => {
        for (const { component, ids } of Object.values(COMPONENT_ANCHORS)) {
            const source = readFileSync(path.join(srcRoot, component), 'utf8');

            for (const id of ids) {
                expect(source, `${component}: id="${id}"`).toContain(`id="${id}"`);
            }
        }
    });

    it('resolves every internal link of the nav, the sidebar and the footer', () => {
        type Item = { link?: string; items?: Item[] };

        const theme = config.themeConfig as {
            nav: Item[];
            sidebar: Record<string, Item[]>;
            rtFooter: { columns: { links: Item[] }[] };
        };
        const collect = (items: Item[]): string[] => items.flatMap((item) => [
            ...(item.link ? [item.link] : []),
            ...collect(item.items ?? []),
        ]);
        const links = [
            ...collect(theme.nav),
            ...Object.values(theme.sidebar).flatMap((groups) => collect(groups)),
            ...theme.rtFooter.columns.flatMap((column) => collect(column.links)),
        ];
        const errors = links
            .filter((link) => !/^[a-z]+:/i.test(link))
            .map((link) => ({ link, error: checkLink(link, undefined) }))
            .filter(({ error }) => !!error)
            .map(({ link, error }) => `config.mts: ${link}: ${error}`);

        expect(links.length).toBeGreaterThan(30);
        expect(errors).toEqual([]);
    });

    it('points the nav, the footer and the landing hero at the plugins page', () => {
        const theme = config.themeConfig as { nav: NavItem[]; rtFooter: { columns: { links: NavItem[] }[] } };
        const footer = theme.rtFooter.columns.flatMap((column) => column.links);
        const hero = readFrontmatterLinks(readFileSync(path.join(srcRoot, 'index.md'), 'utf8'));

        expect(theme.nav.find((item) => item.text === 'Plugins')?.link).toBe('/plugins');
        expect(footer.filter((item) => item.text === 'All plugins').map((item) => item.link)).toEqual(['/plugins']);
        expect(hero).toContain('/plugins');
    });

    it('highlights the Plugins nav entry on the plugins page and on every plugin page only', () => {
        const { nav } = config.themeConfig as { nav: NavItem[] };
        const isNavActive = (text: string, relativePath: string) => {
            const item = nav.find((entry) => entry.text === text)!;

            return isActive(relativePath, item.activeMatch || item.link, !!item.activeMatch);
        };
        const pluginPages = pages.filter((page) => page.includes('/') && !page.startsWith('guide/'));
        const otherPages = ['index.md', '404.md', ...pages.filter((page) => page.startsWith('guide/'))];

        expect(pluginPages.length).toBeGreaterThan(13);

        for (const page of ['plugins.md', ...pluginPages]) {
            expect(isNavActive('Plugins', page), page).toBe(true);
            expect(isNavActive('Guide', page), page).toBe(false);
        }

        for (const page of otherPages) {
            expect(isNavActive('Plugins', page), page).toBe(false);
        }
    });

    it('resolves every docs site link of the READMEs to a page and a heading', () => {
        const readmes = [
            'README.md',
            ...readdirSync(path.join(repoRoot, 'packages'))
                .map((folder) => `packages/${folder}/README.md`)
                .filter((file) => existsSync(path.join(repoRoot, file))),
        ];
        const errors: string[] = [];
        let count = 0;

        for (const readme of readmes) {
            const text = readFileSync(path.join(repoRoot, readme), 'utf8');

            for (const match of text.matchAll(/https:\/\/plugins\.routup\.dev(\/[^\s)"'<>]*)?/g)) {
                const link = match[1] ?? '/';
                const error = checkLink(link, undefined);

                count++;

                if (error) {
                    errors.push(`${readme}: ${SITE}${match[1] ?? ''}: ${error}`);
                }
            }
        }

        expect(count).toBeGreaterThan(readmes.length);
        expect(errors).toEqual([]);
    });

    it('keeps every page published before the reorganisation, as a page or a redirect', () => {
        const errors: string[] = [];

        for (const page of PUBLISHED_PAGES) {
            if (existsSync(path.join(srcRoot, `${page}.md`))) {
                continue;
            }

            const redirect = path.join(srcRoot, 'public', `${page}.html`);

            if (!existsSync(redirect)) {
                errors.push(`${page}: neither src/${page}.md nor src/public/${page}.html exists`);

                continue;
            }

            const target = readRedirectTarget(readFileSync(redirect, 'utf8'));

            if (!target) {
                errors.push(`src/public/${page}.html: no meta refresh`);

                continue;
            }

            const error = checkLink(target, undefined);

            if (error) {
                errors.push(`src/public/${page}.html: ${target}: ${error}`);
            }
        }

        expect(errors).toEqual([]);
    });
});
