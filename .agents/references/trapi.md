# TRAPI Reference

[TRAPI](https://github.com/tada5hi/trapi) is the metadata + OpenAPI generation library this repo's decorators feed into. The `@trapi/metadata` preset that decodes routup's `@D*` decorators lives in `@routup/decorators` (under `packages/decorators/src/preset/`, exposed as the `./preset` subpath export). There is no first-party generator wrapper — consumers call `@trapi/swagger`'s `generateSwagger()` directly, or use the `trapi` CLI with `--preset @routup/decorators/preset`.

The local clone lives at `/opt/projects/tada5hi/trapi` — refer to it whenever a routup-side change needs to know how the metadata pipeline interprets a decorator.

## Version Snapshot (as of 2026-04-26)

| | Version | Notes |
|---|---|---|
| `@trapi/metadata` | 1.3.0 (next: 2.0.0 on PR #798) | Core metadata extraction; v2 adds `Preset` + handler architecture |
| `@trapi/swagger` | 1.3.0 (next: 2.0.0 on PR #798) | OpenAPI 2.0 / 3.0 / 3.1 / 3.2 emission |
| `@trapi/decorators` | 1.3.0 (next: 2.0.0) | Reference decorator preset (canonical names: `@Controller`, `@Get`, ...) |

## Code Mapping (TRAPI → routup/plugins)

| TRAPI module | What it does | routup/plugins consumer |
|---|---|---|
| `@trapi/metadata` `Preset` type | Schema for handler-driven decorator presets | Returned by `@routup/decorators/preset`'s `buildPreset()` (`packages/decorators/src/preset/module.ts`) |
| `@trapi/metadata` `controller(...)`, `method(...)`, `parameter(...)` | Identity builders for v2 handlers | Used in `packages/decorators/src/preset/{class,method,parameter,swagger}.ts` |
| `@trapi/metadata` `MarkerName` (`Hidden`, `Deprecated`, `Extension`) | Concept tags so the resolver can find renamed decorators | Set on `@DHidden`/`@DDeprecated` handlers |
| `@trapi/metadata` `ParamKind` (`Body`, `BodyProp`, `Query`, `QueryProp`, `Path`, `Cookie`, `Header`, `FormData`, `Context`) | Parameter source enumeration | Mapped from `@D*` parameter decorators |
| `@trapi/metadata` `generateMetadata()` | Public entry: scans source, returns `Metadata` | Called by `@trapi/swagger`'s `generateSwagger()` (transitively) |
| `@trapi/swagger` `generateSwagger({ version, metadata, data })` | Produces OpenAPI spec | Called by consumers directly (with `buildPreset()` from `@routup/decorators/preset`) |
| `@trapi/swagger` `saveSwagger(spec, options)` | Writes spec JSON/YAML to disk | Called by consumers after `generateSwagger()` |
| `@trapi/swagger` `Version` enum | `V2 / V3 / V3_1 / V3_2` | Passed as `version` field |

## Source layout (TRAPI repo)

```text
packages/
├── metadata/src/
│   ├── core/                    # Domain types + ports (no external deps)
│   ├── adapters/decorator/v2/   # Handler/draft/registry/orchestrator
│   ├── adapters/typescript/     # TS compiler adapter (resolver lives here)
│   └── app/                     # generateMetadata() + generators
├── swagger/src/
│   ├── core/                    # SwaggerGenerateOptions + Version + spec types
│   ├── adapters/generator/      # V2Generator (2.0) and V3Generator (3.0/3.1/3.2)
│   └── app/                     # generateSwagger() + saveSwagger()
└── decorators/src/preset.ts     # Canonical reference preset (~500 LoC)
```

## Decorator → handler authoring rules

When adding a new `@D*` decorator on the routup side, mirror the canonical TRAPI preset (`packages/decorators/src/preset.ts`) when in doubt:

1. **One handler per decorator name**, scoped by `on: 'class' | 'method' | 'parameter'`.
2. **Read arguments via `ctx.argument(i)`** — don't index raw AST. The `DecoratorArgument` shape is `{ kind: 'literal' | 'identifier' | 'array' | 'object' | 'unresolvable', raw: ... }`.
3. **Read type arguments via `ctx.typeArgument(i).resolve()`** for `@DDescription<T>(...)`-style generic decorators.
4. **Tag concept-bearing handlers with a `marker`** (`MarkerName.Hidden`, `MarkerName.Deprecated`, `MarkerName.Extension`, `{ numeric: NumericKind.Int }`, ...) so the type resolver can find them by concept rather than hardcoded name.
5. **Use the `into(key)`, `append(key)`, `flag(key)` helpers** for routine draft mutations:
   - `into('path').positional(0)` — write argument 0 into `draft.path`.
   - `append('tags').positionalAll()` — variadic merge of all positional args.
   - `flag('hidden')` — set `draft.hidden = true`.

## Behavioral pitfalls / gotchas

| Topic | Note |
|---|---|
| `Version.V3` | Emits `openapi: "3.0.0"`. The pre-2.0 `@trapi/swagger` defaulted V3 to 3.1.0. Use `Version.V3_1` for the old default. |
| File writing | `output: false` / `outputDirectory` / `yaml` are gone. Call `saveSwagger(spec, ...)` separately. |
| Metadata cache | Same-byte-length edits (renaming identifiers to equal length) can produce stale cache hits. Set `cache: false` in tests. |
| Marker presence | A handler without `marker` won't be discovered for resolver concepts. If you want a renamed `@DHidden` to also strip hidden properties from emitted schemas, add `marker: MarkerName.Hidden`. |
| `extends` chain | `Preset.extends: ['@some/preset']` resolves recursively. Each handler can opt in to `replaces: true \| '<presetName>'` to shadow inherited matches. |
| `replaces` semantics | `true` shadows ALL parent matches with the same `match`; `'<presetName>'` shadows only that preset's contributions; same-preset siblings always coexist. |

## Pre-release versions via pkg.pr.new

For consuming TRAPI changes that haven't been released to npm yet, pin a pkg.pr.new SHA in `package.json`:

```jsonc
{
  "dependencies": {
    "@trapi/metadata": "https://pkg.pr.new/tada5hi/trapi/@trapi/metadata@<sha7>",
    "@trapi/swagger": "https://pkg.pr.new/tada5hi/trapi/@trapi/swagger@<sha7>"
  }
}
```

**Use lowercase `tada5hi`** — the path is case-sensitive and the auto-redirect from the convenience form (`https://pkg.pr.new/@trapi/metadata@<PR>`) lands on a 404. The CLI shorthand (`npm i https://pkg.pr.new/@trapi/metadata@798`) only works for one-off installs, not in `package.json`.

The build SHA is the head SHA of the PR or branch — find it in the pkg-pr-new bot comment on the TRAPI PR or in the run logs of the `Continuous Release` workflow.

## Migration history

- **PR tada5hi/trapi#798** (2026-04): TRAPI v2 — preset-based decorator system, marker-driven resolver, dropped `DecoratorID`/`DecoratorConfig` types. routup/plugins migrated in lockstep (preset handlers originally lived in `packages/swagger-preset/src/*`).
- **2026-05-04 (morning)**: `@routup/swagger-preset` package removed. Its preset was inlined into `@routup/swagger`; bumped `@trapi/metadata` and `@trapi/swagger` to `^2.0.0-beta.2`. `preset:` is now passed as a `Preset` object (returned by `buildPreset()`) instead of a string lookup.
- **2026-05-04 (afternoon)**: `@routup/swagger` split into `@routup/swagger-generator` (generator) and `@routup/swagger-ui` (UI-only). UI-only consumers no longer pull `@trapi/metadata` / `@trapi/swagger` (TypeScript); generator-only consumers no longer pull `swagger-ui-dist` (~10MB of static assets).
- **2026-05-04 (evening)**: Preset moved from `@routup/swagger-generator` into `@routup/decorators` as the `./preset` subpath export (`packages/decorators/src/preset/`). `@trapi/metadata` is an optional peer dep on decorators (runtime-only users skip it). Trapi CLI consumers can now pass `--preset @routup/decorators/preset`.
- **2026-05-05**: Removed `@routup/swagger-generator` entirely — the wrapper added too little value to justify its own package. Consumers now call `@trapi/swagger`'s `generateSwagger()` directly with `buildPreset()` from `@routup/decorators/preset`. Integration tests moved to `packages/decorators/test/unit/preset/{v2,v3}.spec.ts` so they validate the preset against the controllers it decodes. See `packages/decorators/README.md` (#openapi-generation) for the snippet.

## Quick-check after a TRAPI bump

```bash
# from /opt/projects/routup/plugins
npx nx run @routup/decorators:build
npx nx run @routup/decorators:test    # decorator + preset (V2 + V3) integration tests
npx nx run @routup/swagger-ui:build
npx nx run @routup/swagger-ui:test
npm run lint
```

If TRAPI removed or renamed an exported type, the `@routup/decorators` typecheck (`build:types`) will fail loudly — adjust the imports in `packages/decorators/src/preset/*.ts` (handler builders, marker enums). The UI half (`packages/swagger-ui/`) does not depend on TRAPI.
