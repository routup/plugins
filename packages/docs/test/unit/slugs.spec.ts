import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createMarkdownRenderer } from 'vitepress';
import { describe, expect, it } from 'vitest';
import { readHeadingSlugs } from '../doc-checks';

const srcRoot = fileURLToPath(new URL('../../src', import.meta.url));

function readPages(): string[] {
    return (readdirSync(srcRoot, { recursive: true }) as string[])
        .map((file) => file.split(path.sep).join('/'))
        .filter((file) => file.endsWith('.md') && !file.startsWith('.vitepress'))
        .sort();
}

/**
 * The ids VitePress gives the headings of a rendered page.
 */
function readRenderedIds(html: string): string[] {
    return html.matchAll(/<h[1-6][^>]*\sid="([^"]+)"/g).map((match) => decodeURIComponent(match[1]!)).toArray();
}

describe('readHeadingSlugs', () => {
    it('gives every heading the id VitePress renders', async () => {
        const md = await createMarkdownRenderer(srcRoot, {}, '/', { warn: () => {} });
        const errors: string[] = [];
        let count = 0;

        for (const page of readPages()) {
            const file = path.join(srcRoot, page);
            const html = md.render(readFileSync(file, 'utf8'), {
                path: file,
                relativePath: page,
                cleanUrls: true,
            });
            const rendered = readRenderedIds(html);
            const read = [...readHeadingSlugs(readFileSync(file, 'utf8'))];

            count += rendered.length;

            if (rendered.join('\n') !== read.join('\n')) {
                errors.push(`src/${page}: rendered ${rendered.join(', ')}; read ${read.join(', ')}`);
            }
        }

        expect(count).toBeGreaterThan(300);
        expect(errors).toEqual([]);
    });
});
