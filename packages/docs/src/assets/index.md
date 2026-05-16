---
title: Assets
description: Serve static files from one or more directories with cache-control, fallback, and dotfile policies.
relatedPlugins: []
---

# @routup/assets

Serve static files from one or more directories. The plugin walks each registered directory in order and falls through to the next handler when no file is found — so it composes naturally with API routes, SPA fallbacks, and other plugins in the stack.

## Installation

```bash
npm install @routup/assets
```

## Quick start

```typescript
import { App, serve } from 'routup';
import { assets } from '@routup/assets';

const router = new App();

router.use(assets('public'));

serve(router, { port: 3000 });
```

A request for `GET /logo.png` resolves to `public/logo.png`. If the file is missing, the request continues to the next handler — no 404 from this plugin unless [`fallthrough`](./configuration#fallthrough) is disabled.

## When to use it

- Serving a built SPA's `dist/` alongside API routes
- Hosting documentation, generated reports, or user-uploaded assets
- Pre-loading file metadata (the default) to avoid re-`stat`'ing on every request

For dynamic content, single-file downloads, or streamed responses, use the core `sendFile` / `sendStream` helpers directly instead.

## Stacking directories

Mount the plugin once per directory. The first match wins:

```typescript
router.use(assets('public')); // takes precedence
router.use(assets('files'));  // falls through if not in `public`
```

## Mounting under a path

Limit a directory to a specific URL prefix:

```typescript
router.use('/static', assets('public'));
// GET /static/logo.png → public/logo.png
// GET /logo.png       → not handled by this plugin
```

## See also

- [Configuration reference](./configuration) — every option in detail
