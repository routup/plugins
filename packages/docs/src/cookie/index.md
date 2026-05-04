---
title: Cookie
description: Parse request cookies and serialize Set-Cookie headers on the response.
relatedPlugins: [basic, decorators]
---

# @routup/cookie

Parses incoming `Cookie` headers into a typed map and gives you helpers to set or unset cookies on the response.

## Installation

```bash
npm install @routup/cookie
```

## Quick start

```typescript
import { Router, defineCoreHandler, serve } from 'routup';
import { cookie, useRequestCookie, useRequestCookies } from '@routup/cookie';

const router = new Router();

router.use(cookie());

router.get('/', defineCoreHandler((event) => {
    const all = useRequestCookies(event);
    const session = useRequestCookie(event, 'session');
    return { session, all };
}));

serve(router, { port: 3000 });
```

The middleware parses cookies once and caches the result on `event.store`. Helpers read from the cache.

## When to use it

- Authentication / session cookies
- CSRF tokens, locale preferences, A/B test assignments
- Anywhere you need to set or read cookies — the plugin handles `Cookie` parsing and `Set-Cookie` serialization with all standard attributes (`HttpOnly`, `Secure`, `SameSite`, `Path`, `Domain`, `Max-Age`, `Expires`)

## Companion plugins

- [`@routup/basic`](/basic/) bundles `cookie` + [`body`](/body/) + [`query`](/query/) under one `router.use(basic())` call.
- [`@routup/decorators`](/decorators/) wires the cookie helpers to `@DCookie()` and `@DCookies()`.

## See also

- [Helpers](./helpers) — `useRequestCookie`, `useRequestCookies`, `setResponseCookie`, `unsetResponseCookie`, `setRequestCookies`
