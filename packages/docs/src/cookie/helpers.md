---
title: Cookie Helpers
description: Reading parsed cookies and writing Set-Cookie headers with @routup/cookie.
relatedPlugins: [basic]
---

# Helpers and API

Everything `@routup/cookie` exports. Each helper takes the routup event first; options are on [Configuration](/cookie/configuration).

## `cookie()`

Creates the plugin. It is also the default export.

```typescript
declare function cookie(options?: Options): Plugin;
```

## `useRequestCookies()`

Returns the parsed request cookies, or `{}` when the `cookie()` middleware has not run for the request.

```typescript
declare function useRequestCookies(
    event: IAppEvent,
): Record<string, string>;
```

## `useRequestCookie()`

Returns one parsed request cookie, or `undefined` when it is absent.

```typescript
declare function useRequestCookie(
    event: IAppEvent,
    name: string,
): string | undefined;
```

## `setRequestCookies()`

Changes the stored request cookies that later handlers read: a key and value merge one cookie in, a record replaces them all. Nothing is sent to the client ([Default a Missing Cookie](/cookie/recipes#default-a-missing-cookie)).

```typescript
declare function setRequestCookies(
    event: IAppEvent,
    key: string,
    value: unknown,
): void;

declare function setRequestCookies(
    event: IAppEvent,
    record: Record<string, any>,
): void;
```

Called before `cookie()` runs, it also stops the middleware from parsing the `Cookie` header.

## `hasRequestCookies()`

Returns `true` once cookies are stored for the request, by the middleware or by `setRequestCookies()`.

```typescript
declare function hasRequestCookies(
    event: IAppEvent,
): boolean;
```

## `setResponseCookie()`

Appends a `Set-Cookie` header to the response. The value is encoded with `encodeURIComponent` unless you pass `encode`. It works without the `cookie()` plugin.

```typescript
declare function setResponseCookie(
    event: IAppEvent,
    name: string,
    value: string,
    options?: SerializeOptions,
): void;
```

The options are the cookie-es `CookieSerializeOptions`:

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `path` | `string` | `'/'` | `Path` attribute |
| `domain` | `string` | none | `Domain` attribute |
| `maxAge` | `number` | none | `Max-Age` in seconds; an integer, capped at 400 days (`34560000`) |
| `expires` | `Date` | none | `Expires` attribute |
| `httpOnly` | `boolean` | `false` | `HttpOnly` attribute: scripts in the browser cannot read the cookie |
| `secure` | `boolean` | `false` | `Secure` attribute: sent over HTTPS only |
| `sameSite` | `boolean \| 'lax' \| 'strict' \| 'none'` | none | `SameSite` attribute; `true` means `Strict` |
| `priority` | `'low' \| 'medium' \| 'high'` | none | `Priority` attribute |
| `partitioned` | `boolean` | `false` | `Partitioned` attribute |
| `encode` | `(value: string) => string` | `encodeURIComponent` | Encodes the value |
| `stringify` | `(value: unknown) => string` | `JSON.stringify` | Not used: `value` is always a string |

cookie-es throws a `TypeError`, which answers `500` inside a handler, for:

- an invalid name, or a value that is invalid after encoding
- a `maxAge` that is not an integer
- a `domain` or `path` with characters the attribute does not allow
- an `expires` that is not a valid `Date`
- an unknown `priority` or `sameSite` value: `priority` takes `'low'`, `'medium'` or `'high'`, `sameSite` takes `true`, `'lax'`, `'strict'` or `'none'`, both compared case-insensitively; `false` leaves `SameSite` out
- `partitioned` or `sameSite: 'none'` without `secure`
- a `__Secure-` or `__Host-` name without `secure`
- a `__Host-` name with a `domain` or a `path` other than `/`

## `unsetResponseCookie()`

Clears a cookie: appends a `Set-Cookie` header with an empty value and `Max-Age=0`. A `maxAge` you pass is overridden.

```typescript
declare function unsetResponseCookie(
    event: IAppEvent,
    name: string,
    options?: SerializeOptions,
): void;
```

Pass the same `path` and `domain` that the cookie was set with; a browser only deletes a cookie whose scope matches.

## `parseRequestCookies()`

Parses the request's `Cookie` header with cookie-es and returns the result without storing it. The middleware uses it.

```typescript
declare function parseRequestCookies(
    event: IAppEvent,
    options?: ParseOptions,
): Record<string, string | undefined>;
```

## Types

| Type | Definition |
|------|------------|
| `Options` | `{ parse?: ParseOptions; serialize?: SerializeOptions }` ([Configuration](/cookie/configuration)) |
| `ParseOptions` | cookie-es `CookieParseOptions` ([`parse`](/cookie/configuration#parse)) |
| `SerializeOptions` | cookie-es `CookieSerializeOptions` ([attributes](#setresponsecookie)) |

## Other Exports

Exported, but not meant for application code.

| Export | Description |
|--------|-------------|
| `isObject` | `isObject(value)`: `true` for a non-null object that is not an array |
