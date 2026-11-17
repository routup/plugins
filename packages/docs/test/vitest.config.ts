import { fileURLToPath } from 'node:url';
import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';
import { buildAliases } from './aliases.ts';

const workspaceRoot = fileURLToPath(new URL('../../..', import.meta.url)).replace(/\/$/, '');

export default defineConfig({
    resolve: { alias: buildAliases(workspaceRoot) },
    test: {
        root: fileURLToPath(new URL('..', import.meta.url)),
        environment: 'node',
        include: ['test/unit/**/*.spec.ts'],
    },
    plugins: [
        // @routup/decorators uses legacy decorators; it reads no design-time metadata
        swc.vite({
            jsc: {
                parser: {
                    syntax: 'typescript',
                    decorators: true,
                },
                transform: {
                    legacyDecorator: true,
                    decoratorMetadata: false,
                },
            },
        }),
    ],
});
