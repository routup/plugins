---
title: Logger Helpers
description: The logger factory, the format compiler, the presets, the built-in tokens and the types.
relatedPlugins: []
---

# Helpers and API

Everything `@routup/logger` exports. Options are on [Configuration](/logger/configuration).

## `logger()`

Creates the logging handler. It is also the default export.

```typescript
declare function logger(options?: Options): Handler;
declare function logger(format: FormatInput, options?: Options): Handler;
```

## `createHandler()`

Creates the same handler from an options object only; `logger()` calls it.

```typescript
declare function createHandler(options?: Options): Handler;
```

## `compile()`

Compiles a format string into a `Formatter`. Each `:name` or `:name[arg]` becomes the return value of the matching token, or `-` when the token is missing or returns `undefined`. It throws a `TypeError` when `format` is not a string.

```typescript
declare function compile(format: string): Formatter;
```

A compiled formatter gets the token map as its first argument. `logger()` merges `defaultTokens` with your `tokens`; outside `logger()`, pass them yourself:

<<< @/../examples/logger/compile.ts

Without the start time in `event.store[StartTimeSymbol]`, `:response-time` renders `-`.

## `resolveFormat()`

Turns a `format` option into a `Formatter`: a function is returned as is, `'dev'` returns `devFormatter`, `'tiny'`, `'short'`, `'common'` and `'combined'` return the compiled preset, any other string is compiled, and anything else falls back to `'tiny'`.

```typescript
declare function resolveFormat(format: unknown): Formatter;
```

## `formatStrings`

Maps the preset names `tiny`, `short`, `common` and `combined` to their format strings ([`format`](/logger/configuration#format)). `dev` is not in the map; it is the `devFormatter` function. Use it to extend a preset: `` logger(`${formatStrings.tiny} :req[x-trace]`) ``.

```typescript
declare const formatStrings: {
    readonly combined: string;
    readonly common: string;
    readonly short: string;
    readonly tiny: string;
};
```

## `devFormatter`

The `Formatter` behind `format: 'dev'`, with the status coloured by range. [Extend the Dev Format](/logger/recipes#extend-the-dev-format) wraps it.

```typescript
declare const devFormatter: Formatter;
```

## `defaultTokens`

The built-in tokens ([`tokens`](/logger/configuration#tokens)), keyed by name without the colon.

```typescript
declare const defaultTokens: TokenMap;
```

## `StartTimeSymbol`

The `event.store` key under which the logger stores `performance.now()` when the request reaches it. `:response-time` reads it and renders `-` without it, so set it yourself when you run a formatter outside `logger()`.

```typescript
declare const StartTimeSymbol: unique symbol;
```

## Types

| Type | Definition |
|------|------------|
| `Options` | The options object ([Configuration](/logger/configuration)) |
| `FormatInput` | `string \| Formatter`, the type of `format` |
| `Formatter` | `(tokens: TokenMap, event: IAppEvent, response: Response \| undefined) => string \| undefined` |
| `Token` | `(event: IAppEvent, response: Response \| undefined, arg?: string) => string \| undefined` |
| `TokenMap` | `Record<string, Token>` |
| `PresetFormatName` | `'tiny' \| 'short' \| 'common' \| 'combined'`, the keys of `formatStrings` |
| `SkipFn` | `(event: IAppEvent, response: Response \| undefined) => boolean`, the type of `skip` |
| `WriteFn` | `(line: string) => void`, the type of `write` |
