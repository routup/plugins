# Architecture

## Plugin Pattern

Each package exports a factory registered with `app.use()`. Most return a routup `Plugin` object; `logger()` and `rateLimit()` return a handler, and `@routup/rate-limit-redis` exports a store for `rateLimit()` (`.agents/references/morgan.md` explains the handler form of the logger):

```typescript
// module.ts: standard plugin structure
import type { Plugin } from 'routup';

export function myPlugin(options?: MyPluginOptions): Plugin {
    return {
        name: 'myPlugin',
        install: (app) => {
            app.use(createHandler(options));
        },
    };
}

export default myPlugin;
```

The `Plugin` type requires:
- `name`: unique identifier string
- `install(app)`: called with the `App` when the plugin is registered with `app.use()`

## Handler Pattern

Handlers are created via factory functions that return routup handlers:

```typescript
// handler.ts: typical handler factory
import { defineCoreHandler } from 'routup';

export function createHandler(options?: Options) {
    return defineCoreHandler((event) => {
        // middleware logic
        return event.next();
    });
}
```

## Request/Response Helpers

Plugins expose standalone helpers that take the event (`readRequestBody(event)`, `useRequestCookies(event)`, `setResponseCookie(event, ...)`). Parsed data lives in `event.store` under a symbol of the plugin, which keeps plugins decoupled:

```typescript
// request.ts: accessor pattern
import type { IAppEvent } from 'routup';

const CookieSymbol = Symbol.for('@routup/cookie:ReqCookie');

export function useRequestCookies(event: IAppEvent): Record<string, string> {
    return (event.store[CookieSymbol] ?? {}) as Record<string, string>;
}
```

## Package Entry Points

All packages are ESM-only:

```json
{
    "type": "module",
    "exports": {
        "./package.json": "./package.json",
        ".": {
            "types": "./dist/index.d.mts",
            "import": "./dist/index.mjs"
        }
    }
}
```

## Build Pipeline

```
Source (.ts) → tsdown → dist/index.mjs + dist/index.d.mts
```

NX orchestrates build order respecting inter-package dependencies.
