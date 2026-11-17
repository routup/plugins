import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { PACKAGE_ENTRIES } from '../aliases';

const docsRoot = fileURLToPath(new URL('../..', import.meta.url));
const workspaceRoot = path.resolve(docsRoot, '..', '..');

function readJson(file: string): Record<string, any> {
    return JSON.parse(readFileSync(file, 'utf8'));
}

describe('package aliases', () => {
    it('cover every public entry of every plugin package', () => {
        const expected: string[] = [];

        for (const folder of readdirSync(path.join(workspaceRoot, 'packages'))) {
            const file = path.join(workspaceRoot, 'packages', folder, 'package.json');

            if (folder === 'docs' || !existsSync(file)) {
                continue;
            }

            const pkg = readJson(file);

            for (const key of Object.keys(pkg.exports ?? {})) {
                if (key !== './package.json') {
                    expected.push(key === '.' ? pkg.name : `${pkg.name}/${key.slice(2)}`);
                }
            }
        }

        expect(expected.length).toBeGreaterThan(0);
        expect(Object.keys(PACKAGE_ENTRIES).sort()).toEqual(expected.sort());
    });

    it('point at existing source files', () => {
        for (const file of Object.values(PACKAGE_ENTRIES)) {
            expect(existsSync(path.join(workspaceRoot, file)), file).toBe(true);
        }
    });

    it('match the paths of tsconfig.json', () => {
        const { paths } = readJson(path.join(docsRoot, 'tsconfig.json')).compilerOptions;
        const expected = Object.fromEntries(Object.entries(PACKAGE_ENTRIES)
            .map(([specifier, file]) => [specifier, [path.relative(docsRoot, path.join(workspaceRoot, file))]]));

        expect(paths).toEqual(expected);
    });
});
