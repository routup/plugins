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
    <a href="https://plugins.routup.dev/cors/"><b>Docs</b></a>
    ·
    <a href="https://plugins.routup.dev/cors/configuration">Configuration</a>
    ·
    <a href="https://plugins.routup.dev/cors/helpers">Helpers</a>
    ·
    <a href="https://plugins.routup.dev/cors/recipes">Recipes</a>
</p>

---

## Why @routup/cors?

A browser on another origin sends an `OPTIONS` preflight before most API calls and drops any response that lacks the right `Access-Control-*` headers. Getting this right by hand means a catch-all `OPTIONS` route, origin matching, `Vary` headers for caches, and knowing which wildcards a browser ignores once cookies are involved.

| Concern | Without it | With @routup/cors |
|---------|-----------|-------------------|
| Preflight | You register an `OPTIONS` handler per route (or a catch-all) and set the status and headers yourself | Every `OPTIONS` request with `Origin` and `Access-Control-Request-Method` gets a `204` with `Content-Length: 0` |
| Origin allow-list | You compare the `Origin` header against a list and echo it back | `origin` takes a string, `RegExp`, array or function; on a match the request origin is reflected |
| Cache correctness | You remember to append `Vary: origin` and `Vary: access-control-request-headers` | `Vary: origin` when `Access-Control-Allow-Origin` is sent with a value other than `*`, `Vary: access-control-request-headers` with `Access-Control-Allow-Headers`; appended, not overwritten |
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
npm install @routup/cors
```

ESM only, Node.js >=24. Peer dependency: `routup@^6.3.0`.

## Quick Start

```typescript
import { App, defineCoreHandler } from 'routup';
import { cors } from '@routup/cors';

export const app = new App();

// before the routes: answers preflights and adds the CORS headers
app.use(cors({
    origin: ['https://app.example.com'],
    allowHeaders: ['content-type', 'authorization'],
    exposeHeaders: ['x-request-id'],
}));

app.get('/', defineCoreHandler(() => 'Hello, World!'));
```

The sample exports the app; [serve it](https://routup.dev/guide/quickstart) from your entry file. `cors()` returns a plugin: register it with `app.use()` before your routes. A preflight from `https://app.example.com` gets a `204` with the `Access-Control-*` headers; other origins get no `Access-Control-Allow-Origin`.

## Documentation

The full reference lives on [plugins.routup.dev](https://plugins.routup.dev/cors/):

- [Overview](https://plugins.routup.dev/cors/): requirements, default behaviour and the headers on each response
- [Configuration](https://plugins.routup.dev/cors/configuration): every option, with its type and default, and the credentials rules
- [Helpers](https://plugins.routup.dev/cors/helpers): `handleCors()` for one route, the header functions and the types
- [Recipes](https://plugins.routup.dev/cors/recipes): one origin, an allow-list, credentials, preflight caching, your own preflight handler

## License

Made with 💚

Published under [MIT License](https://github.com/routup/plugins/blob/master/LICENSE).
