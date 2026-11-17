import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
    afterAll,
    beforeAll,
    describe,
    expect,
    it,
} from 'vitest';
import {
    readDocumentedNames,
    readExports,
    readHeadingNames,
    readHeadingSlugs,
    readHeadings,
    readHiddenNames,
    readLinks,
    readOptionTableNames,
    readSectionTableNames,
    readTypeKeys,
    slugify,
} from '../doc-checks';

let dir: string;
let entry: string;
let broken: string;
let star: string;
let withDefault: string;
let otherDefault: string;

beforeAll(() => {
    dir = mkdtempSync(path.join(tmpdir(), 'doc-checks-'));

    entry = path.join(dir, 'index.ts');
    writeFileSync(entry, [
        'export interface Options { a: number; b?: string }',
        'export type Partial2 = Partial<Options>;',
        'export type Both = Options & { c: boolean };',
        'export function create(): void {}',
        'export class Store {}',
        'export const VALUE = 1;',
        'export { helper } from \'./helper\';',
    ].join('\n'));
    writeFileSync(path.join(dir, 'helper.ts'), 'export const helper = (): number => 1;\n');

    broken = path.join(dir, 'broken.ts');
    writeFileSync(broken, 'export * from \'./nested\';\n');
    writeFileSync(path.join(dir, 'nested.ts'), 'export { missing } from \'./does-not-exist\';\n');

    star = path.join(dir, 'star.ts');
    writeFileSync(star, 'export * from \'./nope\';\nexport const kept = 1;\n');

    withDefault = path.join(dir, 'with-default.ts');
    writeFileSync(withDefault, 'import { helper } from \'./helper\';\n\nexport { helper };\nexport default helper;\n');

    otherDefault = path.join(dir, 'other-default.ts');
    writeFileSync(otherDefault, 'export const named = 1;\nexport default function other(): void {}\n');
});

afterAll(() => {
    rmSync(dir, { recursive: true, force: true });
});

describe('readOptionTableNames', () => {
    it('reads the first column of the table after ## Options', () => {
        const markdown = [
            '# Configuration',
            '',
            '## Options',
            '',
            '| Option | Type | Default | Description |',
            '|--------|------|---------|-------------|',
            '| `windowMs` | `number` | `60000` | Window |',
            '| `max` | `number \\| fn` | `5` | Quota |',
            '',
            '### `windowMs`',
            '',
            '| Header | Value |',
            '|---|---|',
            '| `Other` | x |',
        ].join('\n');

        expect(readOptionTableNames(markdown)).toEqual(['windowMs', 'max']);
    });

    it('accepts a heading that starts with Options', () => {
        const markdown = [
            '## Options and Defaults',
            '',
            '| Option | Type | Default | Description |',
            '|---|---|---|---|',
            '| `a` | `number` | `1` | A |',
        ].join('\n');

        expect(readOptionTableNames(markdown)).toEqual(['a']);
    });

    it('ignores an Options heading inside fenced code', () => {
        const markdown = [
            '```md',
            '## Options',
            '| `fake` | x |',
            '```',
        ].join('\n');

        expect(() => readOptionTableNames(markdown)).toThrow(/Options/);
    });

    it('throws when the heading is missing', () => {
        expect(() => readOptionTableNames('# Title\n\n| `a` | b |\n')).toThrow(/Options/);
    });

    it('throws when the section has no table', () => {
        const markdown = [
            '## Options',
            '',
            'Some text.',
            '',
            '## Other',
            '',
            '| `a` | b |',
        ].join('\n');

        expect(() => readOptionTableNames(markdown)).toThrow(/table/);
    });
});

describe('readSectionTableNames', () => {
    const markdown = [
        '## Options',
        '',
        '| Option | Type | Default | Description |',
        '|---|---|---|---|',
        '| `json` | `JsonOptions` | `true` | JSON |',
        '',
        '### `json`',
        '',
        '```ts',
        '| `fake` | x |',
        '```',
        '',
        '| Property | Type | Default | Description |',
        '|---|---|---|---|',
        '| `strict` | `boolean` | `true` | Strict |',
        '| `type` | `string \\| string[]` | `\'application/json\'` | Types |',
        '',
        '| `second` | table |',
        '',
        '### `raw`',
        '',
        'No table here.',
        '',
        '### `text`',
        '',
        '| `charset` | x |',
    ].join('\n');

    it('reads the first table under the heading with exactly that text', () => {
        expect(readSectionTableNames(markdown, '`json`')).toEqual(['strict', 'type']);
    });

    it('throws when the heading is missing', () => {
        expect(() => readSectionTableNames(markdown, '`urlEncoded`')).toThrow(/urlEncoded/);
    });

    it('throws when the section has no table before the next heading', () => {
        expect(() => readSectionTableNames(markdown, '`raw`')).toThrow(/table/);
    });

    it('throws when the table has a header but no rows', () => {
        const empty = [
            '### `parse`',
            '',
            '| Option | Type | Default | Description |',
            '|---|---|---|---|',
            '',
            'Text.',
        ].join('\n');

        expect(() => readSectionTableNames(empty, '`parse`')).toThrow(/no rows/);
    });
});

describe('readTypeKeys', () => {
    it('reads the keys of an interface', () => {
        expect(readTypeKeys(entry, 'Options').sort()).toEqual(['a', 'b']);
    });

    it('resolves a mapped type', () => {
        expect(readTypeKeys(entry, 'Partial2').sort()).toEqual(['a', 'b']);
    });

    it('resolves an intersection', () => {
        expect(readTypeKeys(entry, 'Both').sort()).toEqual(['a', 'b', 'c']);
    });

    it('throws for an unknown type', () => {
        expect(() => readTypeKeys(entry, 'Nope')).toThrow(/Nope/);
    });
});

describe('readExports', () => {
    it('splits value and type exports, following re-exports', () => {
        const result = readExports(entry);

        expect([...result.values].sort()).toEqual(['Store', 'VALUE', 'create', 'helper']);
        expect([...result.types].sort()).toEqual(['Both', 'Options', 'Partial2']);
    });

    it('throws on a nested re-export that does not resolve', () => {
        expect(() => readExports(broken)).toThrow(/missing/);
    });

    it('throws on an export * whose module does not resolve', () => {
        expect(() => readExports(star)).toThrow(/nope/);
    });

    it('names the export the default export aliases', () => {
        const result = readExports(withDefault);

        expect([...result.values].sort()).toEqual(['default', 'helper']);
        expect(result.defaultAlias).toBe('helper');
    });

    it('has no default alias when the default export is a declaration of its own', () => {
        expect(readExports(otherDefault).defaultAlias).toBeUndefined();
        expect(readExports(entry).defaultAlias).toBeUndefined();
    });
});

describe('readDocumentedNames', () => {
    it('reads single-identifier headings of level 2 and 3', () => {
        const markdown = [
            '# `title`',
            '## `rateLimit()`',
            '### `MemoryStore`',
            '   ### `indented`',
            '#### `deep`',
            '## Plain heading',
        ].join('\n');

        expect(readDocumentedNames(markdown)).toEqual(['rateLimit', 'MemoryStore', 'indented']);
    });

    it('reads identifiers from the first column of Types and Other Exports tables', () => {
        const markdown = [
            '## Types',
            '',
            '| Type | Description |',
            '|------|-------------|',
            '| `Options`, `OptionsInput` | Options |',
            '| `ValueDeterminingMiddleware<T>` | Fn |',
            '| Description | `secondColumn` |',
            '',
            '## Other Exports',
            '',
            '| Export | Description |',
            '|---|---|',
            '| `isObject` | Check |',
            '',
            '## Usage',
            '',
            '| `ignored` | x |',
        ].join('\n');

        expect(readDocumentedNames(markdown)).toEqual([
            'Options',
            'OptionsInput',
            'ValueDeterminingMiddleware',
            'isObject',
        ]);
    });

    it('ignores fenced code and closes a fence only on a bare marker line', () => {
        const markdown = [
            '```ts',
            '## `inFence`',
            '``` not a close',
            '### `stillInFence`',
            '```',
            '## `afterFence`',
            '~~~',
            '## `inTilde`',
            '~~~',
        ].join('\n');

        expect(readDocumentedNames(markdown)).toEqual(['afterFence']);
    });
});

describe('readHeadingNames', () => {
    it('reads single-identifier headings of one level, outside fences', () => {
        const markdown = [
            '## `two`',
            '### `three`',
            '   ### `indented()`',
            '### `X<T>` y',
            '### Plain',
            '```',
            '### `fenced`',
            '```',
        ].join('\n');

        expect(readHeadingNames(markdown, 3)).toEqual(['three', 'indented']);
        expect(readHeadingNames(markdown, 2)).toEqual(['two']);
    });
});

describe('readHiddenNames', () => {
    it('reports headings that start with a backticked span but are not one identifier', () => {
        const markdown = [
            '### `name` <Badge text="new" />',
            '### `X<T>` y',
            '   ## `indented` extra',
            '## `exact`',
            '## Plain',
            '#### `deep` extra',
            '```',
            '## `fenced` extra',
            '```',
        ].join('\n');

        expect(readHiddenNames(markdown)).toEqual([
            '`name` <Badge text="new" />',
            '`X<T>` y',
            '`indented` extra',
        ]);
    });
});

describe('readHeadings', () => {
    it('reads headings of every level outside fences', () => {
        const markdown = [
            '# Title',
            '## Options',
            '```md',
            '## Fenced',
            '```',
            '#### Deep ###',
        ].join('\n');

        expect(readHeadings(markdown)).toEqual([
            { level: 1, text: 'Title' },
            { level: 2, text: 'Options' },
            { level: 4, text: 'Deep' },
        ]);
    });
});

describe('slugify', () => {
    it('drops backticks, punctuation and inline html, and joins words with hyphens', () => {
        expect(slugify('`setResponseCookie()`')).toBe('setresponsecookie');
        expect(slugify('`X<T>` y')).toBe('x-t-y');
        expect(slugify('Body, Cookie and Query')).toBe('body-cookie-and-query');
        expect(slugify('An Allow-List')).toBe('an-allow-list');
        expect(slugify('`name` <Badge text="new" />')).toBe('name');
        expect(slugify('See [the guide](/guide/combining)')).toBe('see-the-guide');
        expect(slugify('1 Step')).toBe('_1-step');
    });
});

describe('readHeadingSlugs', () => {
    it('numbers repeated slugs the way VitePress does and skips frontmatter', () => {
        const markdown = [
            '---',
            'title: Page',
            '# not a heading',
            '---',
            '# Page',
            '## Options',
            '### `json`',
            '## Options',
            '## Options',
        ].join('\n');

        expect([...readHeadingSlugs(markdown)]).toEqual(['page', 'options', 'json', 'options-1', 'options-2']);
    });
});

describe('readLinks', () => {
    it('reads link targets outside fences and code spans', () => {
        const markdown = [
            '---',
            'description: \'[front](/front)\'',
            '---',
            'See [Options](/rate-limit/configuration#options) and [below](#types).',
            'Code `[no](/code)` is not a link, [`name`](/body/helpers#name) is.',
            '```md',
            '[fenced](/fenced)',
            '```',
            '[external](https://routup.dev/guide/plugins)',
        ].join('\n');

        expect(readLinks(markdown)).toEqual([
            '/rate-limit/configuration#options',
            '#types',
            '/body/helpers#name',
            'https://routup.dev/guide/plugins',
        ]);
    });
});
