<p align="center">
    <img src="./assets/logo.svg" alt="@routup/swagger-ui logo: a docs window with one operation expanded" width="128" height="128" />
</p>

<h1 align="center">@routup/swagger-ui</h1>

<p align="center">
    <b>Serve Swagger UI for an OpenAPI document (file, object or URL) under any path of a routup app.</b><br>
    You stop copying <code>swagger-ui-dist</code> into a public folder and patching its <code>index.html</code> with your spec and base path.
</p>

<p align="center">
    <a href="https://www.npmjs.com/package/@routup/swagger-ui"><img src="https://img.shields.io/npm/v/@routup/swagger-ui" alt="npm version" /></a>
    <a href="https://github.com/routup/plugins/actions/workflows/main.yml"><img src="https://github.com/routup/plugins/actions/workflows/main.yml/badge.svg" alt="CI" /></a>
    <a href="https://codecov.io/gh/routup/plugins"><img src="https://codecov.io/gh/routup/plugins/branch/master/graph/badge.svg" alt="Coverage" /></a>
    <a href="https://snyk.io/test/github/routup/plugins"><img src="https://snyk.io/test/github/routup/plugins/badge.svg" alt="Known Vulnerabilities" /></a>
</p>

<p align="center">
    <a href="https://plugins.routup.dev/swagger-ui/"><b>Docs</b></a>
    ·
    <a href="https://plugins.routup.dev/swagger-ui/configuration">Configuration</a>
    ·
    <a href="https://plugins.routup.dev/swagger-ui/helpers">Helpers</a>
    ·
    <a href="https://plugins.routup.dev/swagger-ui/recipes">Recipes</a>
</p>

---

## Why @routup/swagger-ui?

[`swagger-ui-dist`](https://www.npmjs.com/package/swagger-ui-dist) ships the Swagger UI bundle as static files, but its `index.html` points at the Petstore demo and assumes it is served from the site root. To show your own document under `/docs`, you serve the bundle, write your own HTML page with the spec and a correct `<base href>`, and keep both in sync when you mount the app elsewhere or behind a proxy.

| Concern | Without it | With @routup/swagger-ui |
|---------|-----------|-------------------------|
| Static bundle | You serve `swagger-ui-dist`'s folder yourself (and hide its `package.json`, README, source maps, …) | Only the files the page references are served from `node_modules` through `@routup/assets`; everything else goes to the next handler |
| HTML page | You copy and edit `index.html` to load your document | The page is generated with your document embedded (file or object) or with its URL |
| Content security policy | The stock page needs an inline script and style | The page has no inline script or style; `csp: true` sends a policy built from your document |
| Mount path | Asset links break when the UI moves from `/` to `/docs` or into a nested router | `<base href>` is derived from the mount path of the request, including parent routers |
| Reverse proxy | You hard-code the public prefix in the HTML | `basePath` or `baseURL` prefixes the `<base href>` |
| UI configuration and OAuth | You edit the inline script | Swagger UI options, `oauth` and `authAction` are passed as plain options |

## Installation

```bash
npm install @routup/swagger-ui
```

ESM only, Node.js `>=24`, peer dependencies `routup@^6.3.0` and `@types/swagger-ui-dist@^3.30.5` (for the option types). `swagger-ui-dist` and `@routup/assets` are installed as dependencies. `swagger-ui-dist` pulls in [`@scarf/scarf`](https://github.com/scarf-sh/scarf-js), whose postinstall script sends install analytics; set `SCARF_ANALYTICS=false` in the install environment to turn it off.

## Quick Start

```typescript
import { fileURLToPath } from 'node:url';
import { App } from 'routup';
import { swaggerUI } from '@routup/swagger-ui';

// a file path, not a file:// URL
const document = fileURLToPath(new URL('./openapi.json', import.meta.url));

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
