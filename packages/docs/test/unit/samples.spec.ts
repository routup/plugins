import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const docsRoot = fileURLToPath(new URL('../..', import.meta.url));
const srcRoot = path.join(docsRoot, 'src');
const examplesRoot = path.join(docsRoot, 'examples');

/**
 * Files under examples/ that the samples read at run time instead of a
 * page including them: folders end with a slash.
 */
const FIXTURES = [
    'assets/legacy/',
    'assets/public/',
    'i18n/locales/',
    'swagger-ui/openapi.json',
];

const INCLUDE = /^<<<\s+@\/\.\.\/examples\/(\S+?)(?:\{[^}]*\}|#\S+|\s.*)?$/;

/**
 * The files under a folder, relative to it.
 */
function list(root: string): string[] {
    return readdirSync(root, { recursive: true, withFileTypes: true })
        .filter((entry) => entry.isFile())
        .map((entry) => path.relative(root, path.join(entry.parentPath, entry.name)).split(path.sep).join('/'))
        .sort();
}

/**
 * Page (relative to src/) -> the example files it includes, relative to
 * examples/.
 */
function readIncludes(): Map<string, string[]> {
    const output = new Map<string, string[]>();

    for (const page of list(srcRoot).filter((file) => file.endsWith('.md') && !file.startsWith('.vitepress'))) {
        const includes = readFileSync(path.join(srcRoot, page), 'utf8')
            .split(/\r?\n/)
            .filter((line) => line.startsWith('<<<'))
            .map((line) => INCLUDE.exec(line)?.[1] ?? `unreadable include: ${line}`);

        output.set(page, includes);
    }

    return output;
}

describe('samples', () => {
    const includes = readIncludes();

    it('finds the includes', () => {
        expect(includes.values().toArray().flat().length).toBeGreaterThan(90);
    });

    it('includes only files that exist', () => {
        const errors = includes.entries().toArray()
            .flatMap(([page, files]) => files.map((file) => ({ page, file })))
            .filter(({ file }) => !existsSync(path.join(examplesRoot, file)))
            .map(({ page, file }) => `src/${page}: examples/${file} does not exist`);

        expect(errors).toEqual([]);
    });

    it('includes every sample file on a page', () => {
        const included = new Set(includes.values().toArray().flat());
        const missing = list(examplesRoot)
            .filter((file) => FIXTURES.every((fixture) => (fixture.endsWith('/') ? !file.startsWith(fixture) : file !== fixture)))
            .filter((file) => !included.has(file));

        expect(missing).toEqual([]);
    });

    it('has no stale fixture entry', () => {
        const stale = FIXTURES.filter((fixture) => !existsSync(path.join(examplesRoot, fixture)));

        expect(stale).toEqual([]);
    });
});
