# Testing

## Framework

- **Runner**: Vitest 5 with v8 coverage provider
- **HTTP Testing**: a routup `App` driven through `app.fetch()`
- **Coverage**: Enforced thresholds (~58% branches, ~73-77% lines/functions/statements)

## Running Tests

```bash
npm run test              # All packages (NX-orchestrated)
cd packages/body && npx vitest run --config ./test/vitest.config.ts  # Single package
```

## Test Structure

Tests live in `packages/[name]/test/unit/*.spec.ts`. Each package has its own `test/vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'node',
        include: ['test/unit/**/*.spec.ts'],
        coverage: {
            provider: 'v8',
            include: ['src/**/*.ts'],
            exclude: ['src/**/*.d.ts'],
            thresholds: { branches: 58, functions: 77, lines: 73, statements: 73 },
        },
    },
});
```

## Test Pattern

Tests run a real routup `App` through `app.fetch()` with a Web `Request`; no mocking of the framework:

```typescript
import { describe, expect, it } from 'vitest';
import { App, defineCoreHandler } from 'routup';
import { body, readRequestBody } from '../../src';

describe('body plugin', () => {
    it('should parse json body', async () => {
        const app = new App();
        app.use(body());
        app.post('/', defineCoreHandler((event) => readRequestBody(event)));

        const response = await app.fetch(new Request('http://localhost/', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ foo: 'bar' }),
        }));

        expect(await response.json()).toEqual({ foo: 'bar' });
    });
});
```

## Key Conventions

- Import `describe`, `it`, `expect` explicitly from `vitest`
- Test through `app.fetch()`; don't unit-test handlers in isolation
- Test both success and error paths
- Each package owns its own coverage config
- `packages/decorators` and the docs tests use `unplugin-swc` in their vitest config for legacy decorator support

## Docs Tests

`npx nx run @routup/plugins-docs:test` (also part of `npm run test`) checks the docs site against the code:

- `test/unit/registry.spec.ts`: every `@routup/*` package needs an entry in `test/registry.ts`. Per entry: the Options table against the options type, nested option tables, the exports of the main entry and each subpath (`entries`, or `subpathExempt` with a reason) against the API pages, the README (no Options, API, Notes or Usage heading; links to the docs; contains `examples/<name>/quick-start.ts`), the sidebar. Exemptions carry a reason and fail when stale. It compares names only; pin types, defaults and behaviour stated on a page in the sample spec.
- `test/unit/links.spec.ts`: every internal link and anchor in `src/**/*.md` and every `https://plugins.routup.dev/...` link in a README resolves to a page and a heading (anchors are computed with VitePress' slugify in `test/doc-checks.ts`).
- `test/unit/examples/<plugin>.spec.ts`: runs each sample the pages include.
- `test/aliases.ts` resolves `@routup/*` to `packages/*/src`, so no build is needed. The NX `test` and `build` inputs of `packages/docs/package.json` list the plugin sources and READMEs; a new file the docs tests read outside `packages/docs` needs an input there, or NX serves a stale cached result.
