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
    <a href="https://plugins.routup.dev/assets/"><b>Docs</b></a>
    ·
    <a href="https://plugins.routup.dev/assets/configuration">Configuration</a>
    ·
    <a href="https://plugins.routup.dev/assets/helpers">Helpers</a>
    ·
    <a href="https://plugins.routup.dev/assets/recipes">Recipes</a>
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
| Per-request filesystem work | `stat` on every request | With `scan` (default), the directory is listed once, when the plugin is registered, and lookups hit an in-memory map |

## Installation

```bash
npm install @routup/assets
```

ESM only, Node.js `>=24`, peer dependency `routup@^6.3.0`. The plugin reads from the local filesystem (`node:fs`), so it runs on Node.js-compatible runtimes only.

## Quick Start

```typescript
import { fileURLToPath } from 'node:url';
import { App } from 'routup';
import { assets } from '@routup/assets';

export const app = new App();

// an absolute path: a relative one is resolved against the working directory
app.use(assets(fileURLToPath(new URL('public', import.meta.url))));
```

The sample exports the app; [serve it](https://routup.dev/guide/quickstart) from your entry file.

## Documentation

The full reference lives on [plugins.routup.dev](https://plugins.routup.dev/assets/):

- [Overview](https://plugins.routup.dev/assets/): requirements, how a path is looked up, the response headers
- [Configuration](https://plugins.routup.dev/assets/configuration): cache headers, the single-page-app fallback, extensions, dotfiles and ignored paths
- [Helpers](https://plugins.routup.dev/assets/helpers): `assets()`, `createHandler()`, `createCoreHandler()` and the types
- [Recipes](https://plugins.routup.dev/assets/recipes): several folders, a path prefix, cache headers for hashed files, a response for missing files, a single-page app

## License

Made with 💚

Published under [MIT License](https://github.com/routup/plugins/blob/master/LICENSE).
