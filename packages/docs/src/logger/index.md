---
title: Logger
description: Morgan-compatible HTTP request logger for routup, on top of native web-API helpers.
relatedPlugins: []
---

# @routup/logger

A request logger ported from [morgan](https://github.com/expressjs/morgan). Same token DSL, same preset formats (`tiny`, `short`, `common`, `combined`, `dev`) — built on routup's `IRoutupEvent` + `Response`.

## Installation

```bash
npm install @routup/logger
```

## Quick start

```typescript
import { Router, defineCoreHandler, serve } from 'routup';
import { logger } from '@routup/logger';

const router = new Router();

router.use(logger('tiny'));

router.get('/', defineCoreHandler(() => 'ok'));

serve(router, { port: 3000 });
```

The handler logs **after** the response is resolved so `:status`, `:response-time`, and `:res[*]` tokens reflect real values.

## Why a handler, not a plugin

Most routup packages export a `Plugin`. `logger()` instead returns a `CoreHandler` you pass to `router.use(...)`. The reason is structural: a routup `Plugin`'s middleware lives inside a **dedicated sub-router**, and `event.next()` from inside that sub-router walks only the sub-router's stack — it never sees the route handler that produced the response. Logging fundamentally needs the resolved `Response`, so it has to live on the parent router. Same ergonomics (`router.use(...)`), different shape.

## Preset formats

| Name | Format |
|---|---|
| `tiny` | `:method :url :status :res[content-length] - :response-time ms` |
| `short` | `:remote-addr :remote-user :method :url HTTP/:http-version :status :res[content-length] - :response-time ms` |
| `common` | Apache common log |
| `combined` | Apache combined log (adds referrer + user-agent) |
| `dev` | Status color-coded; tuned for terminals |

```typescript
router.use(logger('combined'));
router.use(logger('dev'));
```

## Custom format string

```typescript
router.use(logger(':method :url :status :response-time ms'));
```

## Pluggable write target

```typescript
router.use(logger('tiny', {
    write: (line) => myStructuredLogger.info({ msg: line }),
}));
```

## Skip predicate

```typescript
router.use(logger('tiny', {
    skip: (event) => event.path === '/health',
}));
```

## Custom tokens

```typescript
router.use(logger(':method :url :user', {
    tokens: {
        user: (event) => event.store.userId as string | undefined,
    },
}));
```

## See also

- [Helpers](./helpers) — `compile`, `resolveFormat`, `defaultTokens`, `formatStrings`
