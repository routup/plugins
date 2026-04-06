# Testing

## Framework

- **Runner**: Vitest 4 with v8 coverage provider
- **HTTP Testing**: `supertest` for integration-style tests against routup Router
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

Tests use `supertest` with a real routup `Router` instance — no mocking of the framework:

```typescript
import { describe, it, expect } from 'vitest';
import supertest from 'supertest';
import { Router, coreHandler, createNodeDispatcher } from 'routup';
import { body, useRequestBody } from '../../src';

describe('body plugin', () => {
    it('should parse json body', async () => {
        const router = new Router();
        router.use(body({ json: true }));
        router.post('/', coreHandler((req, res) => useRequestBody(req)));

        const server = supertest(createNodeDispatcher(router));
        const response = await server
            .post('/')
            .send({ foo: 'bar' });

        expect(response.body).toEqual({ foo: 'bar' });
    });
});
```

## Key Conventions

- Import `describe`, `it`, `expect` explicitly from `vitest`
- Always test through HTTP with `supertest` — don't unit-test handlers in isolation
- Use `createNodeDispatcher(router)` to bridge routup Router to a Node HTTP server
- Test both success and error paths
- Each package owns its own coverage config
- `packages/decorators` uses `unplugin-swc` in its vitest config for legacy decorator support
