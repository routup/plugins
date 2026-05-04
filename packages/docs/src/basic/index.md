---
title: Basic
description: Bundle plugin — installs body, cookie, and query in one call.
relatedPlugins: [body, cookie, query, decorators]
---

# @routup/basic

A bundle plugin that installs three of the most-commonly-needed parsers in one line:

- [`@routup/body`](/body/) — request payload (JSON, URL-encoded, raw, text, streams)
- [`@routup/cookie`](/cookie/) — cookie parsing + `Set-Cookie` serialization
- [`@routup/query`](/query/) — query string parsing

Use it when you'd reach for all three anyway and want one import + one `router.use()` line.

## Installation

```bash
npm install @routup/basic
```

## Quick start

```typescript
import { Router, defineCoreHandler, serve } from 'routup';
import { basic } from '@routup/basic';
import { readRequestBody } from '@routup/basic/body';
import { useRequestCookie } from '@routup/basic/cookie';
import { useRequestQuery } from '@routup/basic/query';

const router = new Router();

router.use(basic());

router.post('/', defineCoreHandler(async (event) => {
    const body = await readRequestBody(event);
    const session = useRequestCookie(event, 'session');
    const query = useRequestQuery(event);
    return { body, session, query };
}));

serve(router, { port: 3000 });
```

The bundle re-exports each sub-plugin under `@routup/basic/body`, `@routup/basic/cookie`, and `@routup/basic/query`, so you can pick helpers without a second `npm install`.

## When to use it

- You need at least two of body/cookie/query — the bundle is no heavier than installing them individually
- You're integrating with [`@routup/decorators`](/decorators/), which expects all three parsers' helpers to be wired up as parameter extractors

## When *not* to use it

- You only need one of the three — install the individual plugin to keep the dep tree minimal
- You need to run query-parsing in front of body-parsing (or any non-default ordering) — install the individual plugins so you control `router.use()` order

## See also

- [Configuration](./configuration) — disable individual sub-plugins or pass per-plugin options
- [`@routup/body`](/body/), [`@routup/cookie`](/cookie/), [`@routup/query`](/query/) — the bundled plugins themselves
