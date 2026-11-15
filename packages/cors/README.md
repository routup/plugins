<p align="center">
    <img src="./assets/logo.svg" alt="@routup/cors logo: two browser origins and a preflight handshake" width="128" height="128" />
</p>

<h1 align="center">@routup/cors</h1>

<p align="center">
    <b>Answer CORS preflight requests and add Access-Control-* headers to routup responses.</b><br>
    You stop hand-writing <code>OPTIONS</code> handlers, origin allow-lists and <code>Vary</code> headers, and the credentialed wildcard cases are handled for you.
</p>

<p align="center">
    <a href="https://www.npmjs.com/package/@routup/cors"><img src="https://img.shields.io/npm/v/@routup/cors" alt="npm version" /></a>
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
    <a href="https://plugins.routup.dev/cors/">Docs</a>
</p>

---

## Why @routup/cors?

A browser on another origin sends an `OPTIONS` preflight before most API calls and drops any response that lacks the right `Access-Control-*` headers. Getting this right by hand means a catch-all `OPTIONS` route, origin matching, `Vary` headers for caches, and knowing which wildcards a browser ignores once cookies are involved.

| Concern | Without it | With @routup/cors |
|---------|-----------|-------------------|
| Preflight | You register an `OPTIONS` handler per route (or a catch-all) and set the status and headers yourself | Every `OPTIONS` request with `Origin` and `Access-Control-Request-Method` gets a `204` with `Content-Length: 0` |
| Origin allow-list | You compare the `Origin` header against a list and echo it back | `origin` takes a string, `RegExp`, array or function; on a match the request origin is reflected |
| Cache correctness | You remember to append `Vary: origin` and `Vary: access-control-request-headers` | `Vary` is appended (not overwritten) whenever the response depends on the request |
| Credentials | A literal `*` in `Access-Control-Allow-Methods` is ignored by the browser under credentials | `methods: '*'` expands to `GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS`, `allowHeaders: '*'` mirrors the request, and unsafe `'*'` combinations log a warning |
| Per-route use | Copy the header logic into each handler | `handleCors(event, options)` does the same work inside one handler |

```typescript
import { App } from 'routup';
import { cors } from '@routup/cors';

const app = new App();

app.use(cors({ origin: true, credentials: true, exposeHeaders: ['x-request-id'] }));
```

## Installation

```bash
npm install @routup/cors --save
```

ESM only, Node.js `>=22`, peer dependency `routup@^6.1.0`.

## Usage

### Plugin

```typescript
import { App, defineCoreHandler, serve } from 'routup';
import { cors } from '@routup/cors';

const router = new App();

router.use(cors({
    origin: ['https://app.example.com'],
    credentials: true,
    allowHeaders: ['content-type', 'authorization'],
    exposeHeaders: ['x-request-id'],
}));

router.get('/', defineCoreHandler(() => 'ok'));

serve(router, { port: 3000 });
```

- Mount the plugin once, before your routes. It adds CORS headers to ordinary responses and short-circuits preflight `OPTIONS` requests with a `204`.
- A request counts as preflight only when it is `OPTIONS` **and** carries both `Origin` and `Access-Control-Request-Method`. Any other `OPTIONS` request reaches your own handlers.
- Called without options, the plugin allows every origin (`Access-Control-Allow-Origin: *`).

### Allow-list multiple environments

```typescript
import { App } from 'routup';
import { cors } from '@routup/cors';

const router = new App();

router.use(cors({
    origin: [
        'https://app.example.com',
        /\.staging\.example\.com$/,
    ],
    credentials: true,
    exposeHeaders: ['x-request-id'],
}));
```

- Array entries are compared in order: strings by equality, `RegExp` entries with `test()`. The first match reflects the request origin and appends `Vary: origin`.
- `RegExp` objects with the `g` or `y` flag are copied without those flags before each test, so a stateful `lastIndex` never makes the result alternate between requests.
- When no entry matches, no `Access-Control-Allow-Origin` header is set and the browser blocks the response.

### Credentials

```typescript
import { App } from 'routup';
import { cors } from '@routup/cors';

const router = new App();

router.use(cors({
    origin: true,
    credentials: true,
    exposeHeaders: ['x-request-id'],
}));
```

With `credentials: true` the browser treats a literal `'*'` as a plain value, not a wildcard. The plugin normalises what it can:

- `methods: '*'` is expanded to `GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS`.
- `allowHeaders: '*'` mirrors the preflight's `Access-Control-Request-Headers`, so `*` never reaches the wire.
- `exposeHeaders: '*'` cannot be resolved (the browser does not say which response headers it wants). The response is not blocked, but only the CORS-safelisted response headers stay readable from JavaScript. List your custom headers. The plugin logs a warning once, when it is created.
- `origin: '*'` is not rewritten, because `origin: true` would let any origin call you with the user's cookies. The browser blocks the request; the plugin logs a warning. Use `origin: true` or an explicit allow-list.

### Your own preflight handler

```typescript
import { App, defineCoreHandler } from 'routup';
import { cors } from '@routup/cors';

const router = new App();

router.use(cors({ preflight: { continue: true } }));

router.options('/upload', defineCoreHandler((event) => {
    event.response.status = 204;

    return null;
}));
```

- With `preflight.continue`, the plugin sets the preflight headers and calls `event.next()` instead of answering. Your `OPTIONS` handler decides the response.

### Decorate a single route

When you don't want to install the plugin globally, call `handleCors` inside a handler:

```typescript
import { App, defineCoreHandler } from 'routup';
import { handleCors } from '@routup/cors';

const router = new App();

router.use('/api/public', defineCoreHandler((event) => {
    const corsResponse = handleCors(event, { origin: '*' });
    if (corsResponse) {
        return corsResponse;
    }

    // your handler logic
    return 'ok';
}));
```

- Register the handler with `use()`, which matches every method, or add a matching `options()` route, so the preflight reaches it. routup has no `all()` method.

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `origin` | `boolean \| string \| RegExp \| (string \| RegExp)[] \| (origin: string) => boolean` | `'*'` | Value of `Access-Control-Allow-Origin`. `true` reflects the request origin (no header when the request has none). `false` skips CORS entirely: no headers, preflight passes through. `'*'` is sent as `*`. Any other string is sent verbatim (`'null'`, `'https://app.example.com'`) on every request, whatever the request origin. A `RegExp`, array or function reflects the request origin on a match. Every value except `'*'` and `false` appends `Vary: origin`. |
| `methods` | `'*' \| string[]` | `'*'` | Value of `Access-Control-Allow-Methods` on preflight, joined with `,`. With `credentials: true`, `'*'` expands to `GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS`. An empty array omits the header. |
| `allowHeaders` | `'*' \| string[]` | `'*'` | Value of `Access-Control-Allow-Headers` on preflight. When `'*'` or empty, mirrors the request's `Access-Control-Request-Headers` (and omits the header when the request sent none). Appends `Vary: access-control-request-headers`. |
| `exposeHeaders` | `'*' \| string[]` | `'*'` | Value of `Access-Control-Expose-Headers` on non-preflight responses. An empty array omits the header. |
| `credentials` | `boolean` | `false` | Sets `Access-Control-Allow-Credentials: true`. See [Credentials](#credentials) for how wildcards behave. |
| `maxAge` | `string \| number \| false` | `false` | Value of `Access-Control-Max-Age` on preflight, in seconds. Numbers are stringified; `false` omits the header. |
| `preflight.status` | `number` | `204` | Status code of the preflight response. The response also carries `Content-Length: 0` for Safari. |
| `preflight.continue` | `boolean` | `false` | When `true`, sets the preflight headers and calls `event.next()` instead of returning the preflight response, so your own `OPTIONS` handler takes over. |

`['*']` (a one-element array holding `'*'`) is treated the same as `'*'` for `methods`, `allowHeaders` and `exposeHeaders`.

## API

| Export | Kind | Purpose |
|--------|------|---------|
| `cors(options?)` | function (default export) | Plugin that installs the CORS handler on a router |
| `createHandler(options?)` | function | The handler the plugin installs, for `router.use()` without the plugin wrapper |
| `handleCors(event, options)` | function | Appends headers and returns the preflight `Response`, or `undefined` |
| `appendCorsHeaders(event, options)` | function | Appends the non-preflight headers |
| `appendCorsPreflightHeaders(event, options)` | function | Appends the preflight headers |
| `isPreflightRequest(event)` | function | `true` for an `OPTIONS` request with `Origin` and `Access-Control-Request-Method` |
| `isCorsOriginAllowed(origin, options)` | function | Evaluates the `origin` option against an origin string |
| `resolveOptions(options?)` | function | Fills in defaults and applies the credentials normalisation |
| `Options`, `ResolvedOptions`, `CorsOriginOption`, `CorsListOption`, `CorsMaxAgeOption`, `CorsHeaderEntry` | types | Option and header types |

More on the helpers in the [helpers guide](https://plugins.routup.dev/cors/helpers).

### `handleCors`

All-in-one helper: appends the headers and, on a preflight request, returns the preflight `Response`. Useful inside an existing handler when you don't want to install the plugin globally (see [Decorate a single route](#decorate-a-single-route)).

```typescript
declare function handleCors(
    event: IAppEvent,
    options: Options,
): Response | undefined;
```

- Returns `undefined` for non-preflight requests, when `origin` is `false`, and when `preflight.continue` is `true`.
- It does not log the credentials warnings; only the plugin (`cors()` / `createHandler()`) does.

### `appendCorsHeaders`

Appends `Access-Control-Allow-Origin`, `Access-Control-Allow-Credentials` and `Access-Control-Expose-Headers` to `event.response.headers`. It does not check whether the request is a preflight; pair it with `isPreflightRequest` and `appendCorsPreflightHeaders` if you handle preflight yourself.

```typescript
declare function appendCorsHeaders(
    event: IAppEvent,
    options: Options,
): void;
```

### `appendCorsPreflightHeaders`

Appends the preflight set (`Access-Control-Allow-Origin`, `Access-Control-Allow-Credentials`, `Access-Control-Allow-Methods`, `Access-Control-Allow-Headers`, `Access-Control-Max-Age`) to `event.response.headers`. You return the `Response` yourself.

```typescript
declare function appendCorsPreflightHeaders(
    event: IAppEvent,
    options: Options,
): void;
```

```typescript
import { App, defineCoreHandler } from 'routup';
import { appendCorsHeaders, appendCorsPreflightHeaders, isPreflightRequest } from '@routup/cors';

const router = new App();
const options = { origin: 'https://app.example.com', maxAge: 600 };

router.use('/', defineCoreHandler((event) => {
    if (isPreflightRequest(event)) {
        appendCorsPreflightHeaders(event, options);
        event.response.status = 204;

        return null;
    }

    appendCorsHeaders(event, options);

    return 'ok';
}));
```

### `isPreflightRequest`

Returns `true` when the request is `OPTIONS` with both an `Origin` header and an `Access-Control-Request-Method` header.

```typescript
declare function isPreflightRequest(event: IAppEvent): boolean;
```

### `isCorsOriginAllowed`

Pure helper that evaluates the `origin` option against an origin string. Useful for CORS-related decisions (logging, a custom redirect) outside the plugin.

```typescript
declare function isCorsOriginAllowed(
    origin: string | null | undefined,
    options: Options,
): boolean;
```

- Returns `false` for a missing or empty origin and for `origin: false`.
- Returns `true` for `origin` `undefined`, `'*'` or `true`.
- A plain string is compared by equality.

## Notes

- **Header values are set, `Vary` is appended.** `Access-Control-*` headers already on `event.response.headers` are overwritten; `Vary` values are added next to existing ones.
- **A fixed string `origin` is not a check.** `origin: 'https://app.example.com'` sends that value on every response, even to other origins; the browser does the rejecting. Use an array or `RegExp` if you want the header omitted for other origins.
- **`origin: false` only short-circuits the plugin and `handleCors`.** Called directly, `appendCorsHeaders` and `appendCorsPreflightHeaders` with `origin: false` still add the credentials, methods, allow-headers, expose-headers and max-age headers; they omit only `Access-Control-Allow-Origin`.
- **The preflight response is a new `Response`.** It copies the headers already set on `event.response`, so handlers mounted before the plugin can still add headers; handlers after it never run for a preflight unless `preflight.continue` is set.
- **Warnings fire once, at plugin creation.** `credentials: true` with `origin: '*'` or `exposeHeaders: '*'` logs a `console.warn` when `cors()` / `createHandler()` is called, not per request.

## License

Made with 💚

Published under [MIT License](https://github.com/routup/plugins/blob/master/LICENSE).
