import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'node',
        include: ['test/unit/**/*.spec.ts'],
        coverage: {
            provider: 'v8',
            include: ['src/**/*.ts'],
            exclude: ['src/**/*.d.ts'],
            thresholds: {
                branches: 58,
                functions: 77,
                lines: 73,
                statements: 73,
            },
        },
    },
});
