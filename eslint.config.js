import config from '@tada5hi/eslint-config';

export default [
    ...await config(),
    {
        ignores: ['**/dist/**'],
    },
    {
        // Public subpath entries (@routup/basic/body, ./cookie, ./query) re-exporting the underlying plugins.
        files: ['packages/basic/src/{body,cookie,query}.ts'],
        rules: {
            '@tada5hi/no-reexport-shims': 'off',
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
