import config from '@tada5hi/eslint-config';

export default [
    ...await config(),
    {
        ignores: ['**/dist/**', '**/.vitepress/cache/**'],
    },
    {
        // Public subpath entries (@routup/basic/body, ./cookie, ./query) re-exporting the underlying plugins.
        files: ['packages/basic/src/{body,cookie,query}.ts'],
        rules: {
            '@tada5hi/no-reexport-shims': 'off',
        },
    },
    {
        // Decorator samples declare a controller next to its middlewares or parent class.
        files: ['packages/docs/examples/decorators/**/*.ts', 'packages/docs/test/unit/examples/decorators.spec.ts'],
        rules: {
            'max-classes-per-file': 'off',
        },
    },
    {
        // Docs samples print their output; the pages show what they print.
        files: ['packages/docs/examples/**/*.ts'],
        rules: {
            'no-console': 'off',
        },
    },
    {
        rules: {
            '@typescript-eslint/no-unused-vars': 'off',
            // Error.isError and Uint8Array base64 helpers are not available on every supported Node version (engines: >=22).
            'unicorn/prefer-error-is-error': 'off',
            'unicorn/prefer-uint8array-base64': 'off',
        },
    },
];
