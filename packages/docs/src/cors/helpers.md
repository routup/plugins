---
title: CORS Helpers
description: The plugin, the header functions and the types exported by @routup/cors.
relatedPlugins: [body, cookie]
---

# Helpers and API

Everything `@routup/cors` exports. Options are on [Configuration](/cors/configuration).

## `cors()`

Creates the plugin, named `cors`; installing it registers [`createHandler(options)`](#createhandler) on the app. It is also the default export.

```typescript
declare function cors(options?: Options): Plugin;
```

## `createHandler()`

Returns the handler the plugin installs, for `app.use()` without the plugin wrapper, for example on one path. It logs the [credentials warnings](/cors/configuration#credentials) when it is called.

```typescript
declare function createHandler(input?: Options): Handler;
```

## `handleCors()`

Does the plugin's work inside a handler of your own: it sets the headers and, on a preflight, returns the preflight `Response` for you to return. It returns `undefined` for any other request, when `origin` is `false` and when `preflight.continue` is `true`. It does not log the credentials warnings.

```typescript
declare function handleCors(
    event: IAppEvent,
    options: Options,
): Response | undefined;
```

<<< @/../examples/cors/single-route.ts

The handler must see the preflight: register it with `use()`, which matches every method, or add an `options()` route for the path. routup has no `all()` method.

## `appendCorsHeaders()`

Sets the headers of an ordinary response on `event.response.headers`: `Access-Control-Allow-Origin`, `Access-Control-Allow-Credentials` and `Access-Control-Expose-Headers`, plus `Vary`. It does not check whether the request is a preflight.

```typescript
declare function appendCorsHeaders(
    event: IAppEvent,
    options: Options,
): void;
```

## `appendCorsPreflightHeaders()`

Sets the preflight headers on `event.response.headers`: `Access-Control-Allow-Origin`, `Access-Control-Allow-Credentials`, `Access-Control-Allow-Methods`, `Access-Control-Allow-Headers` and `Access-Control-Max-Age`, plus `Vary`. You return the response yourself.

```typescript
declare function appendCorsPreflightHeaders(
    event: IAppEvent,
    options: Options,
): void;
```

<<< @/../examples/cors/manual-headers.ts

Both functions resolve `options` like the plugin, including the credentials expansion of `methods`. `origin: false` does not turn them off: they leave out `Access-Control-Allow-Origin` and still set the other headers.

## `isPreflightRequest()`

Returns `true` for an `OPTIONS` request with both an `Origin` and an `Access-Control-Request-Method` header.

```typescript
declare function isPreflightRequest(event: IAppEvent): boolean;
```

## `isCorsOriginAllowed()`

Evaluates the `origin` option against an origin string, for decisions outside the plugin such as logging rejected origins.

```typescript
declare function isCorsOriginAllowed(
    origin: string | null | undefined,
    options?: Options,
): boolean;
```

| `options.origin` | Result |
|------------------|--------|
| any, with a missing or empty `origin` argument | `false` |
| `false` | `false` |
| `undefined`, `'*'` or `true` | `true` |
| a string | `origin` equals it |
| a `RegExp`, an array or a function | as for the plugin ([`origin`](/cors/configuration#origin)) |

## `resolveOptions()`

Applies the defaults to `Options` and returns `ResolvedOptions`: `['*']` becomes `'*'`, and with `credentials: true` a `'*'` for `methods` becomes the list of methods.

```typescript
declare function resolveOptions(options?: Options): ResolvedOptions;
```

## Types

| Type | Definition |
|------|------------|
| `Options` | The argument of `cors()`, every key optional ([Configuration](/cors/configuration)) |
| `ResolvedOptions` | `Options` with every key set, as `resolveOptions()` returns them; `preflight` is `{ status: number; continue: boolean }` |
| `CorsOriginOption` | `boolean \| string \| RegExp \| (string \| RegExp)[] \| ((origin: string) => boolean)`, the type of `origin` |
| `CorsListOption` | `'*' \| string[]`, the type of `methods`, `allowHeaders` and `exposeHeaders` |
| `CorsMaxAgeOption` | `string \| number \| false`, the type of `maxAge` |
| `CorsHeaderEntry` | `readonly [name: string, value: string]`, one header |
