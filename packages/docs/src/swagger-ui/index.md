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

- A **filesystem path** to a JSON file: `'./writable/swagger.json'`
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

## Served files

Only `GET` and `HEAD` are answered. The handler serves the HTML shell (at `/` and `/index.html`), its generated `swagger-initializer.js` and `index.css`, and from `swagger-ui-dist` only `swagger-ui.css`, `swagger-ui-bundle.js`, `swagger-ui-standalone-preset.js` and the two favicons. `oauth2-redirect.html` (with `oauth2-redirect.js`) is served when `oauth` or `oauth2RedirectUrl` is set, or when a document passed as object or file declares an `oauth2`/`openIdConnect` scheme. Any other path or method is passed to the next handler (`404` when there is none).

Document values are serialized with `<`, `>`, `&`, U+2028 and U+2029 escaped, so they cannot break out of the bootstrap.

## Content security policy

The shell has no inline script or style, so it works under `script-src 'self'; style-src 'self'`. Set `csp: true` to send the recommended policy on every response (including `304`s), or a string to send that policy:

```typescript
router.use('/docs', swaggerUI('./openapi.json', { csp: true }));
```

The recommended policy allows `blob:` images and media (binary "Try it out" responses) and adds the document's remote origins (document URL, `servers`, OAuth token URLs) to `connect-src`. Origins it cannot know (servers of a document loaded by URL, an OpenID Connect `token_endpoint` on another origin) need a string policy. `buildContentSecurityPolicy({ connectSrc, imgSrc, origins })` returns the same policy for your own header. See the [package README](https://github.com/routup/plugins/tree/master/packages/swagger-ui#content-security-policy) for the full policy.

The UI uses `BaseLayout`, without Swagger UI's top bar, so visitors see the configured document only and cannot load others by URL. `layout: 'StandaloneLayout'` brings the top bar back.

## Install analytics

`swagger-ui-dist` depends on `@scarf/scarf`, whose postinstall script sends install analytics. Set `SCARF_ANALYTICS=false` to disable it.

## Producing the document

For OpenAPI documents generated from `@routup/decorators` controllers, see [Decorators → OpenAPI generation](/decorators/#openapi-generation). It walks through calling [`@trapi/swagger`](https://github.com/trapi/trapi)'s `generateSwagger()` with the bundled `@routup/decorators/preset`, or using the `trapi` CLI. Run that at build time, write the spec to `./openapi.json` (or wherever), and point `swaggerUI()` at the result so production doesn't recompute it on every boot.

## See also

- [`@routup/decorators` → OpenAPI generation](/decorators/#openapi-generation) — produce the document the UI serves
- [`@trapi/swagger`](https://github.com/trapi/trapi) — the upstream OpenAPI generator
