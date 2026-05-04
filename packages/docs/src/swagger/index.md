---
title: Swagger
description: Generate OpenAPI v2 / v3 documents from decorated controllers and serve Swagger UI.
relatedPlugins: [decorators]
---

# @routup/swagger

Two things in one plugin:

1. **Generator** — walk a TypeScript codebase, extract route metadata via [`@trapi/metadata`](https://github.com/trapi/trapi), and emit an OpenAPI v2 or v3 document.
2. **UI** — mount [Swagger UI](https://github.com/swagger-api/swagger-ui) at any path to serve the generated document interactively.

The package also bundles the `@trapi/metadata` preset that interprets routup's `@D*` decorators (`@DController`, `@DGet`, `@DBody`, …) — no separate preset install needed. Pair with [`@routup/decorators`](/decorators/) so controllers and parameter decorators are the source of truth.

## Installation

```bash
npm install @routup/swagger
```

## When to use it

- You want OpenAPI docs that stay in sync with your handlers — the generator reads the same decorators that mount the routes
- You want Swagger UI inline in the same routup app, no separate process
- You're publishing a public API and need a contract artifact for client codegen

If you're hand-writing your OpenAPI document (or generating it from another source), you only need the **UI** half — skip the generator and feed `swaggerUI()` your existing `swagger.json` / `openapi.yaml`.

## See also

- [Generator](./generator) — `generate()`, V2 vs V3, output paths
- [UI](./ui) — `swaggerUI()`, mounting, custom UI options
- [`@routup/decorators`](/decorators/) — write controllers in the shape the generator expects
