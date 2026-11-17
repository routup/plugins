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
    checkEntryExports,
    checkReadmeHeadings,
    readCodeDeclarations,
    readDocumentedNames,
    readExports,
    readFrontmatterLinks,
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
let twoAliases: string;

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

    twoAliases = path.join(dir, 'two-aliases.ts');
    writeFileSync(twoAliases, 'import { helper } from \'./helper\';\n\nexport { helper, helper as useHelper };\nexport default helper;\n');
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
        expect(result.defaultAliases).toEqual(['helper']);
    });

    it('names every export the default export aliases', () => {
        expect(readExports(twoAliases).defaultAliases.sort()).toEqual(['helper', 'useHelper']);
    });

    it('has no default alias when the default export is a declaration of its own', () => {
        expect(readExports(otherDefault).defaultAliases).toEqual([]);
        expect(readExports(entry).defaultAliases).toEqual([]);
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

describe('readDocumentedNames in Decorator and Export tables', () => {
    it('reads the first column of a table whose first header cell is Decorator or Export', () => {
        const markdown = [
            '## Route Decorators',
            '',
            '| Decorator | Route |',
            '|---|---|',
            '| `DGet(path?)`, `DPost(path?)` | GET, POST |',
            '',
            '## Other',
            '',
            '| Export | Description |',
            '|---|---|',
            '| `isObject` | Check |',
            '',
            '| Option | Description |',
            '|---|---|',
            '| `notAName` | x |',
            '',
            '| Decorator | Needs |',
            '|---|---|',
            '| `@DBody()` | body() |',
        ].join('\n');

        expect(readDocumentedNames(markdown)).toEqual(['DGet', 'DPost', 'isObject', 'DBody']);
    });
});

describe('readCodeDeclarations', () => {
    it('reads the types and interfaces declared in fenced code', () => {
        const markdown = [
            'type NotInCode = string;',
            '',
            '```ts',
            'export type Handler = () => void;',
            'interface Options {',
            '    a: number;',
            '}',
            'declare type Declared = 1;',
            'const typeName = 1;',
            '```',
        ].join('\n');

        expect(readCodeDeclarations(markdown)).toEqual(['Handler', 'Options', 'Declared']);
    });
});

describe('checkEntryExports', () => {
    it('accepts a page that documents every export', () => {
        const page = [
            '## `create()`',
            '## `Store`',
            '## `VALUE`',
            '## `helper`',
            '',
            '## Types',
            '',
            '| Type | Description |',
            '|---|---|',
            '| `Options`, `Partial2` | x |',
            '',
            '```ts',
            'type Both = Options & { c: boolean };',
            '```',
        ].join('\n');

        expect(checkEntryExports({
            label: 'entry',
            entryFile: entry,
            pages: { 'helpers.md': page },
        })).toEqual([]);
    });

    it('reports an undocumented runtime export and an undocumented type export', () => {
        const page = [
            '## `create()`',
            '## `Store`',
            '## `VALUE`',
            '',
            '## Types',
            '',
            '| Type | Description |',
            '|---|---|',
            '| `Options` | x |',
        ].join('\n');

        expect(checkEntryExports({
            label: 'entry',
            entryFile: entry,
            pages: { 'helpers.md': page },
            typeExempt: { Partial2: 'internal' },
        })).toEqual([
            'entry: runtime export `helper` is not documented',
            'entry: type export `Both` is not documented',
        ]);
    });

    it('reports stale exemptions', () => {
        const page = '## `create()`\n## `Store`\n## `VALUE`\n## `helper`\n## Types\n\n| Type | x |\n|---|---|\n| `Options`, `Partial2`, `Both` | x |\n';

        expect(checkEntryExports({
            label: 'entry',
            entryFile: entry,
            pages: { 'helpers.md': page },
            exempt: { helper: 'x', gone: 'x' },
            typeExempt: { Options: 'x', Gone: 'x' },
        })).toEqual([
            'entry: stale exemption `helper` (it is documented)',
            'entry: stale exemption `gone` (not a runtime export)',
            'entry: stale type exemption `Options` (it is documented)',
            'entry: stale type exemption `Gone` (not a type export)',
        ]);
    });

    it('accepts the default export when any of its aliases is documented', () => {
        expect(checkEntryExports({
            label: 'aliases',
            entryFile: twoAliases,
            pages: { 'index.md': '## `useHelper()`\n\n| Export | Description |\n|---|---|\n| `helper` | x |\n' },
        })).toEqual([]);
        expect(checkEntryExports({
            label: 'aliases',
            entryFile: twoAliases,
            pages: { 'index.md': '## `useHelper()`\n' },
            exempt: { helper: 'same function as useHelper' },
        })).toEqual([]);
    });

    it('reports a default export that is not a documented named export', () => {
        expect(checkEntryExports({
            label: 'other',
            entryFile: otherDefault,
            pages: { 'index.md': '## `named`\n' },
        })).toEqual(['other: the default export is not a documented named export']);
    });

    it('reports a heading that hides a name', () => {
        expect(checkEntryExports({
            label: 'other',
            entryFile: otherDefault,
            pages: { 'index.md': '## `named`\n## `named` <Badge text="new" />\n' },
            exempt: { default: 'x' },
        })).toEqual(['index.md: heading "`named` <Badge text="new" />" is not a single backticked name']);
    });
});

describe('checkReadmeHeadings', () => {
    const readme = (headings: string[]) => [
        '<h1 align="center">@routup/x</h1>',
        '',
        ...headings,
        '',
        '```md',
        '## Fenced',
        '```',
    ].join('\n');

    it('accepts the front door sections in order', () => {
        expect(checkReadmeHeadings(readme([
            '## Why @routup/x?',
            '## Installation',
            '## Quick Start',
            '## Documentation',
            '## License',
        ]), '@routup/x')).toEqual([]);
    });

    it('reports another section, a wrong order and a level 3 heading', () => {
        expect(checkReadmeHeadings(readme([
            '## Why @routup/x?',
            '## Installation',
            '## Configuration',
            '### `limit`',
            '## Documentation',
            '## Quick Start',
            '## License',
        ]), '@routup/x')).toEqual([
            'level 2 headings are "Why @routup/x?", "Installation", "Configuration", "Documentation", "Quick Start", "License"; expected "Why @routup/x?", "Installation", "Quick Start", "Documentation", "License"',
            'level 3 heading "`limit`"',
        ]);
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

describe('readHeadingSlugs with custom ids', () => {
    it('uses a {#id} suffix as the anchor and drops it from the text', () => {
        const markdown = [
            '## Default Behaviour {#default-behaviour}',
            '## Options {#opts}',
            '## Options',
        ].join('\n');

        expect([...readHeadingSlugs(markdown)]).toEqual(['default-behaviour', 'opts', 'options']);
    });
});

describe('readFrontmatterLinks', () => {
    it('reads the link values of the frontmatter', () => {
        const markdown = [
            '---',
            'hero:',
            '    actions:',
            '        - text: \'Get Started\'',
            '          link: \'/guide/getting-started\'',
            '        - text: Browse',
            '          link: "#plugins"',
            '        - link: https://github.com/routup/plugins',
            '---',
            'link: /not-frontmatter',
        ].join('\n');

        expect(readFrontmatterLinks(markdown)).toEqual([
            '/guide/getting-started',
            '#plugins',
            'https://github.com/routup/plugins',
        ]);
    });

    it('reads nothing without frontmatter', () => {
        expect(readFrontmatterLinks('# Title\nlink: /x\n')).toEqual([]);
    });
});

describe('readLinks', () => {
    it('reads reference definitions and anchor tags, and skips images', () => {
        const markdown = [
            'See [the guide][guide] and <a href="/cors/">cors</a>, <a class="x" href=\'/body/#options\'>body</a>.',
            '![Diagram](/diagram.svg) and [![badge](https://img.shields.io/x)](/rate-limit/)',
            '',
            '[guide]: /guide/getting-started',
            '[site]: <https://plugins.routup.dev/body/> "Body"',
        ].join('\n');

        expect(readLinks(markdown)).toEqual([
            '/cors/',
            '/body/#options',
            '/rate-limit/',
            '/guide/getting-started',
            'https://plugins.routup.dev/body/',
        ]);
    });

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
