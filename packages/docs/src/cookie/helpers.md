---
title: Cookie — Helpers
description: Reading parsed cookies and writing Set-Cookie headers.
relatedPlugins: [basic]
---

# Helpers

## Options

The plugin's optional `parse` config lets you swap the cookie value decoder:

```typescript
router.use(cookie({
    parse: { decode: (value) => decodeURIComponent(value) },
}));
```

| Option | Type | Default | Description |
|---|---|---|---|
| `parse.decode` | `(value: string) => string` | `decodeURIComponent` | Per-cookie value decoder |

## `useRequestCookies`

Returns every parsed cookie as a string-to-string map.

```typescript
declare function useRequestCookies(
    event: IAppEvent,
): Record<string, string>;
```

## `useRequestCookie`

Returns a single cookie by name, or `undefined` if absent.

```typescript
declare function useRequestCookie(
    event: IAppEvent,
    name: string,
): string | undefined;
```

## `setRequestCookies`

Override the cached parsed cookies (e.g. inside a middleware that resolves a session token to its cookie set). Either set a single key or replace the whole record.

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

## `setResponseCookie`

Append a `Set-Cookie` header to the response. Accepts the standard cookie serialization options (`httpOnly`, `secure`, `sameSite`, `path`, `domain`, `maxAge`, `expires`, `priority`, `partitioned`).

```typescript
declare function setResponseCookie(
    event: IAppEvent,
    name: string,
    value: string,
    options?: SerializeOptions,
): void;
```

```typescript
setResponseCookie(event, 'session', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
});
```

## `unsetResponseCookie`

Clear a cookie by emitting a `Set-Cookie` header with `Max-Age=0`.

```typescript
declare function unsetResponseCookie(
    event: IAppEvent,
    name: string,
    options?: SerializeOptions,
): void;
```

Pass the same `path` / `domain` you used when setting the cookie — browsers scope deletion by these.
