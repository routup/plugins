import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { PLUGIN_PAGES } from '../../src/.vitepress/config.mts';
import {
    readDocumentedNames,
    readExports,
    readHeadingNames,
    readHiddenNames,
    readOptionTableNames,
    readTypeKeys,
} from '../doc-checks';
import { PLUGINS } from '../registry';

const docsRoot = fileURLToPath(new URL('../..', import.meta.url));
const packagesRoot = path.resolve(docsRoot, '..');

function readPage(name: string, page: string): string {
    return readFileSync(path.join(docsRoot, 'src', name, page), 'utf8');
}

function linkToFile(link: string): string {
    const file = link.replace(/^\//, '');

    return file.endsWith('/') ? `${file}index.md` : `${file}.md`;
}

describe('registry', () => {
    it('has entries whose folders exist', () => {
        expect(PLUGINS.length).toBeGreaterThan(0);

        for (const plugin of PLUGINS) {
            expect(existsSync(path.join(packagesRoot, plugin.name, 'src', 'index.ts')), plugin.name).toBe(true);
            expect(existsSync(path.join(docsRoot, 'src', plugin.name, 'index.md')), plugin.name).toBe(true);
        }
    });
});

describe.each(PLUGINS)('$name', (plugin) => {
    const entry = path.join(packagesRoot, plugin.name, 'src', 'index.ts');

    it('documents exactly the options of the options type', () => {
        if (!plugin.optionsType) {
            expect(plugin.optionsPage, `${plugin.name}: optionsPage without optionsType`).toBeUndefined();

            return;
        }

        expect(plugin.optionsPage, `${plugin.name}: optionsType without optionsPage`).toBeDefined();

        const keys = readTypeKeys(entry, plugin.optionsType);
        const exempt = plugin.optionExempt ?? {};
        const optionsPage = readPage(plugin.name, plugin.optionsPage!);
        const table = readOptionTableNames(optionsPage);

        expect(keys.length, `${plugin.name}: no keys read from ${plugin.optionsType}`).toBeGreaterThan(0);

        const errors: string[] = readHiddenNames(optionsPage)
            .map((text) => `${plugin.name}/${plugin.optionsPage}: heading "${text}" is not a single backticked name`);

        for (const name of readHeadingNames(optionsPage, 3)) {
            if (!keys.includes(name)) {
                errors.push(`${plugin.name}/${plugin.optionsPage}: heading \`${name}\` is not a key of ${plugin.optionsType}`);
            }
        }

        for (const key of keys) {
            if (!(key in exempt) && !table.includes(key)) {
                errors.push(`${plugin.name}: option \`${key}\` of ${plugin.optionsType} is missing from the Options table`);
            }
        }

        for (const name of table) {
            if (!keys.includes(name)) {
                errors.push(`${plugin.name}: option \`${name}\` in the Options table is not a key of ${plugin.optionsType}`);
            }

            if (name in exempt) {
                errors.push(`${plugin.name}: option \`${name}\` is in the Options table and in optionExempt`);
            }
        }

        for (const key of Object.keys(exempt)) {
            if (!keys.includes(key)) {
                errors.push(`${plugin.name}: stale optionExempt \`${key}\``);
            }
        }

        expect(errors).toEqual([]);
    });

    it('documents every runtime export and only real exports', () => {
        const {
            values,
            types,
            defaultAlias,
        } = readExports(entry);
        const exempt = plugin.exempt ?? {};
        const documented = new Set<string>();
        const hidden: string[] = [];

        for (const page of plugin.apiPages) {
            const markdown = readPage(plugin.name, page);

            readDocumentedNames(markdown).forEach((name) => documented.add(name));
            hidden.push(...readHiddenNames(markdown).map((text) => `${plugin.name}/${page}: heading "${text}" is not a single backticked name`));
        }

        expect(values.size, `${plugin.name}: no runtime exports read`).toBeGreaterThan(0);
        expect(documented.size, `${plugin.name}: no documented names read`).toBeGreaterThan(0);

        const errors: string[] = [...hidden];

        // the default export counts as documented when it is a documented named export
        if (values.has('default') && defaultAlias && documented.has(defaultAlias)) {
            documented.add('default');
        }

        for (const name of documented) {
            if (!values.has(name) && !types.has(name)) {
                errors.push(`${plugin.name}: \`${name}\` is documented but not exported`);
            }
        }

        for (const name of values) {
            if (!documented.has(name) && !(name in exempt)) {
                errors.push(name === 'default' ?
                    `${plugin.name}: the default export is not a documented named export` :
                    `${plugin.name}: runtime export \`${name}\` is not documented`);
            }
        }

        for (const name of Object.keys(exempt)) {
            if (!values.has(name)) {
                errors.push(`${plugin.name}: stale exemption \`${name}\` (not a runtime export)`);
            } else if (documented.has(name)) {
                errors.push(`${plugin.name}: stale exemption \`${name}\` (it is documented)`);
            }
        }

        expect(errors).toEqual([]);
    });

    it('keeps the README a front door to the docs', () => {
        const readme = readFileSync(path.join(packagesRoot, plugin.name, 'README.md'), 'utf8');
        const headings = readme.split(/\r?\n/).filter((line) => /^#{2,3}\s+(Options|API|Notes|Usage)\b/.test(line));

        expect(headings, `${plugin.name}: README sections that belong on the docs site`).toEqual([]);
        expect(readme).toContain(`https://plugins.routup.dev/${plugin.name}/`);
    });

    it('has the docs quick start as the README quick start', () => {
        const normalize = (input: string) => input.replace(/\r\n/g, '\n').trim();
        const sample = path.join(docsRoot, 'examples', plugin.name, 'quick-start.ts');

        expect(existsSync(sample), `${plugin.name}: examples/${plugin.name}/quick-start.ts is missing`).toBe(true);

        const readme = readFileSync(path.join(packagesRoot, plugin.name, 'README.md'), 'utf8');

        expect(normalize(readme), `${plugin.name}: README does not contain quick-start.ts`).toContain(normalize(readFileSync(sample, 'utf8')));
    });

    it('lists exactly the pages of its folder in the sidebar', () => {
        const entryPages = PLUGIN_PAGES.find((item) => item.name === plugin.name);

        expect(entryPages, `${plugin.name}: no entry in PLUGIN_PAGES`).toBeDefined();

        const listed = entryPages!.pages.map((page) => linkToFile(page.link)).sort();
        const files = readdirSync(path.join(docsRoot, 'src', plugin.name))
            .filter((file) => file.endsWith('.md'))
            .map((file) => `${plugin.name}/${file}`)
            .sort();

        expect(listed).toEqual(files);
    });
});
