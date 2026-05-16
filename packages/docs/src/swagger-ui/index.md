---
title: Swagger UI
description: Mount Swagger UI on a routup router from a JSON document or remote URL.
relatedPlugins: [decorators]
---

# @routup/swagger-ui

`swaggerUI()` mounts [`swagger-ui-dist`](https://www.npmjs.com/package/swagger-ui-dist) at any path and serves a given OpenAPI document.

## Installation

```bash
npm install @routup/swagger-ui
```

## Quick start

```typescript
import { App, serve } from 'routup';
import { swaggerUI } from '@routup/swagger-ui';

const router = new App();

router.use('/docs', swaggerUI('./openapi.json'));

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

## Producing the document

For OpenAPI documents generated from `@routup/decorators` controllers, see [Decorators → OpenAPI generation](/decorators/#openapi-generation). It walks through calling [`@trapi/swagger`](https://github.com/trapi/trapi)'s `generateSwagger()` with the bundled `@routup/decorators/preset`, or using the `trapi` CLI. Run that at build time, write the spec to `./openapi.json` (or wherever), and point `swaggerUI()` at the result so production doesn't recompute it on every boot.

## See also

- [`@routup/decorators` → OpenAPI generation](/decorators/#openapi-generation) — produce the document the UI serves
- [`@trapi/swagger`](https://github.com/trapi/trapi) — the upstream OpenAPI generator
