<div align="center">

<img src="./assets/logo.svg" alt="@routup/swagger-ui logo: a docs window with one operation expanded" width="128" height="128" />

<h1>@routup/swagger-ui</h1>

</div>

[![npm version](https://img.shields.io/npm/v/@routup/swagger-ui)](https://www.npmjs.com/package/@routup/swagger-ui)
[![CI](https://github.com/routup/plugins/actions/workflows/main.yml/badge.svg)](https://github.com/routup/plugins/actions/workflows/main.yml)
[![Coverage](https://codecov.io/gh/routup/plugins/branch/master/graph/badge.svg)](https://codecov.io/gh/routup/plugins)
[![Known Vulnerabilities](https://snyk.io/test/github/routup/plugins/badge.svg)](https://snyk.io/test/github/routup/plugins)

**Serve Swagger UI for an OpenAPI document (file, object or URL) under any path of a routup app.**

You stop copying `swagger-ui-dist` into a public folder and patching its `index.html` with your spec and base path.

[Docs](https://plugins.routup.dev/swagger-ui/) · [Configuration](https://plugins.routup.dev/swagger-ui/configuration) · [Helpers](https://plugins.routup.dev/swagger-ui/helpers) · [Recipes](https://plugins.routup.dev/swagger-ui/recipes)

---

## Why @routup/swagger-ui?

[`swagger-ui-dist`](https://www.npmjs.com/package/swagger-ui-dist) ships the Swagger UI bundle as static files, but its `index.html` points at the Petstore demo and assumes it is served from the site root. To show your own document under `/docs`, you serve the bundle, write your own HTML page with the spec and a correct `<base href>`, and keep both in sync when you mount the app elsewhere or behind a proxy.

| Concern | Without it | With @routup/swagger-ui |
|---------|-----------|-------------------------|
| Static bundle | You serve `swagger-ui-dist`'s folder yourself (and hide its `package.json`, README, source maps, …) | Only the files the page references are served from `node_modules` through `@routup/assets`; everything else goes to the next handler |
| HTML page | You copy and edit `index.html` to load your document | The page is generated with your document embedded (file or object) or with its URL |
| Content security policy | The stock page needs an inline script and style | The page has no inline script or style; `csp: true` sends a policy built from your document |
| Mount path | Asset links break when the UI moves from `/` to `/docs` or into a mounted app | `<base href>` is derived from the mount path of the request, including the path of every app it is mounted under |
| Reverse proxy | You hard-code the public prefix in the HTML | `basePath` or `baseURL` prefixes the `<base href>` |
| UI configuration and OAuth | You edit the inline script | Swagger UI options, `oauth` and `authAction` are passed as plain options |

## Installation

```bash
npm install @routup/swagger-ui
```

ESM only, Node.js >=24. Peer dependencies: `routup@^6.3.0` and `@types/swagger-ui-dist@^3.30.5` (for the option types). `swagger-ui-dist` and `@routup/assets` are installed as dependencies. `swagger-ui-dist` pulls in [`@scarf/scarf`](https://github.com/scarf-sh/scarf-js), whose postinstall script sends install analytics; set `SCARF_ANALYTICS=false` in the install environment to turn it off.

## Quick Start

```typescript
import { readFileSync } from 'node:fs';
import { App } from 'routup';
import { swaggerUI } from '@routup/swagger-ui';

// pass the parsed object: an absolute Windows path (C:\...) would count as a URL
const document = JSON.parse(readFileSync(new URL('./openapi.json', import.meta.url), 'utf8'));

export const app = new App();

app.use('/docs', swaggerUI(document));
```

The sample exports the app; [serve it](https://routup.dev/guide/quickstart) from your entry file and open `http://localhost:3000/docs/` in a browser.

## Documentation

The full reference lives on [plugins.routup.dev](https://plugins.routup.dev/swagger-ui/):

- [Overview](https://plugins.routup.dev/swagger-ui/): requirements, the mount path, the served files, the document sources and upgrading to v5
- [Configuration](https://plugins.routup.dev/swagger-ui/configuration): every option, the OAuth options and the content security policy
- [Helpers](https://plugins.routup.dev/swagger-ui/helpers): `swaggerUI()`, `createUIHandler()`, `buildContentSecurityPolicy()`, `isFileURL()` and the types
- [Recipes](https://plugins.routup.dev/swagger-ui/recipes): an object or URL document, a reverse proxy, OAuth login, embedding in a portal

## License

Made with 💚

Published under [MIT License](https://github.com/routup/plugins/blob/master/LICENSE).
