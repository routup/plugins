import { readFileSync, readdirSync } from 'node:fs';
import { builtinModules } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const docsRoot = fileURLToPath(new URL('../..', import.meta.url));
const examplesRoot = path.join(docsRoot, 'examples');

/**
 * The package a bare specifier imports from: `@scope/name` or `name`.
 */
function readPackageName(specifier: string): string {
    const parts = specifier.split('/');

    return specifier.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0]!;
}

/**
 * The bare specifiers of the static imports and re-exports of a file.
 */
function readBareImports(source: string): string[] {
    return source.matchAll(/^\s*(?:import|export)\s(?:[^'";]*?\sfrom\s)?['"]([^'"]+)['"]/gm)
        .map((match) => match[1]!)
        .filter((specifier) => !specifier.startsWith('.') && !specifier.startsWith('/'))
        .filter((specifier) => !specifier.startsWith('node:') && !builtinModules.includes(specifier))
        .toArray();
}

describe('readBareImports', () => {
    it('reads static imports and re-exports, multi-line ones included', () => {
        const source = [
            'import { App } from \'routup\';',
            'import type { Options } from "@routup/body";',
            'import {',
            '    a,',
            '    b,',
            '} from \'@trapi/core\';',
            'import \'reflect-metadata\';',
            'export { x } from \'@routup/basic/body\';',
            'import fs from \'node:fs\';',
            'import { local } from \'./local\';',
        ].join('\n');

        expect(readBareImports(source)).toEqual(['routup', '@routup/body', '@trapi/core', 'reflect-metadata', '@routup/basic/body']);
        expect(readPackageName('@routup/basic/body')).toBe('@routup/basic');
        expect(readPackageName('prom-client')).toBe('prom-client');
    });
});

describe('sample imports', () => {
    it('come from a declared dependency of the docs package', () => {
        const manifest = JSON.parse(readFileSync(path.join(docsRoot, 'package.json'), 'utf8')) as Record<string, Record<string, string> | undefined>;
        const declared = new Set([
            ...Object.keys(manifest.dependencies ?? {}),
            ...Object.keys(manifest.devDependencies ?? {}),
            ...Object.keys(manifest.peerDependencies ?? {}),
        ]);
        const files = (readdirSync(examplesRoot, { recursive: true }) as string[])
            .filter((file) => file.endsWith('.ts'))
            .sort();
        const errors: string[] = [];

        expect(files.length).toBeGreaterThan(90);

        for (const file of files) {
            for (const specifier of readBareImports(readFileSync(path.join(examplesRoot, file), 'utf8'))) {
                if (!declared.has(readPackageName(specifier))) {
                    errors.push(`examples/${file}: ${specifier}`);
                }
            }
        }

        expect(errors).toEqual([]);
    });
});
