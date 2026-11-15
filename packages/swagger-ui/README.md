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
    <a href="#installation"><b>Installation</b></a>
    ·
    <a href="#usage">Usage</a>
    ·
    <a href="#options">Options</a>
    ·
    <a href="#api">API</a>
    ·
    <a href="https://plugins.routup.dev/swagger-ui/">Docs</a>
</p>

---

## Why @routup/swagger-ui?

[`swagger-ui-dist`](https://www.npmjs.com/package/swagger-ui-dist) ships the Swagger UI bundle as static files, but its `index.html` points at the Petstore demo and assumes it is served from the site root. To show your own document under `/docs`, you serve the bundle, write your own HTML page with the spec and a correct `<base href>`, and keep both in sync when you mount the app elsewhere or behind a proxy.

| Concern | Without it | With @routup/swagger-ui |
|---------|-----------|-------------------------|
| Static bundle | You serve `swagger-ui-dist`'s folder yourself (and hide its `package.json`) | The bundle is served from `node_modules` through `@routup/assets`; `package.json` answers `404` |
| HTML page | You copy and edit `index.html` to load your document | The page is generated with your document inlined (file or object) or with its URL |
| Mount path | Asset links break when the UI moves from `/` to `/docs` or into a nested router | `<base href>` is derived from the mount path of the request, including parent routers |
| Reverse proxy | You hard-code the public prefix in the HTML | `basePath` or `baseURL` prefixes the `<base href>` |
| UI configuration and OAuth | You edit the inline script | Swagger UI options, `oauth` and `authAction` are passed as plain options |

```typescript
import { App } from 'routup';
import { swaggerUI } from '@routup/swagger-ui';

const app = new App();

app.use('/docs', swaggerUI('./openapi.json'));
```

## Installation

```bash
npm install @routup/swagger-ui --save
```

ESM only, Node.js `>=22`, peer dependencies `routup@^6.1.0` and `@types/swagger-ui-dist@^3.30.5` (for the option types). `swagger-ui-dist` and `@routup/assets` are installed as dependencies.

## Usage

### Mount the UI

```typescript
import { App, serve } from 'routup';
import { swaggerUI } from '@routup/swagger-ui';

const router = new App();

router.use('/docs', swaggerUI('./openapi.json'));

serve(router, { port: 3000 });
```

Open `http://localhost:3000/docs/` in a browser.

- The UI is mounted under whatever path you pass to `router.use()`. `/docs` and `/docs/` both return the page with `<base href="/docs/">`, so the bundle's relative asset links resolve either way.
- Requests for files of `swagger-ui-dist` (`/docs/swagger-ui-bundle.js`, `/docs/swagger-ui.css`, …) are served from the package; every other path under the mount returns the HTML page.

### Document sources

You can pass a file path, a parsed spec object or a remote URL:

```typescript
import { App } from 'routup';
import { swaggerUI } from '@routup/swagger-ui';

const router = new App();

// a JSON file, read once when the plugin is created
router.use('/docs', swaggerUI('./writable/swagger.json'));

// a plain object, for example with runtime values merged in
router.use('/internal/docs', swaggerUI({
    openapi: '3.1.0',
    info: { title: 'My API', version: '1.0.0' },
    paths: {},
}));

// a URL the browser fetches at runtime
router.use('/petstore', swaggerUI('https://petstore3.swagger.io/api/v3/openapi.json'));
```

- **File path**: any string that is not an absolute URL with a non-`file:` protocol. It is read synchronously with `JSON.parse` when `swaggerUI()` is called, relative to the process working directory. The document is inlined into the page (`spec`).
- **Object**: inlined into the page as `spec`.
- **URL** (`http:`, `https:`, …): passed to Swagger UI as `url`; the browser fetches it, so it must be reachable from the browser (and allow CORS if it is on another origin).

### Behind a reverse proxy

```typescript
import { App } from 'routup';
import { swaggerUI } from '@routup/swagger-ui';

const router = new App();

// the proxy forwards https://example.com/api/* to this app
router.use('/docs', swaggerUI('./openapi.json', { basePath: '/api/' }));
// <base href="/api/docs/">

router.use('/v2/docs', swaggerUI('./openapi.json', { baseURL: 'https://example.com/api/' }));
// <base href="https://example.com/api/v2/docs/">
```

- `basePath` is prefixed to the mount path; `baseURL` is used as the origin and prefix. When both are set, `baseURL` wins.

### Swagger UI options and OAuth

```typescript
import { App } from 'routup';
import { swaggerUI } from '@routup/swagger-ui';

const router = new App();

router.use('/docs', swaggerUI('./openapi.json', {
    docExpansion: 'none',
    persistAuthorization: true,
    oauth: {
        clientId: 'swagger-ui',
        scopes: ['openid', 'profile'],
        usePkceWithAuthorizationCodeGrant: true,
    },
}));
```

- Every Swagger UI configuration field (`SwaggerConfigs`) is serialised into the page and passed to `SwaggerUIBundle`, overriding the built-in defaults.
- `oauth` is passed to `ui.initOAuth()`, `authAction` to `ui.authActions.authorize()`, after the UI is created.

### Producing the document

To *produce* the document from decorated controllers, see [`@routup/decorators` → OpenAPI generation](https://plugins.routup.dev/decorators/#openapi-generation): it calls [`@trapi/swagger`](https://github.com/trapi/trapi)'s `generateSwagger()` with the `@routup/decorators/preset`, or uses the `trapi` CLI. Run that at build time, write the spec to `./openapi.json`, and point `swaggerUI()` at the result so production does not recompute it on every boot.

## Options

`swaggerUI(document, options?)` takes the [Swagger UI configuration](https://swagger.io/docs/open-source-tools/swagger-ui/usage/configuration/) (`SwaggerConfigs` from `@types/swagger-ui-dist`) plus these fields:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `basePath` | `string` | none | Path prefix the app is reachable under (behind a proxy). Prepended to the mount path in `<base href>`. |
| `baseURL` | `string` | none | Absolute URL the app is reachable under. The mount path is resolved against it for `<base href>`. Takes precedence over `basePath`. |
| `oauth` | `UIOAuthOptions` | none | Passed to `ui.initOAuth()`: `clientId`, `clientSecret`, `realm`, `appName`, `scopeOperator`, `scopes` (required), `additionalQueryStringParams`, `useBasicAuthenticationWithAccessCodeGrant`, `usePkceWithAuthorizationCodeGrant`. |
| `authAction` | `Record<string, any>` | none | Passed to `ui.authActions.authorize()` to pre-authorise security schemes. |
| `spec` / `url` | | set from `document` | Overwritten from the `document` argument; set the document there instead. |

Built-in Swagger UI defaults, each overridable through the options: `dom_id: '#swagger-ui'`, `deepLinking: true`, `presets: [apis, StandalonePreset]`, `plugins: [DownloadUrl]`, `layout: 'StandaloneLayout'`. The top bar is hidden with CSS.

## API

| Export | Kind | Purpose |
|--------|------|---------|
| `swaggerUI(document, options?)` | function (default export) | Plugin that serves the UI on the path it is mounted at |
| `createUIHandler(document, options?)` | function | The handler the plugin installs, for `router.use()` without the plugin wrapper |
| `isFileURL(input)` | function | `true` when `input` is treated as a file path (no protocol, or `file:`) |
| `UIOptions`, `UIOAuthOptions` | types | Option types |

```typescript
import { App } from 'routup';
import { createUIHandler } from '@routup/swagger-ui';

const router = new App();

router.use('/docs', createUIHandler('./openapi.json'));
```

## Notes

- **Only JSON files.** A file `document` is parsed with `JSON.parse`; YAML is not supported. Convert it first or pass the parsed object.
- **Pass a path, not a `file://` string.** `isFileURL('file:///…')` returns `true`, but the string is then read as a plain path and fails. Use `fileURLToPath()` first.
- **The file is read once.** Changes to the document after `swaggerUI()` was called are not picked up until restart.
- **The page is built on the first request.** The `<base href>` comes from the mount path of the first request and is cached; mount one plugin instance per path.
- **Everything under the mount is answered.** Unknown paths below the mount return the HTML page and never reach later handlers, so do not mount the UI at `/` next to other routes.
- **Functions in options lose their scope.** Options are written into an inline script; functions (for example `requestInterceptor`) are inserted by their source text, so they cannot use variables from your server code.
- **The options object is modified.** `spec` or `url` is written onto the object you pass; do not share one object between two `swaggerUI()` calls with different documents.

## License

Made with 💚

Published under [MIT License](https://github.com/routup/plugins/blob/master/LICENSE).
