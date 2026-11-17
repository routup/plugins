---
title: Swagger UI
description: Mount Swagger UI on a routup router from a JSON document or remote URL.
relatedPlugins: [decorators]
plugin:
    package: '@routup/swagger-ui'
    summary: 'Serve Swagger UI.'
    group: 'API documentation'
    order: 1
---

# @routup/swagger-ui

Serves [Swagger UI](https://swagger.io/tools/swagger-ui/) for an OpenAPI document under any path of a routup app. The plugin generates the page with your document or its URL, sets `<base href>` from the mount path and serves only the files of `swagger-ui-dist` the page needs.

## Requirements

- Node.js 24 or later, ESM only; the plugin reads the document and the Swagger UI files from the file system
- `routup` `^6.3.0` (peer dependency)
- `@types/swagger-ui-dist` `^3.30.5` (peer dependency): the Swagger UI option types that `UIOptions` extends
- `swagger-ui-dist` `^5.35.0` and `@routup/assets` `^6.0.0` are installed as dependencies; the files are served from the installed `swagger-ui-dist`

`swagger-ui-dist` depends on [`@scarf/scarf`](https://github.com/scarf-sh/scarf-js), whose postinstall script sends install analytics. Set `SCARF_ANALYTICS=false` in the install environment, or `"scarfSettings": { "enabled": false }` in your `package.json`, to turn it off.

## Installation

```bash
npm install @routup/swagger-ui
```

## Quick Start

<<< @/../examples/swagger-ui/quick-start.ts

`swaggerUI()` is a plugin: register it with `app.use()`, here under `/docs` ([Plugins](https://routup.dev/guide/plugins)). The file exports the app; [serve it](https://routup.dev/guide/quickstart) from your entry file and open `http://localhost:3000/docs/` in a browser.

## Default Behaviour

| Step | What happens |
|------|--------------|
| Install | At `app.use()`, the plugin reads a file document, checks the options and builds the page; a missing file, invalid JSON or an invalid option throws there |
| Mount path | The page answers at the mount path, with and without trailing slash, and at `index.html` below it. Without a path it answers at `/` |
| Base href | `<base href>` is the mount path of the request with a trailing slash, parent apps included: `/api/docs/` for a plugin under `/docs` in an app mounted at `/api`. [`basePath`](/swagger-ui/configuration#basepath) or [`baseURL`](/swagger-ui/configuration#baseurl) prefix it |
| Requests | Only `GET` and `HEAD` for the [served files](#served-files) are answered. Every other path and method goes to the next handler: `404` when nothing else answers, and routup answers `OPTIONS` itself (`200` with an empty `Allow` header when only the plugin matches) |
| Layout | `BaseLayout`, without the top bar and its field to load another document ([`layout`](/swagger-ui/configuration#layout)) |
| Headers | No security headers; [`csp`](/swagger-ui/configuration#csp) and [`securityHeaders`](/swagger-ui/configuration#securityheaders) add them |

### Served Files

Paths relative to the mount path:

| Path | Content |
|------|---------|
| `/`, `/index.html` | The HTML shell; the stock Petstore page of `swagger-ui-dist` is never served |
| `/swagger-initializer.js` | The bootstrap, generated with the document or its URL and the options |
| `/index.css` | The page styles; the shell has no inline script or style |
| `/swagger-ui.css`, `/swagger-ui-bundle.js`, `/swagger-ui-standalone-preset.js`, `/favicon-16x16.png`, `/favicon-32x32.png` | From `swagger-ui-dist` |
| `/oauth2-redirect.html`, `/oauth2-redirect.js` | From `swagger-ui-dist`, only when an OAuth flow is configured: [`oauth`](/swagger-ui/configuration#oauth) or [`oauth2RedirectUrl`](/swagger-ui/configuration#oauth2redirecturl) is set, or an object or file document declares an `oauth2` or `openIdConnect` security scheme |

Everything else in `swagger-ui-dist` (`package.json`, the README, source maps, the ES bundles) is passed on like any other path.

### Document Sources

The first argument of `swaggerUI()` is the document:

| Argument | Treated as | Notes |
|----------|------------|-------|
| An object | The document | Embedded in `swagger-initializer.js` as `spec` |
| A string that parses as an absolute URL with a protocol other than `file:` | A URL | Passed to Swagger UI as `url`; the browser fetches it, so it must be reachable from the browser and allow CORS on another origin |
| Any other string | A file path | Read with `JSON.parse` at `app.use()`, a relative path against the working directory of the process (not the file that calls `swaggerUI()`), and embedded as `spec` |

- **JSON only.** YAML files are not supported; convert them or pass the parsed object.
- **Some paths count as URLs.** The check uses `new URL()`, so a Windows drive-letter path (`C:\docs\openapi.json`, protocol `c:`) or a `host:port/...` string is passed to the browser as `url`, and the UI cannot load it. A `file:///...` string counts as a file, but is read as a plain path and fails. For a path that works on every platform, read and parse the file yourself and pass the object, as the quick start does, or pass a relative path.
- **The file is read once per install.** Changes to the file are picked up only when the app installs the plugin again, usually after a restart.

[Recipes](/swagger-ui/recipes) show an object document and a URL. To produce the document from `@routup/decorators` controllers, see [OpenAPI generation](/decorators/#openapi-generation): generate it at build time, write it to a file and pass the file to `swaggerUI()`.

## Upgrading to v5

- **The top bar is left out, not hidden by CSS.** The default layout is `BaseLayout`. Earlier versions used `StandaloneLayout` and hid the top bar with CSS for every layout; with `layout: 'StandaloneLayout'` it is now visible, including its field to load any document by URL.
- **The `?url=` query parameter is ignored.** A link such as `/docs/?url=https://evil.example/openapi.json` shows the document passed to `swaggerUI()`.
- **Only `GET` and `HEAD` for the [served files](#served-files) are answered**; every other path and method goes to the next handler, and the OAuth redirect page is served only when an OAuth flow is configured.
- **`baseURL` is validated, and bound or native function options throw**, both when the plugin is installed.

## Next Steps

- [Configuration](/swagger-ui/configuration): every option, the OAuth options and the content security policy
- [Helpers](/swagger-ui/helpers): `swaggerUI()`, `createUIHandler()`, `buildContentSecurityPolicy()`, `isFileURL()` and the types
- [Recipes](/swagger-ui/recipes): an object or URL document, a reverse proxy, OAuth login, embedding in a portal
- [`@routup/decorators`](/decorators/#openapi-generation): generate the document from decorated controllers
