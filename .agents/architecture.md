# Architecture

## Plugin Pattern

Every plugin is a factory function that returns a `Plugin` object compatible with routup's `Router.use()`:

```typescript
// module.ts — standard plugin structure
import type { Plugin } from 'routup';

export function myPlugin(options?: MyPluginOptions): Plugin {
    return {
        name: 'myPlugin',
        install: (router) => {
            router.use(createHandler(options));
        },
    };
}

export default myPlugin;
```

The `Plugin` interface requires:
- `name` — unique identifier string
- `install(router)` — called when the plugin is registered on a router

## Handler Pattern

Handlers are created via factory functions that return routup `Handler` functions:

```typescript
// handler.ts — typical handler factory
import { coreHandler } from 'routup';

export function createHandler(options?: Options) {
    return coreHandler((req, res, next) => {
        // Middleware logic
        next();
    });
}
```

## Request/Response Helpers

Plugins expose `useRequest*` and `useResponse*` utility functions for consumers to access parsed data:

```typescript
// request.ts — accessor pattern
import { useRequestParam } from 'routup';

export function useRequestBody(req: Request): unknown {
    return useRequestParam(req, 'body');
}

export function setRequestBody(req: Request, value: unknown): void {
    setRequestParam(req, 'body', value);
}
```

This pattern stores data on the request object via routup's param system, keeping plugins decoupled.

## Package Entry Points

All packages use dual ESM/CJS exports:

```json
{
    "exports": {
        "./package.json": "./package.json",
        ".": {
            "types": "./dist/index.d.ts",
            "import": "./dist/index.mjs",
            "require": "./dist/index.cjs"
        }
    }
}
```

## Build Pipeline

```
Source (.ts) → Rollup + SWC → dist/index.mjs + dist/index.cjs
Source (.ts) → tsc --emitDeclarationOnly → dist/index.d.ts
```

NX orchestrates build order respecting inter-package dependencies.
