---
name: morgan reference
description: Mapping between morgan's HTTP request logger and @routup/logger — what was kept, what was replaced, and how to keep them in sync.
type: reference
---

# morgan Reference

[morgan](https://github.com/expressjs/morgan) is the de-facto Express request logger. `@routup/logger` ports its token + format DSL to routup's web-API model, replacing the typical `fromNodeMiddleware(morgan('tiny'))` integration with a native handler.

Repo: <https://github.com/expressjs/morgan> — the entire library lives in `index.js` (~552 lines).

## Version snapshot (as of 2026-05-06)

| | Version | Source |
|---|---|---|
| `morgan` (npm) | `1.10.1` | `index.js` (commit `203c758`) |

Bump the snapshot whenever you sync. Morgan moves slowly — most changes are dependency bumps, not feature work.

## Code mapping (morgan → @routup/logger)

### Public API

| morgan | `@routup/logger` | Notes |
|---|---|---|
| `morgan(format, options)` middleware | `logger(format, options)` returning `CoreHandler` | **Not a routup `Plugin`** — see [Why a handler not a plugin](#why-a-handler-not-a-plugin). Same overload shape (`logger(opts)` or `logger(format, opts)`). |
| `morgan.compile(format)` | `compile(format)` (`src/compile.ts`) | Replaces morgan's `new Function(...)` JIT with a static piece-array walker — safer, CSP-friendly, debuggable. |
| `morgan.format(name, fmt)` | _(no global registry — pass via `options.format`)_ | Routup port keeps the preset map (`formatStrings`) immutable and exposes `resolveFormat()` for resolution. |
| `morgan.token(name, fn)` | `options.tokens` (per-instance) or extend `defaultTokens` | Tokens are merged on top of built-ins on each `logger()` call. |
| `options.skip(req, res)` | `options.skip(event, response)` | `event` is `IRoutupEvent`; `response` may be `undefined` (immediate mode). |
| `options.stream.write` | `options.write(line)` | Plain function instead of stream-shaped object. |
| `options.immediate` | `options.immediate` | Same — emits at request start, with `:status` / `:response-time` rendering as `-`. |
| `options.buffer` | _(dropped)_ | Already deprecated in morgan. |

### Built-in tokens

| morgan token | `@routup/logger` token | Notes |
|---|---|---|
| `:url` | `:url` | Renders `pathname + search` — routup uses Web Standard `URL` parsing instead of `req.originalUrl`. |
| `:method` | `:method` | Identical (`event.method`). |
| `:status` | `:status` | Reads `response.status` (the actual `Response`, not `res._header`). |
| `:date` (`web` / `iso` / `clf`) | `:date` (`web` / `iso` / `clf`) | Identical formatter; CLF month table inlined in `src/tokens.ts`. |
| `:response-time` / `:total-time` | `:response-time` / `:total-time` | Uses `performance.now()` instead of `process.hrtime()`. Stored on `event.store[StartTimeSymbol]` rather than morgan's `req._startAt`. |
| `:remote-addr` | `:remote-addr` | Delegates to routup's `getRequestIP(event)` (srvx-aware). Morgan walks `req.connection.remoteAddress`. |
| `:remote-user` | `:remote-user` | Decodes `Authorization: Basic …` via `atob` (no `basic-auth` dep). |
| `:user-agent` | `:user-agent` | Same. |
| `:referrer` | `:referrer` | Same — checks both `referer` and the (rare) `referrer` spelling. |
| `:http-version` | `:http-version` | Reads `request.httpVersion` if present (srvx exposes it on Node), defaults to `'1.1'`. |
| `:req[name]` | `:req[name]` | Reads from `IRoutupEvent.headers` via `getRequestHeader`. |
| `:res[name]` | `:res[name]` | Reads from the resolved `Response.headers` (web-API). |
| `:pid` | `:pid` | Same. |

### Preset formats

| morgan preset | `@routup/logger` preset | Notes |
|---|---|---|
| `'combined'` | `'combined'` | Identical format string. |
| `'common'` | `'common'` | Identical. |
| `'short'` | `'short'` | Identical. |
| `'tiny'` | `'tiny'` | Identical. |
| `'dev'` | `'dev'` (`devFormatter`) | Same status-color palette (red 5xx, yellow 4xx, cyan 3xx, green 2xx). Implemented as a pre-resolved Formatter rather than a compiled-on-demand function. |
| `'default'` | _(dropped)_ | Was already deprecated in morgan (`use combined format`). |

## Behavioral differences

### A handler, not a plugin

`logger()` returns a `CoreHandler`, mounted with `app.use(logger())` before the routes it logs. Logging is post-response: it needs the resolved `Response` (status, headers, content-length) for `:status` / `:res[*]` / `:response-time`, which the handler gets by awaiting `event.next()`.

A plugin would see the same response: routup v6 `App.install()` runs `plugin.install()` on a scratch `App` and `app.use()` flattens its handlers into the parent at the install position, so their `event.next()` walks the routes registered after them. Turning `logger()` into a plugin would change its return type, a breaking change.

### Compiler

morgan: `new Function('tokens, req, res', js)` — JIT-compiles the format string. Faster but CSP-hostile and harder to debug.
routup: piece-array walker. ~1 microsecond slower per log line, but safe and inspectable. Same regex (`/:([-\w]{2,})(?:\[([^\]]+)\])?/g`).

### Timing

morgan: `process.hrtime()` saved on `req._startAt` and `res._startAt` (the latter populated by `onHeaders(res, ...)`).
routup: `performance.now()` saved on `event.store[StartTimeSymbol]`. We don't distinguish "headers-sent time" from "finish time" — `:response-time` reflects the time from request start to log emission. For routup the difference is rarely meaningful since dispatch, header building, and body resolution all happen in-process.

### `:remote-user`

morgan: uses the `basic-auth` package (regex + buffer decoding).
routup: inline `atob` decoding of `Authorization: Basic …`. No third-party dep, drops about 200 LoC.

## When to re-sync

Re-pull `index.js` from `expressjs/morgan` whenever:
1. A new `1.x` release ships (rare — morgan is in maintenance mode).
2. Anyone files a missing-token issue against `@routup/logger` — morgan probably has the token already.
3. `basic-auth` or another transitive dep has a CVE that affected our `:remote-user` parity.

After syncing, update the version snapshot above with the commit SHA, and run:

```bash
npx nx run @routup/logger:test
npx nx run @routup/logger:build
```
