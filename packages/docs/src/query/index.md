---
title: Query
description: Parse the request URL's query string into a typed map.
relatedPlugins: [basic, decorators]
---

# @routup/query

Parses the request URL's query string once per request and caches it on `event.store`. Supports nested keys (`foo[bar]=1`), repeated keys (`tag=a&tag=b`), and the standard `URLSearchParams` decoding.

## Installation

```bash
npm install @routup/query
```

## Quick start

```typescript
import { App, defineCoreHandler, serve } from 'routup';
import { query, useRequestQuery } from '@routup/query';

const router = new App();

router.use(query());

router.get('/', defineCoreHandler((event) => {
    const q = useRequestQuery(event);
    return q;
}));

serve(router, { port: 3000 });
```

`GET /?foo=bar&tag=a&tag=b` resolves to `{ foo: 'bar', tag: ['a', 'b'] }`.

## When to use it

- Reading `?page=2&pageSize=20` style filters
- Parsing nested query syntax that `URLSearchParams` alone doesn't reify
- Any handler that needs query parameters multiple times — the parse runs once

If you only need a single value once per request, `event.searchParams.get('foo')` from the core works without the plugin. The plugin pays for itself when you need the **parsed object**, **nested keys**, or **caching**.

## Companion plugins

- [`@routup/basic`](/basic/) bundles `query` + [`body`](/body/) + [`cookie`](/cookie/).
- [`@routup/decorators`](/decorators/) wires the helpers to `@DQuery()`.

## See also

- [Helpers](./helpers) — `useRequestQuery`, `setRequestQuery`
