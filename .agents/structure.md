# Project Structure

## Monorepo Layout

```
plugins/
├── packages/           # All plugin packages (@routup/*)
│   ├── assets/         # Static file serving
│   ├── basic/          # Bundle: body + cookie + query
│   ├── body/           # Request body parsing
│   ├── cookie/         # Cookie read/write
│   ├── cors/           # Native CORS — preflight + Access-Control-* headers
│   ├── decorators/     # Class/method/parameter decorators (also exports ./preset for trapi)
│   ├── docs/           # plugins.routup.dev VitePress site (private, not published)
│   ├── i18n/           # Request translation
│   ├── logger/         # Morgan-compatible request logger (handler factory, not Plugin)
│   ├── prometheus/     # Metrics collection (prom-client)
│   ├── query/          # Query string parsing (qs)
│   ├── rate-limit/     # In-memory rate limiting
│   ├── rate-limit-redis/ # Redis adapter for rate-limit
│   └── swagger-ui/     # Mount Swagger UI from a generated/given OpenAPI document
├── .github/            # CI workflows, reusable actions, root README images (assets/)
├── nx.json             # NX task config and caching
├── tsconfig.json       # Root TypeScript config
└── package.json        # Workspace root
```

## Standard Package Layout

Every package follows the same structure:

```
packages/[name]/
├── assets/logo.svg       # README logo, referenced as ./assets/logo.svg
├── src/
│   ├── index.ts           # Public exports (plugin + types)
│   ├── module.ts          # Plugin factory function
│   ├── handler.ts         # Middleware/handler creation
│   ├── types.ts           # Options interface
│   ├── request.ts         # Request helpers (useRequestX)
│   └── utils/             # Internal helpers
├── test/
│   ├── vitest.config.ts
│   └── unit/*.spec.ts
├── package.json           # ESM-only exports
├── tsconfig.json          # Extends root
├── tsconfig.build.json    # Declaration-only emit
└── tsdown.config.ts       # Build config
```

`docs` does not follow this layout (see Docs below).

## Packages Overview

| Package | Scope | Description | Key Deps |
|---------|-------|-------------|----------|
| `assets` | `@routup/assets` | Serve static files | `send`, `encodeurl` |
| `basic` | `@routup/basic` | Body + cookie + query bundle | `@routup/body`, `@routup/cookie`, `@routup/query` |
| `body` | `@routup/body` | Parse JSON, form, text, raw bodies | — |
| `cookie` | `@routup/cookie` | Read/serialize cookies | `cookie` |
| `cors` | `@routup/cors` | Native CORS handling (preflight + headers), ported from h3 | — |
| `decorators` | `@routup/decorators` | Route decorators + `./preset` subpath (the `@trapi/metadata` preset for `@D*`) | `@routup/body`, `@routup/cookie`, `@routup/query`; optional peer `@trapi/metadata` |
| `i18n` | `@routup/i18n` | Request translations | — |
| `logger` | `@routup/logger` | Request logger ported from morgan; **handler factory**, not a Plugin | — |
| `prometheus` | `@routup/prometheus` | Metrics + /metrics endpoint | `prom-client` |
| `query` | `@routup/query` | Query string parsing | `qs` |
| `rate-limit` | `@routup/rate-limit` | In-memory rate limiter | — |
| `rate-limit-redis` | `@routup/rate-limit-redis` | Redis rate-limit adapter | `@routup/rate-limit`, `redis-extension` |
| `swagger-ui` | `@routup/swagger-ui` | Mount Swagger UI from a JSON document or URL | `@routup/assets`, `swagger-ui-dist` |

OpenAPI generation is not a routup-owned package: call `@trapi/swagger`'s `generateSwagger()` directly with `buildPreset()` from `@routup/decorators/preset`, or use the `trapi` CLI with `--preset @routup/decorators/preset`. The tested snippet is `packages/docs/examples/decorators/openapi.ts`.

## Dependency Layers

```
Layer 3 (composites):   basic
Layer 2 (adapters):     rate-limit-redis, swagger-ui
Layer 1 (standalone):   assets, body, cookie, cors, decorators, i18n, logger, prometheus, query, rate-limit
```

All packages peer-depend on `routup`; the Requirements table of `packages/docs/src/guide/getting-started.md` lists each range and is checked against the manifests. Pages and READMEs never state a range for an `@routup/*` package, because release-please rewrites those ranges in every release.

## Docs

- `packages/docs` consumes `@routup/docs-theme` from npm (source in `routup/docs-theme`): `src/.vitepress/config.mts` calls `defineRoutupConfig`, `src/.vitepress/theme/index.ts` re-exports the theme. The landing page `src/index.md` is `layout: page`, `pageClass: rt-home`, with all copy in frontmatter; its sections live in `src/.vitepress/components/home/`. The plugin grid comes from the `plugin: { package, summary, group, order? }` frontmatter of each plugin's `index.md`, loaded by `src/.vitepress/data/plugins.data.ts`.
- The sidebar is built by `buildSidebar()` from `PLUGIN_PAGES` and `GUIDE_PAGES` in `config.mts`; a new page under `src/<name>/` or `src/guide/` goes into the matching list, and a plugin's `related` list mirrors the `relatedPlugins` of its overview (checked by the sidebar spec). `src/guide/` must have no `index.md`: the landing loader reads every `*/index.md` as a plugin page and throws without `plugin` frontmatter.
- `src/<name>/` holds one plugin's pages: `index.md` (overview), `configuration.md`, `helpers.md`, `recipes.md` (`decorators` adds `controllers.md` and `parameters.md`); a small plugin (`basic`, `i18n`, `rate-limit-redis`) folds them into `index.md`. `src/guide/` holds the cross-plugin pages (Getting Started, Combining Plugins).
- Pages include samples from `examples/<plugin>/*.ts` (`<<< @/../examples/...`); each exports `app` and is run by `test/unit/examples/<plugin>.spec.ts`. The docs tests and `build:types` resolve `@routup/*` to the plugin sources through `test/aliases.ts`, repeated as `paths` in `tsconfig.json` (a spec keeps them equal).
- Every plugin package has an entry in `test/registry.ts`; `test/unit/registry.spec.ts` checks its pages and README against the code (see testing.md).
