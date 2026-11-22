---
title: CORS Configuration
description: All options of the cors plugin and how wildcards behave with credentials.
relatedPlugins: [body, cookie]
---

# Configuration

`cors(options?)` takes one object; every option is optional. The options are the `Options` type; [`resolveOptions()`](/cors/helpers#resolveoptions) turns them into `ResolvedOptions` with the defaults below.

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `origin` | `boolean \| string \| RegExp \| (string \| RegExp)[] \| (origin: string) => boolean` | `'*'` | Which origins get `Access-Control-Allow-Origin`, and with which value; `false` turns the plugin off |
| `methods` | `'*' \| string[]` | `'*'` | `Access-Control-Allow-Methods` on a preflight, joined with `,` |
| `allowHeaders` | `'*' \| string[]` | `'*'` | `Access-Control-Allow-Headers` on a preflight; `'*'` mirrors the request's `Access-Control-Request-Headers` |
| `exposeHeaders` | `'*' \| string[]` | `'*'` | `Access-Control-Expose-Headers` on the other responses, joined with `,` |
| `credentials` | `boolean` | `false` | Sends `Access-Control-Allow-Credentials: true` on every response |
| `maxAge` | `string \| number \| false` | `false` | `Access-Control-Max-Age` on a preflight, in seconds; `false` sends none |
| `preflight` | `{ status?: number; continue?: boolean }` | `{ status: 204, continue: false }` | Status of the preflight response, or let your own `OPTIONS` handler answer |

For `methods`, `allowHeaders` and `exposeHeaders`, `['*']` is the same as `'*'`. An empty array sends no `Access-Control-Allow-Methods` or `Access-Control-Expose-Headers`; for `allowHeaders` it is the same as `'*'`.

### `origin`

| Value | `Access-Control-Allow-Origin` | `Vary: origin` |
|-------|-------------------------------|----------------|
| `'*'` (default) | `*`, on every response | no |
| `true` | The request's `Origin`; none when the request has no `Origin` | yes |
| Any other string, such as `'https://app.example.com'` or `'null'` | That string, on every response, whatever the request's `Origin` | yes |
| `RegExp` | The request's `Origin` when the pattern matches it | yes |
| Array of strings and `RegExp`s | The request's `Origin` when an entry matches it: a string by equality, a `RegExp` with `test()` | yes |
| Function `(origin) => boolean` | The request's `Origin` when the function returns `true`; not called without an `Origin` | yes |
| `false` | None: the plugin passes every request on, preflights too, and sets no header | no |

A fixed string is not a check: other origins get the same value and the browser rejects the response. To send no header to other origins, use an array of one ([Allow One Origin](/cors/recipes#allow-one-origin)).

When no entry matches, the response has no `Access-Control-Allow-Origin`, so the browser blocks it; the plugin still sets the other headers and a preflight is still answered. `Vary: origin` is sent for every option except `'*'` and `false`, matching or not, so a shared cache does not serve the answer to one origin to another. A `RegExp` with the `g` or `y` flag is copied without those flags before each test, so its `lastIndex` does not make the result alternate between requests.

<<< @/../examples/cors/environments.ts

[An Allow-List](/cors/recipes#an-allow-list) shows a function.

### `methods`

The methods a preflight allows, as a list or `'*'`. A literal `*` is only a wildcard for requests without credentials, so with [`credentials`](#credentials) a `'*'` is sent as `GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS`.

### `allowHeaders`

The request headers a preflight allows. With `'*'`, an empty array or `['*']`, the preflight answers with the request's own `Access-Control-Request-Headers`, so a literal `*` is never sent and this is safe with credentials; a preflight without that header gets no `Access-Control-Allow-Headers`. Whenever the header is sent, `Vary: access-control-request-headers` is appended.

### `exposeHeaders`

The response headers a script may read beyond the CORS-safelisted ones. A browser treats `*` as a wildcard only for requests without credentials; with [`credentials`](#credentials), list the headers you need, such as `['x-request-id']`.

### `credentials`

`true` sends `Access-Control-Allow-Credentials: true`, on a preflight and on the other responses, so the browser sends cookies and reads the response. Browsers do not accept a literal `*` on a request with credentials, so the plugin handles each wildcard:

| Option with `'*'` | With `credentials: true` |
|-------------------|--------------------------|
| `methods` | Expanded to `GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS` |
| `allowHeaders` | Mirrors `Access-Control-Request-Headers`, as without credentials |
| `exposeHeaders` | Sent as `*`; the response is not blocked, but scripts read only the CORS-safelisted headers. The plugin logs a warning |
| `origin` | Sent as `*`, so the browser blocks the response. The plugin logs a warning and does not switch to reflecting the origin, which would let any site send requests with the user's cookies. Use `true` or an allow-list |

The warnings are written with `console.warn` when the plugin is installed with `app.use()`, or when [`createHandler()`](/cors/helpers#createhandler) is called; not per request. [Credentials](/cors/recipes#credentials) is a complete setup.

### `maxAge`

How long, in seconds, the browser may reuse a preflight answer. A number is sent as its string; `false` (the default) sends no `Access-Control-Max-Age`, and the browser applies its own default. See [Preflight Caching](/cors/recipes#preflight-caching).

### `preflight`

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `status` | `number` | `204` | Status of the preflight response, for clients that do not accept `204` |
| `continue` | `boolean` | `false` | Set the preflight headers, then call `event.next()` instead of answering |

With `continue`, your `OPTIONS` route answers the preflight and the headers are already on `event.response` ([Your Own Preflight Handler](/cors/recipes#your-own-preflight-handler)). Without such a route, routup answers the `OPTIONS` request itself, with status `200` and an `Allow` header.
