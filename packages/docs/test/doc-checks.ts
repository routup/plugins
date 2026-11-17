/**
 * Readers that compare what a docs page states with what a package
 * exports. Markdown is read line by line; fenced code is skipped. Types and
 * exports come from the TypeScript checker, so intersections, mapped types
 * and re-exports resolve the way a consumer sees them.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

type Heading = {
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
const TABLE_NAME = /^([A-Za-z_$][\w$]*)(?:<[^`]*>)?$/;

/**
 * The lines outside fenced code, each with its parsed heading when it is
 * one. A fence closes only on a line holding nothing but a marker of the
 * same character, at least as long as the opening one.
 */
function readLines(markdown: string): Line[] {
    const output: Line[] = [];
    let fence: string | undefined;

    for (const text of markdown.split(/\r?\n/)) {
        if (fence) {
            const trimmed = text.trim();

            if (
                trimmed.length >= fence.length &&
                trimmed === fence[0]!.repeat(trimmed.length) &&
                /^ {0,3}\S/.test(text)
            ) {
                fence = undefined;
            }

            continue;
        }

        const open = FENCE_OPEN.exec(text);

        if (open) {
            fence = open[1];

            continue;
        }

        const match = HEADING.exec(text);

        output.push(match ?
            { text, heading: { level: match[1]!.length, text: match[2]!.trim() } } :
            { text });
    }

    return output;
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
 * "Other Exports".
 */
export function readDocumentedNames(markdown: string): string[] {
    const names: string[] = [];
    let inExportTable = false;

    for (const line of readLines(markdown)) {
        if (line.heading) {
            inExportTable = line.heading.text.startsWith('Types') ||
                line.heading.text.startsWith('Other Exports');

            if (line.heading.level === 2 || line.heading.level === 3) {
                const match = EXACT_NAME.exec(line.heading.text);

                if (match) {
                    names.push(match[1]!);
                }
            }

            continue;
        }

        if (!inExportTable || !isTableRow(line.text) || isSeparatorRow(line.text)) {
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
 * constants, `default`) and type-only exports. `defaultAlias` names the
 * export that resolves to the same declaration as the default export, if
 * any. A re-export whose target does not resolve throws, as does any
 * semantic error in the entry file, so a broken barrel is not mistaken for
 * a smaller API.
 */
export function readExports(entryFile: string): {
    values: Set<string>;
    types: Set<string>;
    defaultAlias: string | undefined;
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
    const defaultAlias = defaultTarget ?
        targets.entries().find(([name, target]) => name !== 'default' && target === defaultTarget)?.[0] :
        undefined;

    return {
        values,
        types,
        defaultAlias,
    };
}
