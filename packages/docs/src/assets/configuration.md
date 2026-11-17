---
title: Assets Configuration
description: Options of the assets plugin, from cache headers to the single-page-app fallback.
relatedPlugins: []
---

# Configuration

`assets(directory, options?)` takes the directory and one object, the `OptionsInput` type; every option is optional.

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `scan` | `boolean` | `true` | List the directory once and look files up in memory |
| `cacheMaxAge` | `number \| false` | `0` | `max-age` of the `Cache-Control` header, in seconds |
| `cacheImmutable` | `boolean` | `false` | Add `immutable` to the `Cache-Control` header |
| `fallback` | `boolean \| string` | `false` | File to serve when no file matches; `true` means the `index` file |
| `fallbackIgnores` | `string \| RegExp \| Array<string \| RegExp>` | none | Paths that never get the fallback file |
| `fallthrough` | `boolean` | `true` | Pass a request without a file on to the next handler; `false` answers `404` |
| `extensions` | `string[]` | `['html', 'htm']` | Extensions tried after the path and for `index` files |
| `dotFiles` | `boolean` | `false` | Serve paths with a segment that starts with `.` |
| `ignores` | `Array<string \| RegExp>` | `[]` | Paths that are never served |
| `resolve` | `(event) => Promise<unknown>` | none | Builds the response for a request without a file |

`OptionsInput` also has `directoryPath`; the `directory` argument always replaces it.

### `scan`

With `scan`, `assets()` lists the directory when it is called and keeps each file's path and stats in memory, so a request does not touch the filesystem until the file is sent. The list is a snapshot: a file added later is not served, and a file removed later is still answered with `200`, whose body then fails while it is read. When the scan fails, for example because the directory does not exist, every request that reaches the plugin answers `500`.

Set `scan: false` for a directory that changes while the app runs; each request then checks the candidate paths on disk.

### `cacheMaxAge`

The `max-age` value in seconds. Every served file gets a `Cache-Control` header:

| Options | `Cache-Control` |
|---------|-----------------|
| none, `0` or `false` | `public,max-age=0,must-revalidate` |
| `cacheMaxAge: 3600` | `public,max-age=3600` |
| `cacheImmutable: true` | `public,max-age=0,immutable` |
| `cacheMaxAge: 31536000, cacheImmutable: true` | `public,max-age=31536000,immutable` |

`false` does not remove the header; it is treated like `0`. [Cache Hashed Files](/assets/recipes#cache-hashed-files) sets two policies for two folders.

### `cacheImmutable`

Appends `immutable` in place of `must-revalidate`. Use it for content-hashed file names, whose content never changes under the same name.

### `fallback`

The file served when no file matches, for a single-page app whose client-side router handles the path. `true` serves the `index` file of the directory (`index.html` with the default `extensions`), a string names a file, such as `'index.html'`.

The extension of the string is removed and `extensions` is tried again: `'index.html'` is looked up as `/index`, then `/index.html`. With `extensions: []`, the fallback file is not found. Without [`fallbackIgnores`](#fallbackignores), every path without a file gets the fallback, also `/api/...` and `/missing.js`.

The [Static Files](https://routup.dev/examples/static-files) example on routup.dev serves a single-page app next to API routes.

### `fallbackIgnores`

Paths that do not get the fallback file; such a request goes on as if there were no fallback. Each entry becomes a case-insensitive regular expression: a string is compiled with the flag `i`, and the flags of a `RegExp` are replaced by `i`. The patterns are tested against the request path without the mount path, for example `'^/api(/|$)'`.

Setting `fallbackIgnores`, even to `[]`, also adds two patterns:

- a path that ends in a file name with an extension, such as `/app.js` or `/images/missing.png`, so a missing asset is not answered with the HTML shell
- `/.well-known`, or every path with a segment that starts with `.` when [`dotFiles`](#dotfiles) is `true`

### `fallthrough`

With `true`, a request without a file, and without a response from `fallback` or `resolve`, goes on to the next handler. With `false`, the plugin answers `404` with an empty body and the handlers after it do not run for that request.

### `extensions`

Tried after the plain path and for the `index` file of a directory: with the default, `/about` tries `/about`, `/about.html`, `/about.htm`, `/about/index.html` and `/about/index.htm`. A leading `.` is optional (`'.html'` or `'html'`).

### `dotFiles`

With `false`, a path with a segment that starts with `.`, such as `/.env` or `/.git/config`, is not served; `/.well-known/...` still is. With `true`, every such path is served.

### `ignores`

Paths that are never served. Each entry becomes a case-insensitive regular expression, as for [`fallbackIgnores`](#fallbackignores), and is tested against the request path. A single string or `RegExp` passes the type check but is ignored; pass an array.

The lookup also tries trailing parts of the path ([Default Behaviour](/assets/#default-behaviour)), so an anchored pattern does not cover every path to a file: `[/^\/secret/]` blocks `/secret.txt`, but `/x/secret.txt` still serves it. Use a pattern without the anchor, such as `/\/secret/` or `/secret\.txt$/`.

### `resolve`

Called with the event when no file matches and the fallback did not apply. Its return value is turned into a response like a handler's: an object becomes JSON, a string text. `undefined` gives no response, and [`fallthrough`](#fallthrough) decides what happens. [Answer Missing Files](/assets/recipes#answer-missing-files) returns a JSON `404`.
