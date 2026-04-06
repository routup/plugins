# Testing

## Framework

- **Runner**: Jest 30 with `@swc/jest` transformer
- **HTTP Testing**: `supertest` for integration-style tests against routup Router
- **Coverage**: Enforced thresholds (~58% branches, ~73-77% lines/functions/statements)

## Running Tests

```bash
npm run test              # All packages (NX-orchestrated)
cd packages/body && npx jest  # Single package
```

## Test Structure

Tests live in `packages/[name]/test/unit/*.spec.ts`. Each package has its own `jest.config.js`:

```javascript
module.exports = {
    testEnvironment: 'node',
    transform: { "^.+\\.(ts|tsx)$": "@swc/jest" },
    testRegex: "(/unit/.*|(\\.|/)(test|spec))\\.(ts|js)x?$",
    coverageThreshold: { global: { branches: 58, functions: 73, lines: 77, statements: 77 } },
};
```

## Test Pattern

Tests use `supertest` with a real routup `Router` instance — no mocking of the framework:

```typescript
import supertest from 'supertest';
import { Router, coreHandler, createNodeDispatcher } from 'routup';
import { bodyPlugin, useRequestBody } from '../../src';

describe('body plugin', () => {
    it('should parse json body', async () => {
        const router = new Router();
        router.use(bodyPlugin());
        router.get('/', coreHandler((req, res) => {
            return useRequestBody(req);
        }));

        const server = supertest(createNodeDispatcher(router));
        const response = await server
            .post('/')
            .send({ foo: 'bar' })
            .set('Content-Type', 'application/json');

        expect(response.body).toEqual({ foo: 'bar' });
    });
});
```

## Key Conventions

- Always test through HTTP with `supertest` — don't unit-test handlers in isolation
- Use `createNodeDispatcher(router)` to bridge routup Router to a Node HTTP server
- Test both success and error paths
- Each package owns its own coverage config
