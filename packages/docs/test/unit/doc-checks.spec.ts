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
    readHiddenNames,
    readOptionTableNames,
    readTypeKeys,
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
