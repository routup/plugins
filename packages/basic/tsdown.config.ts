import { defineConfig } from 'tsdown';

export default defineConfig({
    entry: ['src/index.ts', 'src/body.ts', 'src/cookie.ts', 'src/query.ts'],
    format: 'esm',
    dts: true,
    clean: true,
});
