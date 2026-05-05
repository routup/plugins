# Project Structure

## Monorepo Layout

```
plugins/
├── packages/           # All plugin packages (@routup/*)
│   ├── assets/         # Static file serving
│   ├── basic/          # Bundle: body + cookie + query
│   ├── body/           # Request body parsing
│   ├── cookie/         # Cookie read/write
│   ├── decorators/     # Class/method/parameter decorators (also exports ./preset for trapi)
│   ├── i18n/           # Request translation
│   ├── prometheus/     # Metrics collection (prom-client)
│   ├── query/          # Query string parsing (qs)
│   ├── rate-limit/     # In-memory rate limiting
│   ├── rate-limit-redis/ # Redis adapter for rate-limit
│   └── swagger-ui/     # Mount Swagger UI from a generated/given OpenAPI document
├── .github/            # CI workflows + reusable actions
├── nx.json             # NX task config and caching
├── rollup.config.mjs   # Shared Rollup config factory
├── tsconfig.json       # Root TypeScript config
└── package.json        # Workspace root
```

## Standard Package Layout

Every package follows the same structure:

```
packages/[name]/
├── src/
│   ├── index.ts           # Public exports (plugin + types)
│   ├── module.ts          # Plugin factory function
│   ├── handler.ts         # Middleware/handler creation
│   ├── types.ts           # Options interface
│   ├── request.ts         # Request helpers (useRequestX)
│   └── utils/             # Internal helpers
├── test/
│   ├── jest.config.js
│   └── unit/*.spec.ts
├── package.json           # Dual ESM/CJS exports
├── tsconfig.json          # Extends root
├── tsconfig.build.json    # Declaration-only emit
└── rollup.config.mjs      # Imports createConfig from root
```

## Packages Overview

| Package | Scope | Description | Key Deps |
|---------|-------|-------------|----------|
| `assets` | `@routup/assets` | Serve static files | `send`, `encodeurl` |
| `basic` | `@routup/basic` | Body + cookie + query bundle | `@routup/body`, `@routup/cookie`, `@routup/query` |
| `body` | `@routup/body` | Parse JSON, form, text, raw bodies | — |
| `cookie` | `@routup/cookie` | Read/serialize cookies | `cookie` |
| `decorators` | `@routup/decorators` | Route decorators + `./preset` subpath (the `@trapi/metadata` preset for `@D*`) | `@routup/body`, `@routup/cookie`, `@routup/query`; optional peer `@trapi/metadata` |
| `i18n` | `@routup/i18n` | Request translations | — |
| `prometheus` | `@routup/prometheus` | Metrics + /metrics endpoint | `prom-client` |
| `query` | `@routup/query` | Query string parsing | `qs` |
| `rate-limit` | `@routup/rate-limit` | In-memory rate limiter | — |
| `rate-limit-redis` | `@routup/rate-limit-redis` | Redis rate-limit adapter | `@routup/rate-limit`, `ioredis` |
| `swagger-ui` | `@routup/swagger-ui` | Mount Swagger UI from a JSON document or URL | `@routup/assets`, `swagger-ui-dist` |

OpenAPI generation is not a routup-owned package — call `@trapi/swagger`'s `generateSwagger()` directly with `buildPreset()` from `@routup/decorators/preset`, or use the `trapi` CLI with `--preset @routup/decorators/preset`. See `packages/decorators/README.md` for the snippet.

## Dependency Layers

```
Layer 3 (composites):   basic
Layer 2 (adapters):     rate-limit-redis, swagger-ui
Layer 1 (standalone):   assets, body, cookie, decorators, i18n, prometheus, query, rate-limit
```

All packages peer-depend on `routup@^4.0.1`.
