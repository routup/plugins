---
title: Assets
description: Serve static files from a directory, with cache headers, a single-page-app fallback and pass-through to the next handler.
relatedPlugins: []
plugin:
    package: '@routup/assets'
    summary: 'Serve static files.'
    group: 'Request & response'
    order: 4
---

# @routup/assets

Serves the files of a directory, such as a `public/` or `dist/` folder next to an API. It resolves `/about` to `about.html` and `/docs/` to `docs/index.html`, hides dotfiles, sets cache headers and passes a request it has no file for on to the next handler.

## Requirements

- Node.js 24 or later, ESM only
- `routup` `^6.3.0` (peer dependency)
- A runtime with `node:fs`: the plugin reads from the local filesystem

## Installation

```bash
npm install @routup/assets
```

## Quick Start

<<< @/../examples/assets/quick-start.ts

`assets()` is a plugin: register it with `app.use()`, with or without a path, before the routes it may shadow ([Plugins](https://routup.dev/guide/plugins)). The file exports the app; [serve it](https://routup.dev/guide/quickstart) from your entry file.

A relative directory is resolved against the working directory of the process, not against the file that calls `assets()`, so the sample builds an absolute path from `import.meta.url`.

```bash
curl -i http://localhost:3000/about
# HTTP/1.1 200 OK
# cache-control: public,max-age=0,must-revalidate
# content-type: text/html; charset=utf-8
# etag: W/"52-1763380000000"
# ...
```

## Default Behaviour

| Step | What happens |
|------|--------------|
| Path | The request path without the [mount path](/assets/recipes#serve-under-a-path-prefix), URL-decoded |
| Lookup | `/about` and `/about/` both try `/about`, `/about.html`, `/about.htm`, `/about/index.html` and `/about/index.htm`, in that order; `/` tries `/index.html` and `/index.htm` ([`extensions`](/assets/configuration#extensions)) |
| Trailing parts | When nothing matches, the lookup repeats without the first segment: `/a/b/file.txt` tries `/b/file.txt`, then `/file.txt`, so a file at the root is reachable under any prefix |
| Dotfiles | A path with a segment that starts with `.` is not served, except `/.well-known` ([`dotFiles`](/assets/configuration#dotfiles)) |
| Missing file | The request goes on to the next handler; when none answers, routup sends `404` ([`fallthrough`](/assets/configuration#fallthrough)) |
| Methods | Every method is served, not only `GET` and `HEAD`; the `If-Modified-Since` check (GET and HEAD) and ranges (GET) are limited, see [Response Headers](#response-headers) |
| Directory | Only files inside the directory are served; with the scan, only the files it found |

The directory is listed once, when the plugin is registered with `app.use()`, and lookups read that list ([`scan`](/assets/configuration#scan)).

### Response Headers

A file is sent with routup's `sendFile()`:

| Header | Value |
|--------|-------|
| `Content-Type` | From the file name |
| `Content-Length` | The file size, or the size of the range |
| `Cache-Control` | `public,max-age=0,must-revalidate` ([`cacheMaxAge`](/assets/configuration#cachemaxage)) |
| `ETag` | Weak: `W/"<size>-<mtime in ms>"` |
| `Last-Modified` | The file's modification time |
| `Accept-Ranges` | `bytes` |

- A request whose `If-None-Match` equals the ETag gets `304` without a body, before the file is opened, whatever its method. An `If-Modified-Since` that is not older than the file also gets `304` (GET and HEAD).
- A `Range` header with one byte range gets `206` and that part of the file (GET).

For a single file or content built at request time, use routup's `sendFile()` or `sendStream()` directly ([Response Helpers](https://routup.dev/api/response-helpers)).

## Next Steps

- [Configuration](/assets/configuration): cache headers, the single-page-app fallback, extensions, dotfiles and ignored paths
- [Helpers](/assets/helpers): `assets()`, `createHandler()`, `createCoreHandler()` and the types
- [Recipes](/assets/recipes): several folders, a path prefix, cache headers for hashed files, a response for missing files, a single-page app
