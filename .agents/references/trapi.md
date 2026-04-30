# TRAPI Reference

[TRAPI](https://github.com/tada5hi/trapi) is the metadata + OpenAPI generation library that `@routup/swagger` and `@routup/swagger-preset` depend on. It analyses TypeScript decorators with the compiler API and produces OpenAPI specs.

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
| `@trapi/metadata` `Preset` type | Schema for handler-driven decorator presets | Returned by `@routup/swagger-preset` `buildPreset()` |
| `@trapi/metadata` `controller(...)`, `method(...)`, `parameter(...)` | Identity builders for v2 handlers | Used in `swagger-preset/src/{class,method,parameter,swagger}.ts` |
| `@trapi/metadata` `MarkerName` (`Hidden`, `Deprecated`, `Extension`) | Concept tags so the resolver can find renamed decorators | Set on `@DHidden`/`@DDeprecated` handlers |
| `@trapi/metadata` `ParamKind` (`Body`, `BodyProp`, `Query`, `QueryProp`, `Path`, `Cookie`, `Header`, `FormData`, `Context`) | Parameter source enumeration | Mapped from `@D*` parameter decorators |
| `@trapi/metadata` `generateMetadata()` | Public entry: scans source, returns `Metadata` | Called by `@trapi/swagger`'s `generateSwagger()` (transitively) |
| `@trapi/swagger` `generateSwagger({ version, metadata, data })` | Produces OpenAPI spec | Wrapped by `@routup/swagger` `generate()` |
| `@trapi/swagger` `saveSwagger(spec, options)` | Writes spec JSON/YAML to disk | Available for users who need a file (no longer baked into `generate()`) |
| `@trapi/swagger` `Version` enum | `V2 / V3 / V3_1 / V3_2` | Forwarded as `context.version` |

## Source layout (TRAPI repo)

```
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

- **PR tada5hi/trapi#798** (2026-04): TRAPI v2 — preset-based decorator system, marker-driven resolver, dropped `DecoratorID`/`DecoratorConfig` types. routup/plugins migrated in lockstep (see `packages/swagger-preset/src/*` rewrite + `packages/swagger/src/generator/module.ts`).

## Quick-check after a TRAPI bump

```bash
# from /opt/projects/routup/plugins
npx nx run @routup/swagger-preset:build
npx nx run @routup/swagger:build
npx nx run @routup/swagger:test       # 22 tests
npx nx run @routup/decorators:test    # 7 tests
npm run lint
```

If TRAPI removed or renamed an exported type, the swagger or swagger-preset typecheck (`build:types`) will fail loudly — adjust the imports in `swagger-preset/src/*.ts` (handler builders, marker enums) or `swagger/src/generator/{type,module}.ts` (option-shape forwarding).
