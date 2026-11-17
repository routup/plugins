import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { readHeadingSlugs, readLinks } from '../doc-checks';

const docsRoot = fileURLToPath(new URL('../..', import.meta.url));
const srcRoot = path.join(docsRoot, 'src');
const repoRoot = path.resolve(docsRoot, '..', '..');

const SITE = 'https://plugins.routup.dev';

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
        slugCache.set(page, slugs);
    }

    return slugs;
}

/**
 * The error of one link, or undefined when it resolves. `from` is the page
 * (relative to src/) a same-page anchor refers to.
 */
function checkLink(link: string, from: string | undefined): string | undefined {
    const [target = '', anchor] = link.split('#', 2);
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
            for (const link of readLinks(readFileSync(path.join(srcRoot, page), 'utf8'))) {
                if (/^[a-z]+:/i.test(link)) {
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
