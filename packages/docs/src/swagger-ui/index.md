---
title: Swagger UI
description: Mount Swagger UI on a routup router from a JSON document or remote URL.
relatedPlugins: [swagger-generator]
---

# @routup/swagger-ui

`swaggerUI()` mounts [`swagger-ui-dist`](https://www.npmjs.com/package/swagger-ui-dist) at any path and serves a given OpenAPI document.

## Installation

```bash
npm install @routup/swagger-ui
```

## Quick start

```typescript
import { Router, serve } from 'routup';
import { swaggerUI } from '@routup/swagger-ui';

const router = new Router();

router.use('/docs', swaggerUI('test/data/swagger.json'));

serve(router, { port: 3000 });
```

Open `http://localhost:3000/docs/` to interact with the document.

## Document sources

`swaggerUI(source)` accepts:

- A **filesystem path** to a JSON or YAML file: `'./writable/swagger.json'`
- A **URL** the UI fetches at runtime: `'https://api.example.com/openapi.json'`
- A **plain object** — useful when you want to merge runtime values (auth servers, environment-specific URLs) before handing the document to the UI

```typescript
router.use('/docs', swaggerUI({
    openapi: '3.1.0',
    info: { title: 'My API', version: '1.0.0' },
    paths: { /* ... */ },
}));
```

## Mounting

The UI is mounted under whatever path you pass to `router.use()`. Trailing slashes matter for static-asset resolution — visit `/docs/` not `/docs`.

## When to combine UI + generator

Run [`@routup/swagger-generator`](/swagger-generator/) at build time to produce `swagger.json`, then point `swaggerUI()` at that file. Production servers don't need to recompute the document every boot.

## See also

- [`@routup/swagger-generator`](/swagger-generator/) — produce the document the UI serves
- [`@routup/decorators`](/decorators/) — the source of metadata the generator reads
