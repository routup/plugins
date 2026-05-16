---
title: Body
description: Read and parse the request payload — JSON, URL-encoded, raw bytes, text, blobs, or streams.
relatedPlugins: [basic, decorators]
---

# @routup/body

Reads and parses request payloads. Out of the box it handles `application/json` and `application/x-www-form-urlencoded`; opt-in helpers cover raw bytes, text, blobs, array buffers, and streams (with transparent gzip / deflate / brotli decompression).

## Installation

```bash
npm install @routup/body
```

## Quick start

```typescript
import { App, defineCoreHandler, serve } from 'routup';
import { body, readRequestBody } from '@routup/body';

const router = new App();

router.use(body());

router.post('/', defineCoreHandler(async (event) => {
    const data = await readRequestBody(event);
    return { received: data };
}));

serve(router, { port: 3000 });
```

`router.use(body())` registers the parser middleware; `readRequestBody(event)` reads and caches the parsed body for the lifetime of the request.

## When to use it

- Anywhere you need a parsed request body (the most common case)
- For REST endpoints, GraphQL bodies, webhooks, or streaming uploads
- When you want size limits, content-type whitelisting, or transparent decompression without writing your own buffering

If you only ever consume `application/json` you don't need the plugin — `await event.request.json()` works directly. The plugin earns its keep when you want **caching**, **size limits**, **multiple content types**, or **the raw / text / stream variants**.

## Companion plugins

- [`@routup/basic`](/basic/) bundles `body` + [`cookie`](/cookie/) + [`query`](/query/) under one `router.use(basic())` call.
- [`@routup/decorators`](/decorators/) wires `readRequestBody` to the `@DBody()` parameter decorator.

## See also

- [Configuration reference](./configuration) — limits, content-type whitelists, JSON reviver hooks
- [Helpers](./helpers) — `readRequestBody`, `readRequestBodyText`, `readRequestBodyBytes`, `readRequestBodyStream`
