/**
 * Readers that compare what a docs page states with what a package
 * exports. Markdown is read line by line; fenced code is skipped. Types and
 * exports come from the TypeScript checker, so intersections, mapped types
 * and re-exports resolve the way a consumer sees them.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

export type Heading = {
    level: number;
    text: string;
};

type Line = {
    text: string;
    heading?: Heading;
};

const FENCE_OPEN = /^ {0,3}(`{3,}|~{3,})/;
const HEADING = /^ {0,3}(#{1,6})\s+(.*?)(?:\s+#+)?\s*$/;
const EXACT_NAME = /^`([A-Za-z_$][\w$]*)(?:\(\))?`$/;
const TABLE_NAME = /^@?([A-Za-z_$][\w$]*)(?:<[^`]*>|\([^`]*\))?$/;
const EXPORT_TABLE_HEADER = /^(Decorator|Export)$/;
const CODE_DECLARATION = /^\s*(?:export\s+)?(?:declare\s+)?(?:type|interface)\s+([A-Za-z_$][\w$]*)/;

/**
 * Every line after the frontmatter; a fenced line (the markers included)
 * has `fenced`, any other its parsed heading when it is one. A fence closes
 * only on a line holding nothing but a marker of the same character, at
 * least as long as the opening one.
 */
function readAllLines(markdown: string): (Line & { fenced?: boolean })[] {
    const output: (Line & { fenced?: boolean })[] = [];
    let fence: string | undefined;
    const lines = markdown.split(/\r?\n/);

    // YAML frontmatter: a `# comment` in it is not a heading
    if (lines[0] === '---') {
        const end = lines.indexOf('---', 1);

        if (end !== -1) {
            lines.splice(0, end + 1);
        }
    }

    for (const text of lines) {
        if (fence) {
            const trimmed = text.trim();

            if (
                trimmed.length >= fence.length &&
                trimmed === fence[0]!.repeat(trimmed.length) &&
                /^ {0,3}\S/.test(text)
            ) {
                fence = undefined;
            }

            output.push({ text, fenced: true });

            continue;
        }

        const open = FENCE_OPEN.exec(text);

        if (open) {
            fence = open[1];
            output.push({ text, fenced: true });

            continue;
        }

        const match = HEADING.exec(text);

        output.push(match ?
            { text, heading: { level: match[1]!.length, text: match[2]!.trim() } } :
            { text });
    }

    return output;
}

/**
 * The lines outside fenced code and frontmatter.
 */
function readLines(markdown: string): Line[] {
    return readAllLines(markdown).filter((line) => !line.fenced);
}

function isTableRow(text: string): boolean {
    return text.trimStart().startsWith('|');
}

function isSeparatorRow(text: string): boolean {
    return /^\|?[\s|:-]+\|?$/.test(text.trim()) && text.includes('-');
}

function readFirstCell(text: string): string {
    // an escaped pipe (`\|`) stays inside the cell
    const cells = text.trim().replace(/^\|/, '').split(/(?<!\\)\|/);

    return (cells[0] ?? '').trim();
}

function readCodeSpans(text: string): string[] {
    return text.matchAll(/`([^`]+)`/g).map((match) => match[1]!).toArray();
}

/**
 * Backticked names in the first column of the first table after the line
 * at `start`, before the next heading.
 */
function readTableNamesAfter(lines: Line[], start: number, label: string): string[] {
    const names: string[] = [];
    let inTable = false;

    for (const line of lines.slice(start + 1)) {
        if (line.heading) {
            break;
        }

        if (!isTableRow(line.text)) {
            if (inTable) {
                break;
            }

            continue;
        }

        if (!inTable) {
            // the header row
            inTable = true;

            continue;
        }

        if (isSeparatorRow(line.text)) {
            continue;
        }

        const [name] = readCodeSpans(readFirstCell(line.text));

        if (!name) {
            throw new Error(`${label} table row without a backticked name: ${line.text}`);
        }

        names.push(name);
    }

    if (!inTable) {
        throw new Error(`no table found under the "${label}" heading`);
    }

    if (names.length === 0) {
        throw new Error(`the table under the "${label}" heading has no rows`);
    }

    return names;
}

/**
 * Backticked names in the first column of the first table after a level 2
 * heading whose text starts with "Options". The table must come before the
 * next heading.
 */
export function readOptionTableNames(markdown: string): string[] {
    const lines = readLines(markdown);
    const start = lines.findIndex((line) => line.heading?.level === 2 && line.heading.text.startsWith('Options'));

    if (start === -1) {
        throw new Error('no "## Options" heading found');
    }

    return readTableNamesAfter(lines, start, '## Options');
}

/**
 * Backticked names in the first column of the first table after the first
 * heading (any level) whose text is exactly `heading`, for example
 * "`json`". The table must come before the next heading.
 */
export function readSectionTableNames(markdown: string, heading: string): string[] {
    const lines = readLines(markdown);
    const start = lines.findIndex((line) => line.heading?.text === heading);

    if (start === -1) {
        throw new Error(`no heading "${heading}" found`);
    }

    return readTableNamesAfter(lines, start, heading);
}

/**
 * Names from level 2 and 3 headings that are exactly one backticked
 * identifier (optionally followed by `()` inside the backticks), and from
 * the first column of tables under a heading that starts with "Types" or
 * "Other Exports", or whose header row starts with a "Decorator" or
 * "Export" cell. In a table cell, a name may carry a leading `@` and a
 * call or type argument list: `` `@DBody(name?)` `` reads as `DBody`.
 */
export function readDocumentedNames(markdown: string): string[] {
    const names: string[] = [];
    let inExportSection = false;
    let table: 'names' | 'other' | undefined;

    for (const line of readLines(markdown)) {
        if (line.heading) {
            inExportSection = line.heading.text.startsWith('Types') ||
                line.heading.text.startsWith('Other Exports');
            table = undefined;

            if (line.heading.level === 2 || line.heading.level === 3) {
                const match = EXACT_NAME.exec(line.heading.text);

                if (match) {
                    names.push(match[1]!);
                }
            }

            continue;
        }

        if (!isTableRow(line.text)) {
            table = undefined;

            continue;
        }

        if (!table) {
            // the header row
            table = inExportSection || EXPORT_TABLE_HEADER.test(readFirstCell(line.text)) ?
                'names' :
                'other';

            if (!inExportSection) {
                continue;
            }
        }

        if (table !== 'names' || isSeparatorRow(line.text)) {
            continue;
        }

        for (const span of readCodeSpans(readFirstCell(line.text))) {
            const match = TABLE_NAME.exec(span);

            if (match) {
                names.push(match[1]!);
            }
        }
    }

    return names;
}

/**
 * Names of the types and interfaces declared in fenced code.
 */
export function readCodeDeclarations(markdown: string): string[] {
    return readAllLines(markdown)
        .filter((line) => line.fenced)
        .map((line) => CODE_DECLARATION.exec(line.text)?.[1])
        .filter((name): name is string => !!name);
}

/**
 * Level 2 and 3 headings that start with a backticked span but are not a
 * single identifier: they look like an API heading, yet the checks would
 * not see the name.
 */
export function readHiddenNames(markdown: string): string[] {
    return readLines(markdown)
        .map((line) => line.heading)
        .filter((heading): heading is Heading => !!heading &&
            (heading.level === 2 || heading.level === 3) &&
            heading.text.startsWith('`') &&
            !EXACT_NAME.test(heading.text))
        .map((heading) => heading.text);
}

/**
 * Names of the headings of one level that are exactly one backticked
 * identifier (optionally `()` inside the backticks).
 */
export function readHeadingNames(markdown: string, level: 2 | 3): string[] {
    return readLines(markdown)
        .map((line) => line.heading)
        .filter((heading): heading is Heading => heading?.level === level)
        .map((heading) => EXACT_NAME.exec(heading.text)?.[1])
        .filter((name): name is string => !!name);
}

/**
 * The headings outside fenced code and frontmatter, in page order.
 */
export function readHeadings(markdown: string): Heading[] {
    return readLines(markdown)
        .map((line) => line.heading)
        .filter((heading): heading is Heading => !!heading);
}

const CODE_SPAN = /(`+)([\s\S]*?)\1/g;
const SLUG_SPECIAL = /[\s~`!@#$%^&*()\-_+=[\]{}|\\;:"'“”‘’<>,.?/]+/g;

/**
 * The anchor VitePress gives a heading with this Markdown text: inline
 * HTML and link targets dropped, code spans kept as text, then the
 * slugify of `@mdit-vue/shared` (punctuation runs become one hyphen, lower
 * case, a leading digit gets `_`).
 */
export function slugify(markdown: string): string {
    const text = markdown
        .split(CODE_SPAN)
        .map((part, index) => {
            // split() yields [text, fence, code, text, fence, code, ...]
            if (index % 3 === 1) {
                return '';
            }

            if (index % 3 === 2) {
                return part;
            }

            return part
                .replace(/<\/?[A-Za-z][^>]*>/g, '')
                .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');
        })
        .join('');

    return text
        .normalize('NFKD')
        .replace(/[\u0300-\u036F]/g, '')
        // eslint-disable-next-line no-control-regex
        .replace(/[\u0000-\u001F]/g, '')
        .replace(SLUG_SPECIAL, '-')
        .replace(/-{2,}/g, '-')
        .replace(/^-+|-+$/g, '')
        .replace(/^(\d)/, '_$1')
        .toLowerCase();
}

const CUSTOM_ID = /\s*\{#([^}\s]+)\}\s*$/;

/**
 * The anchors of every heading of a page; a repeated slug gets `-1`,
 * `-2`, ... as VitePress numbers it. A `{#id}` suffix sets the anchor.
 */
export function readHeadingSlugs(markdown: string): Set<string> {
    const slugs = new Set<string>();

    for (const heading of readHeadings(markdown)) {
        const custom = CUSTOM_ID.exec(heading.text);

        if (custom) {
            slugs.add(custom[1]!);

            continue;
        }

        const base = slugify(heading.text);
        let slug = base;

        for (let index = 1; slugs.has(slug); index++) {
            slug = `${base}-${index}`;
        }

        slugs.add(slug);
    }

    return slugs;
}

/**
 * The index of the `[` that opens the link text whose `]` is at `close`.
 */
function findLinkTextStart(text: string, close: number): number {
    let depth = 0;

    for (let index = close; index >= 0; index--) {
        if (text[index] === ']') {
            depth++;
        } else if (text[index] === '[') {
            depth--;

            if (depth === 0) {
                return index;
            }
        }
    }

    return -1;
}

/**
 * Link targets outside fenced code, frontmatter and code spans, in page
 * order: inline links (not images), `<a href>` and reference definitions.
 */
export function readLinks(markdown: string): string[] {
    const links: string[] = [];

    for (const line of readLines(markdown)) {
        const text = line.text.replace(CODE_SPAN, '');
        const definition = /^ {0,3}\[[^\]]+\]:\s*<?([^\s>]+)>?/.exec(text);

        if (definition) {
            links.push(definition[1]!);

            continue;
        }

        for (const match of text.matchAll(/\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)/g)) {
            const start = findLinkTextStart(text, match.index);

            if (start > 0 && text[start - 1] === '!') {
                continue;
            }

            links.push(match[1]!);
        }

        for (const match of text.matchAll(/<a\s[^>]*?href=(["'])(.*?)\1/gi)) {
            links.push(match[2]!);
        }
    }

    return links;
}

/**
 * Values of the `link:` keys of the YAML frontmatter, such as the hero
 * actions of the landing page.
 */
export function readFrontmatterLinks(markdown: string): string[] {
    const lines = markdown.split(/\r?\n/);

    if (lines[0] !== '---') {
        return [];
    }

    const end = lines.indexOf('---', 1);

    return lines.slice(1, end === -1 ? 1 : end)
        .map((line) => /^\s*(?:-\s+)?link:\s*(['"]?)(.+?)\1\s*$/.exec(line)?.[2])
        .filter((link): link is string => !!link);
}

/**
 * The level 2 headings a package README has, in this order, and the only
 * ones; a README has no level 3 heading.
 */
function readReadmeSections(packageName: string): string[] {
    return [`Why ${packageName}?`, 'Installation', 'Quick Start', 'Documentation', 'License'];
}

/**
 * Errors of a package README against the front door shape of
 * `readReadmeSections()`; fenced code is skipped.
 */
export function checkReadmeHeadings(markdown: string, packageName: string): string[] {
    const headings = readHeadings(markdown);
    const actual = headings.filter((heading) => heading.level === 2).map((heading) => heading.text);
    const expected = readReadmeSections(packageName);
    const errors: string[] = [];
    const quote = (items: string[]) => items.map((item) => `"${item}"`).join(', ');

    if (actual.join('\n') !== expected.join('\n')) {
        errors.push(`level 2 headings are ${quote(actual)}; expected ${quote(expected)}`);
    }

    for (const heading of headings.filter((item) => item.level === 3)) {
        errors.push(`level 3 heading "${heading.text}"`);
    }

    return errors;
}

// ---------------------------------------------------------------------------

const TSCONFIG = fileURLToPath(new URL('../tsconfig.json', import.meta.url));

let compilerOptions: ts.CompilerOptions | undefined;

function readCompilerOptions(): ts.CompilerOptions {
    if (!compilerOptions) {
        const { config, error } = ts.readConfigFile(TSCONFIG, (file) => ts.sys.readFile(file));

        if (error) {
            throw new Error(ts.flattenDiagnosticMessageText(error.messageText, '\n'));
        }

        compilerOptions = {
            ...ts.parseJsonConfigFileContent(config, ts.sys, path.dirname(TSCONFIG)).options,
            noEmit: true,
        };
    }

    return compilerOptions;
}

const programs = new Map<string, ts.Program>();

function readModule(entryFile: string): { checker: ts.TypeChecker; symbol: ts.Symbol } {
    const file = path.resolve(entryFile);
    let program = programs.get(file);

    if (!program) {
        program = ts.createProgram({ rootNames: [file], options: readCompilerOptions() });

        // an `export * from` a module that does not resolve adds no names
        // and no declaration to check, only a diagnostic in the entry file
        const errors = program.getSemanticDiagnostics(program.getSourceFile(file));

        if (errors.length > 0) {
            throw new Error(`${file}: ${errors.map((error) => ts.flattenDiagnosticMessageText(error.messageText, '\n')).join('; ')}`);
        }

        programs.set(file, program);
    }

    const checker = program.getTypeChecker();
    const source = program.getSourceFile(file);
    const symbol = source ? checker.getSymbolAtLocation(source) : undefined;

    if (!symbol) {
        throw new Error(`${file}: not a module`);
    }

    return { checker, symbol };
}

function resolveSymbol(checker: ts.TypeChecker, symbol: ts.Symbol): ts.Symbol {
    return symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
}

/**
 * Property names of an exported type or interface.
 */
export function readTypeKeys(entryFile: string, typeName: string): string[] {
    const { checker, symbol } = readModule(entryFile);
    const exported = checker.getExportsOfModule(symbol).find((item) => item.name === typeName);

    if (!exported) {
        throw new Error(`${entryFile}: no exported type "${typeName}"`);
    }

    const type = checker.getDeclaredTypeOfSymbol(resolveSymbol(checker, exported));

    return checker.getPropertiesOfType(type).map((property) => property.name);
}

/**
 * Exports of a module, split into runtime values (functions, classes,
 * constants, `default`) and type-only exports. `defaultAliases` names
 * the exports that resolve to the same declaration as the default export. A re-export whose target does not resolve throws, as does any
 * semantic error in the entry file, so a broken barrel is not mistaken for
 * a smaller API.
 */
export function readExports(entryFile: string): {
    values: Set<string>;
    types: Set<string>;
    defaultAliases: string[];
} {
    const { checker, symbol } = readModule(entryFile);
    const values = new Set<string>();
    const types = new Set<string>();
    const targets = new Map<string, ts.Symbol>();

    for (const exported of checker.getExportsOfModule(symbol)) {
        const target = resolveSymbol(checker, exported);

        targets.set(exported.name, target);

        if (!target.declarations || target.declarations.length === 0) {
            throw new Error(`${entryFile}: export "${exported.name}" does not resolve to a declaration`);
        }

        if (target.flags & ts.SymbolFlags.Value) {
            values.add(exported.name);
        } else {
            types.add(exported.name);
        }
    }

    const defaultTarget = targets.get('default');
    const defaultAliases = defaultTarget ?
        targets.entries()
            .filter(([name, target]) => name !== 'default' && target === defaultTarget)
            .map(([name]) => name)
            .toArray() :
        [];

    return {
        values,
        types,
        defaultAliases,
    };
}

export type EntryExportsInput = {
    /**
     * Names the entry in each message.
     */
    label: string;
    entryFile: string;
    /**
     * Page name -> Markdown of the pages that document the entry.
     */
    pages: Record<string, string>;
    /**
     * Runtime export -> reason it is not documented under its own name.
     */
    exempt?: Record<string, string>;
    /**
     * Type export -> reason it is not documented under its own name.
     */
    typeExempt?: Record<string, string>;
};

/**
 * Errors of one entry file against its pages: every runtime export is a
 * documented name, every type export is a documented name or declared in
 * fenced code, every documented name is an export, and each exemption is
 * still needed. The default export counts as documented when one of its
 * aliases is documented or exempt.
 */
export function checkEntryExports(input: EntryExportsInput): string[] {
    const {
        label,
        entryFile,
        pages,
        exempt = {},
        typeExempt = {},
    } = input;
    const {
        values,
        types,
        defaultAliases,
    } = readExports(entryFile);
    const documented = new Set<string>();
    const declared = new Set<string>();
    const errors: string[] = [];

    for (const [page, markdown] of Object.entries(pages)) {
        readDocumentedNames(markdown).forEach((name) => documented.add(name));
        readCodeDeclarations(markdown).forEach((name) => declared.add(name));
        errors.push(...readHiddenNames(markdown).map((text) => `${page}: heading "${text}" is not a single backticked name`));
    }

    if (values.size === 0) {
        errors.push(`${label}: no runtime exports read`);
    }

    if (documented.size === 0) {
        errors.push(`${label}: no documented names read`);
    }

    for (const name of documented) {
        if (!values.has(name) && !types.has(name)) {
            errors.push(`${label}: \`${name}\` is documented but not exported`);
        }
    }

    const defaultDocumented = defaultAliases.some((name) => documented.has(name) || name in exempt);

    for (const name of values) {
        if (name === 'default') {
            if (!defaultDocumented && !('default' in exempt)) {
                errors.push(`${label}: the default export is not a documented named export`);
            }

            continue;
        }

        if (!documented.has(name) && !(name in exempt)) {
            errors.push(`${label}: runtime export \`${name}\` is not documented`);
        }
    }

    for (const name of types) {
        if (!documented.has(name) && !declared.has(name) && !(name in typeExempt)) {
            errors.push(`${label}: type export \`${name}\` is not documented`);
        }
    }

    for (const name of Object.keys(exempt)) {
        if (!values.has(name)) {
            errors.push(`${label}: stale exemption \`${name}\` (not a runtime export)`);
        } else if (documented.has(name) || (name === 'default' && defaultDocumented)) {
            errors.push(`${label}: stale exemption \`${name}\` (it is documented)`);
        }
    }

    for (const name of Object.keys(typeExempt)) {
        if (!types.has(name)) {
            errors.push(`${label}: stale type exemption \`${name}\` (not a type export)`);
        } else if (documented.has(name) || declared.has(name)) {
            errors.push(`${label}: stale type exemption \`${name}\` (it is documented)`);
        }
    }

    return errors;
}
