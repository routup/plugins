---
title: Swagger preset
description: The @trapi/metadata preset that teaches the swagger generator about routup's decorators.
relatedPlugins: [swagger, decorators]
---

# @routup/swagger-preset

A [`@trapi/metadata`](https://github.com/trapi/trapi) preset that maps routup's [`@routup/decorators`](/decorators/) (`@DController`, `@DGet`, `@DBody`, …) to OpenAPI primitives. Without this preset, the [`@routup/swagger`](/swagger/) generator wouldn't know what `@DPath('id')` *means* — the preset is the bridge.

## Installation

```bash
npm install @routup/swagger-preset @routup/swagger
```

`@routup/swagger-preset` peer-depends on `@trapi/metadata`. If you're calling `@trapi/metadata` directly (rare), install it explicitly; the [`@routup/swagger`](/swagger/) entry point pulls it in transitively.

## Usage

You almost never import the preset directly. The [generator](/swagger/generator) takes its name as a string:

```typescript
await generate({
    version: Version.V3,
    options: {
        metadata: {
            preset: '@routup/swagger-preset',
            entryPoint: { cwd: process.cwd(), pattern: '**/*.ts' },
        },
        // ...
    },
});
```

The generator resolves `'@routup/swagger-preset'` to the package and runs its `controllers`, `methods`, and `parameters` handlers against your TypeScript AST.

## What the preset registers

| Decorator | OpenAPI mapping |
|---|---|
| `@DController(path)` | Sets the controller's base path |
| `@DGet` / `@DPost` / `@DPut` / `@DPatch` / `@DDelete` | Method + sub-path |
| `@DPath(name)` | `path` parameter |
| `@DQuery(name?)` | `query` parameter |
| `@DBody(prop?)` | `requestBody` (with optional property pick) |
| `@DCookie(name)` | `cookie` parameter |
| `@DHeader(name)` | `header` parameter |
| `@DCookies()` / `@DHeaders()` / `@DPaths()` | bag-style parameters |
| `@DContext()` / `@DRequest()` / `@DResponse()` / `@DNext()` | ignored — they're injection helpers, not API surface |

## Customizing the preset

For most projects, the default preset is enough. If you need extra metadata (custom decorators, JSDoc-driven examples, security schemes), see [`@trapi/metadata` documentation](https://github.com/trapi/trapi) for how to write your own preset on top of `buildPreset()`.

## See also

- [`@routup/swagger`](/swagger/) — the generator + UI plugin
- [Generator](/swagger/generator) — how the preset is invoked
- [`@routup/decorators`](/decorators/) — the decorators this preset interprets
