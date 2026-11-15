import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    plugins: [vue()],
    test: {
        root: fileURLToPath(new URL('..', import.meta.url)),
        environment: 'node',
        include: ['test/unit/**/*.spec.ts'],
    },
});
