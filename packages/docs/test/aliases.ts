/**
 * Every public entry of the plugin packages, mapped to its source file
 * (relative to the repository root). The Vitest config turns each into an
 * anchored alias and `tsconfig.json` repeats them as `paths`, so samples and
 * checks run against the plugin sources, not against a stale `dist`.
 */
export const PACKAGE_ENTRIES: Record<string, string> = {
    '@routup/assets': 'packages/assets/src/index.ts',
    '@routup/basic': 'packages/basic/src/index.ts',
    '@routup/basic/body': 'packages/basic/src/body.ts',
    '@routup/basic/cookie': 'packages/basic/src/cookie.ts',
    '@routup/basic/query': 'packages/basic/src/query.ts',
    '@routup/body': 'packages/body/src/index.ts',
    '@routup/cookie': 'packages/cookie/src/index.ts',
    '@routup/cors': 'packages/cors/src/index.ts',
    '@routup/decorators': 'packages/decorators/src/index.ts',
    '@routup/decorators/preset': 'packages/decorators/src/preset/index.ts',
    '@routup/i18n': 'packages/i18n/src/index.ts',
    '@routup/logger': 'packages/logger/src/index.ts',
    '@routup/prometheus': 'packages/prometheus/src/index.ts',
    '@routup/query': 'packages/query/src/index.ts',
    '@routup/rate-limit': 'packages/rate-limit/src/index.ts',
    '@routup/rate-limit-redis': 'packages/rate-limit-redis/src/index.ts',
    '@routup/swagger-ui': 'packages/swagger-ui/src/index.ts',
};

/**
 * Anchored, so `@routup/basic` does not also capture `@routup/basic/body`.
 */
export function buildAliases(root: string): { find: RegExp; replacement: string }[] {
    return Object.entries(PACKAGE_ENTRIES).map(([specifier, file]) => ({
        find: new RegExp(`^${RegExp.escape(specifier)}$`),
        replacement: `${root}/${file}`,
    }));
}
