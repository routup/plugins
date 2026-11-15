<p align="center">
    <img src="./assets/logo.svg" alt="@routup/assets logo: a fan of static files on the routup tile" width="128" height="128" />
</p>

<h1 align="center">@routup/assets</h1>

<p align="center">
    <b>Serve static files from a directory, with cache headers, SPA fallback and pass-through to the next handler.</b><br>
    You stop writing path resolution, index and extension lookup, dotfile guards and 304 handling for a public folder.
</p>

<p align="center">
    <a href="https://www.npmjs.com/package/@routup/assets"><img src="https://img.shields.io/npm/v/@routup/assets" alt="npm version" /></a>
    <a href="https://github.com/routup/plugins/actions/workflows/main.yml"><img src="https://github.com/routup/plugins/actions/workflows/main.yml/badge.svg" alt="CI" /></a>
    <a href="https://codecov.io/gh/routup/plugins"><img src="https://codecov.io/gh/routup/plugins/branch/master/graph/badge.svg" alt="Coverage" /></a>
    <a href="https://snyk.io/test/github/routup/plugins"><img src="https://snyk.io/test/github/routup/plugins/badge.svg" alt="Known Vulnerabilities" /></a>
</p>

<p align="center">
    <a href="#installation"><b>Installation</b></a>
    ·
    <a href="#usage">Usage</a>
    ·
    <a href="#options">Options</a>
    ·
    <a href="#api">API</a>
    ·
    <a href="https://plugins.routup.dev/assets/">Docs</a>
</p>

---

## Why @routup/assets?

Serving a `public/` or `dist/` folder next to an API looks like one `sendFile` call, until you need `/about` to find `about.html`, `/docs/` to find `index.html`, `.env` to stay hidden, a single-page app to get its shell for unknown routes, and API requests to still reach their handlers.

| Concern | Without it | With @routup/assets |
|---------|-----------|---------------------|
| Path resolution | You join the request path with the directory and check it stays inside | The request path is resolved relative to the mount path, URL-decoded, and looked up in the directory |
| Extensions and index files | You try `about`, `about.html`, `about/index.html` yourself | `extensions` (default `['html', 'htm']`) is tried as a suffix and as a directory index |
| Missing files | You decide between a 404 and calling the next handler | The request falls through to the next handler by default; `fallback` serves an SPA shell, `resolve` produces any response |
| Dotfiles | You filter `.env`, `.git/` by hand | Paths with a segment starting with `.` are not served, except `.well-known` |
| Caching | You set `Cache-Control` and compare `If-None-Match` | `Cache-Control: public,max-age=…` is set, a matching weak ETag returns `304`, range requests return `206` |
| Per-request filesystem work | `stat` on every request | With `scan` (default), the directory is listed once at startup and lookups hit an in-memory map |

```typescript
import { App } from 'routup';
import { assets } from '@routup/assets';

const app = new App();

app.use(assets('dist', { fallback: 'index.html', fallbackIgnores: ['^/api'] }));
```

## Installation

```bash
npm install @routup/assets --save
```

ESM only, Node.js `>=22`, peer dependency `routup@^6.1.0`. The plugin reads from the local filesystem (`node:fs`), so it runs on Node.js-compatible runtimes only.

## Usage

### Serve a directory

```typescript
import { App, serve } from 'routup';
import { assets } from '@routup/assets';

const router = new App();

// serve static files of folder: public
router.use(assets('public'));

serve(router, { port: 3000 });
```

- A request for `GET /logo.png` resolves to `public/logo.png`. A relative directory is resolved against the process working directory.
- When a file is not found, instead of sending a 404 response, the plugin calls `next()` to move on to the next handler, allowing for stacking and fall-backs. Set [`fallthrough: false`](#options) to answer with an empty `404` instead.
- The response is sent with routup's `sendFile`: `Content-Type` from the file name, `Content-Length`, `Last-Modified`, a weak `ETag`, and range support.

### Multiple directories

Sometimes it is necessary to serve static files from multiple directories. To accomplish this, use the plugin multiple times:

```typescript
import { App, serve } from 'routup';
import { assets } from '@routup/assets';

const router = new App();

router.use(assets('public'));
router.use(assets('files'));

serve(router, { port: 3000 });
```

- This serves files from the `public` and the `files` directories. When a request for a file is made, the `public` directory is checked before the `files` directory.
- If a file with the same name exists in both directories, the one in `public` is served.

### Mount path

You can also define a mount path for a directory:

```typescript
import { App, serve } from 'routup';
import { assets } from '@routup/assets';

const router = new App();

router.use('/public', assets('public'));

serve(router, { port: 3000 });
```

- With this setup, requests for files in the `public` directory must start with `/public`: `GET /public/logo.png` serves `public/logo.png`, and `GET /logo.png` is not handled by this plugin.
- The mount path is stripped before the lookup.

### Single-page application fallback

```typescript
import { App, serve } from 'routup';
import { assets } from '@routup/assets';

const router = new App();

router.use(assets('dist', {
    fallback: 'index.html',
    fallbackIgnores: [/^\/api\//, /^\/auth\//],
}));

serve(router, { port: 3000 });
```

- When no file matches, `fallback` serves another file from the same directory: `true` means `/` (so `/index.html` with the default `extensions`), a string names the file.
- The extension of a `fallback` string is stripped and the lookup tries `extensions` again: `'index.html'` becomes `/index`, then `/index.html`. With `extensions: []` the fallback file is not found.
- Passing `fallbackIgnores` (even an empty array) also excludes any path that ends in a file name with an extension (`/app.js`, `/missing.png`), and `/.well-known` (or every dot path, when `dotFiles` is on). A missing asset then falls through instead of returning the HTML shell. Without `fallbackIgnores`, every unmatched path gets the fallback file.

### Custom response for missing files

```typescript
import { App, serve } from 'routup';
import { assets } from '@routup/assets';

const router = new App();

router.use(assets('public', {
    resolve: async (event) => {
        event.response.status = 404;

        return { message: `${event.path} not found` };
    },
}));

serve(router, { port: 3000 });
```

- `resolve` runs when no file (and no `fallback` file) matches. Its return value is converted with routup's `toResponse`; when that yields a response, it is sent.
- When `resolve` yields nothing, the usual `fallthrough` behaviour applies.

## Options

The `assets(directory, options?)` function takes an optional options object:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `scan` | `boolean` | `true` | List the directory once, at plugin creation, and keep file metadata in memory, so the filesystem is not traversed on every request. Set to `false` for directories that change at runtime. |
| `cacheMaxAge` | `number` | `0` | `max-age` directive (in seconds) of the `Cache-Control` header. `0` sends `public,max-age=0,must-revalidate`. |
| `cacheImmutable` | `boolean` | `false` | Append the `immutable` directive to the `Cache-Control` header (replaces `must-revalidate`). Pair it with content-hashed file names. |
| `fallback` | `boolean \| string` | `false` | Serve this file when no file is found. `true` means `/` (the directory's `index.html`). See [Single-page application fallback](#single-page-application-fallback). |
| `fallbackIgnores` | `string \| RegExp \| Array<string \| RegExp>` | none | Paths/patterns that are not forwarded to the fallback file. Strings are compiled to case-insensitive regular expressions. Setting it also adds the built-in "file with extension" and `.well-known` patterns. |
| `fallthrough` | `boolean` | `true` | Pass the request to the next handler if no file was found and neither `fallback` nor `resolve` produced a response. `false` sends an empty `404`. |
| `extensions` | `string[]` | `['html', 'htm']` | Extensions tried when a path does not match a file: `/about` tries `/about.html`, `/about.htm`, `/about/index.html`, `/about/index.htm`. A leading `.` is optional. |
| `dotFiles` | `boolean` | `false` | Serve files or directories beginning with a `.`. When `false`, only `.well-known` is served. |
| `ignores` | `Array<string \| RegExp>` | `[]` | Paths/patterns that are never served, tested against the request path (with leading `/`). Strings are compiled to case-insensitive regular expressions. Must be an array (see [Notes](#notes)). |
| `resolve` | `(event: IAppEvent) => Promise<unknown>` | none | Produce a response for a missing file. See [Custom response for missing files](#custom-response-for-missing-files). |

The [configuration guide](https://plugins.routup.dev/assets/configuration) covers each option with examples.

## API

| Export | Kind | Purpose |
|--------|------|---------|
| `assets(directory, options?)` | function (default export) | Plugin that serves `directory` |
| `createHandler(directory, options?)` | function | The handler the plugin installs, for `router.use()` without the plugin wrapper |
| `createCoreHandler(directory, options?)` | function | The raw core handler function, for wrapping in your own `defineCoreHandler` or using as a building block (as `@routup/swagger-ui` does) |
| `buildOptions(input)` | function | Normalise `OptionsInput` into `Options` (defaults, compiled patterns, absolute directory) |
| `scanFiles(stack, options)` | function | Fill a `Record<string, FileInfo>` with the files of `options.directoryPath` (no-op when `scan` is `false`) |
| `readDirectory(dir, callback)` | function | Walk a directory recursively, calling `callback(relativePath, absolutePath, stats)` per file; skips entries that vanish or dangle |
| `isRegexMatch(input, pattern)` | function | `true` if any pattern matches |
| `Options`, `OptionsInput`, `ResolveFn`, `FileInfo`, `ReadDirectoryCallback` | types | Option and helper types |

```typescript
import { App, defineCoreHandler } from 'routup';
import { createCoreHandler } from '@routup/assets';

const router = new App();
const serveFile = createCoreHandler('downloads', { fallthrough: false });

router.use('/downloads', defineCoreHandler((event) => {
    event.response.headers.set('x-robots-tag', 'noindex');

    return serveFile(event);
}));
```

- Mount the handler with `router.use(path, …)`. On a method route with parameters (`router.get('/download/:name', …)`) the handler strips the matched route path (`event.mountPath`) from the request path, so the file is not found.

## Notes

- **The scan is a snapshot.** With `scan: true` (default), files added after the plugin was created are not served, and removed files stay in the map. If the scan itself fails (for example, the directory does not exist), every request through the plugin answers with `500`.
- **Lookup also tries trailing parts of the path.** For `/a/b/file.txt`, the plugin tries `/a/b/file.txt`, then `/b/file.txt`, then `/file.txt` (each with `extensions` and `index` variants) and serves the first one that exists. A file at the directory root is therefore reachable under any prefix.
- **Anchor `ignores` with care.** Because of the trailing-part lookup, `ignores: [/^\/secret/]` blocks `/secret.txt` but `/x/secret.txt` still serves it. Use an unanchored pattern such as `/\/secret/` or `/secret\.txt$/`.
- **`ignores` must be an array.** A single string or `RegExp` passes the type check but is silently ignored; wrap it in `[]`.
- **`cacheMaxAge: false` does not remove `Cache-Control`.** It is treated like `0` (`public,max-age=0,must-revalidate`); every served file gets a `Cache-Control` header.
- **Directory boundary.** Without a scan, paths that resolve outside the directory (`..`) are skipped. With a scan, only files found inside the directory are in the map.
- **`304` without a body.** When `If-None-Match` equals the file's weak ETag (`W/"<size>-<mtime>"`), the plugin answers `304` before opening the file.

## License

Made with 💚

Published under [MIT License](https://github.com/routup/plugins/blob/master/LICENSE).
