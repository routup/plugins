---
title: Assets Helpers
description: The plugin factory, the handlers behind it and the types of @routup/assets.
relatedPlugins: []
---

# Helpers and API

Everything `@routup/assets` exports. The options are on [Configuration](/assets/configuration).

## `assets()`

Creates the plugin, which registers `createHandler(directory, options)` at the position of its `app.use()` call. It is also the default export.

```typescript
declare function assets(
    directory: string,
    options?: OptionsInput,
): Plugin;
```

The scan of the directory starts when `assets()` is called.

## `createHandler()`

Returns the handler the plugin registers, for `app.use()` without the plugin wrapper.

```typescript
declare function createHandler(
    directory: string,
    options?: OptionsInput,
): Handler;
```

## `createCoreHandler()`

Returns the plain handler function, to call from a handler of your own, here to add a header to every served file. [`@routup/swagger-ui`](/swagger-ui/) serves its UI files this way.

```typescript
declare function createCoreHandler(
    directory: string,
    options?: OptionsInput,
): CoreHandler;
```

<<< @/../examples/assets/wrap-handler.ts

Mount it with `app.use(path, ...)`. The handler removes `event.mountPath` from the request path, and on a method route such as `app.get('/download/:name', ...)` that is the whole path, so every request gets the `index` file of the directory, or no file when there is none.

## Types

| Type | Definition |
|------|------------|
| `OptionsInput` | The options of `assets()`, every key optional ([Configuration](/assets/configuration)) |
| `Options` | The normalised options: every key set, patterns compiled to `RegExp[]`, `directoryPath` absolute, plus `fallbackPath` |
| `ResolveFn` | `(event: IAppEvent) => Promise<unknown>`, the type of [`resolve`](/assets/configuration#resolve) |
| `FileInfo` | `{ stats: Stats, filePath: string }`, one entry of the scanned list |
| `ReadDirectoryCallback` | `(relativePath: string, absolutePath: string, stats: Stats) => void` |

## Other Exports

Internal building blocks of the handler, exported by the package entry.

| Export | Description |
|--------|-------------|
| `buildOptions` | `(input: OptionsInput) => Options`: applies the defaults, compiles the patterns, resolves the directory against the working directory |
| `scanFiles` | `(stack: Record<string, FileInfo>, options: Options) => Promise<void>`: fills `stack` with the files of `options.directoryPath`, keyed by path; does nothing when `scan` is `false` |
| `readDirectory` | `(dir: string, callback: ReadDirectoryCallback) => Promise<void>`: walks a directory recursively and calls `callback` per file; skips entries that vanish or dangle during the walk |
| `isRegexMatch` | `(input: string, pattern: RegExp \| RegExp[]) => boolean`: `true` when any pattern matches |
