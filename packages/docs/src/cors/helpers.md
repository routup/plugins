---
title: CORS — Helpers
description: Apply CORS headers programmatically — preflight detection, origin checks, header appenders.
relatedPlugins: []
---

# Helpers

## `handleCors`

All-in-one helper. Appends the right CORS headers and, on a preflight request, returns a ready-to-send `Response`.

```typescript
declare function handleCors(
    event: IAppEvent,
    options: Options,
): Response | undefined;
```

```typescript
router.all('/', defineCoreHandler((event) => {
    const corsResponse = handleCors(event, { origin: '*' });
    if (corsResponse) {
        return corsResponse;
    }

    return 'ok';
}));
```

## `appendCorsHeaders`

Appends the non-preflight CORS headers (`Access-Control-Allow-Origin`, `Access-Control-Allow-Credentials`, `Access-Control-Expose-Headers`).

```typescript
declare function appendCorsHeaders(
    event: IAppEvent,
    options: Options,
): void;
```

## `appendCorsPreflightHeaders`

Appends the preflight CORS headers (`Access-Control-Allow-Methods`, `Access-Control-Allow-Headers`, `Access-Control-Max-Age`, plus origin/credentials).

```typescript
declare function appendCorsPreflightHeaders(
    event: IAppEvent,
    options: Options,
): void;
```

## `isPreflightRequest`

Returns `true` for `OPTIONS` requests carrying both an `Origin` header and `Access-Control-Request-Method`.

```typescript
declare function isPreflightRequest(event: IAppEvent): boolean;
```

## `isCorsOriginAllowed`

Pure check against the `origin` option — useful when you need to make a CORS-related decision (e.g. logging, custom redirect) outside the plugin itself.

```typescript
declare function isCorsOriginAllowed(
    origin: string | null | undefined,
    options: Options,
): boolean;
```
