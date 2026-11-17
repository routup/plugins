import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { PLUGIN_PAGES } from '../../src/.vitepress/config.mts';
import { PACKAGE_ENTRIES } from '../aliases';
import {
    checkEntryExports,
    checkReadmeHeadings,
    readHeadingNames,
    readHiddenNames,
    readOptionTableNames,
    readSectionTableNames,
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
    it('has an entry for every plugin package', () => {
        const names = readdirSync(packagesRoot)
            .filter((folder) => folder !== 'docs' && existsSync(path.join(packagesRoot, folder, 'package.json')))
            .filter((folder) => {
                const manifest = JSON.parse(readFileSync(path.join(packagesRoot, folder, 'package.json'), 'utf8'));

                return typeof manifest.name === 'string' && manifest.name.startsWith('@routup/');
            })
            .sort();

        expect(names.length).toBeGreaterThan(0);
        expect(PLUGINS.map((plugin) => plugin.name).sort()).toEqual(names);
    });

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

    it('documents the keys of each nested options type', () => {
        const errors: string[] = [];

        for (const nested of plugin.nestedOptions ?? []) {
            const page = nested.page ?? plugin.optionsPage;

            if (!page) {
                errors.push(`${plugin.name}: nested ${nested.type} has no page and there is no optionsPage`);

                continue;
            }

            const keys = readTypeKeys(entry, nested.type);
            const where = `${plugin.name}/${page} under ${nested.heading}`;
            let table: string[];

            expect(keys.length, `${plugin.name}: no keys read from ${nested.type}`).toBeGreaterThan(0);

            try {
                table = readSectionTableNames(readPage(plugin.name, page), nested.heading);
            } catch (e) {
                errors.push(`${plugin.name}/${page}: ${(e as Error).message}`);

                continue;
            }

            for (const key of nested.subset ? [] : keys) {
                if (!table.includes(key)) {
                    errors.push(`${where}: key \`${key}\` of ${nested.type} is missing from the table`);
                }
            }

            for (const name of table) {
                if (!keys.includes(name)) {
                    errors.push(`${where}: \`${name}\` in the table is not a key of ${nested.type}`);
                }
            }
        }

        expect(errors).toEqual([]);
    });

    /**
     * The Markdown of the pages, keyed by their path under src/.
     */
    function readPages(pages: string[]): Record<string, string> {
        return Object.fromEntries(pages.map((page) => [`${plugin.name}/${page}`, readPage(plugin.name, page)]));
    }

    it('documents every export and only real exports', () => {
        expect(checkEntryExports({
            label: plugin.name,
            entryFile: entry,
            pages: readPages(plugin.apiPages),
            exempt: plugin.exempt,
            typeExempt: plugin.typeExempt,
        })).toEqual([]);
    });

    it('documents every export of each subpath entry on its own pages', () => {
        const manifest = JSON.parse(readFileSync(path.join(packagesRoot, plugin.name, 'package.json'), 'utf8'));
        const errors: string[] = [];

        for (const subEntry of plugin.entries ?? []) {
            const label = subEntry.specifier;
            const file = path.join(packagesRoot, plugin.name, 'src', subEntry.file);
            const subpath = subEntry.specifier.startsWith(`${manifest.name}/`) ?
                `.${subEntry.specifier.slice(manifest.name.length)}` :
                undefined;

            if (!subpath || !(subpath in (manifest.exports ?? {}))) {
                errors.push(`${label}: not a subpath in the exports of ${manifest.name}`);
            }

            if (PACKAGE_ENTRIES[subEntry.specifier] !== `packages/${plugin.name}/src/${subEntry.file}`) {
                errors.push(`${label}: PACKAGE_ENTRIES does not map it to packages/${plugin.name}/src/${subEntry.file}`);
            }

            for (const page of subEntry.apiPages) {
                if (plugin.apiPages.includes(page)) {
                    errors.push(`${label}: page ${page} is also an apiPage of the main entry`);
                }
            }

            if (!existsSync(file)) {
                errors.push(`${label}: ${subEntry.file} does not exist`);

                continue;
            }

            errors.push(...checkEntryExports({
                label,
                entryFile: file,
                pages: readPages(subEntry.apiPages),
                exempt: subEntry.exempt,
                typeExempt: subEntry.typeExempt,
            }));
        }

        expect(errors).toEqual([]);
    });

    it('covers every subpath of the package exports', () => {
        const manifest = JSON.parse(readFileSync(path.join(packagesRoot, plugin.name, 'package.json'), 'utf8'));
        const subpaths = Object.keys(manifest.exports ?? {}).filter((key) => key !== '.' && key !== './package.json');
        const registered = (plugin.entries ?? []).map((item) => `.${item.specifier.slice(manifest.name.length)}`);
        const exempt = plugin.subpathExempt ?? {};
        const errors: string[] = [];

        for (const subpath of subpaths) {
            if (!registered.includes(subpath) && !(subpath in exempt)) {
                errors.push(`${plugin.name}: subpath ${subpath} is neither in entries nor in subpathExempt`);
            }

            if (registered.includes(subpath) && subpath in exempt) {
                errors.push(`${plugin.name}: subpath ${subpath} is in entries and in subpathExempt`);
            }
        }

        for (const subpath of Object.keys(exempt)) {
            if (!subpaths.includes(subpath)) {
                errors.push(`${plugin.name}: stale subpathExempt ${subpath} (not in the exports)`);
            }
        }

        expect(errors).toEqual([]);
    });

    it('keeps the README a front door to the docs', () => {
        const readme = readFileSync(path.join(packagesRoot, plugin.name, 'README.md'), 'utf8');

        expect(checkReadmeHeadings(readme, `@routup/${plugin.name}`), `${plugin.name}: README sections`).toEqual([]);
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
