---
title: i18n
description: Locale-aware translation for routup, built on top of ilingo.
relatedPlugins: []
---

# @routup/i18n

Adds locale detection and translation to the routup pipeline. Built on [ilingo](https://github.com/tada5hi/ilingo) — bring any `Store` (memory, filesystem, async loader, …) and the plugin handles per-request locale resolution and the translator factory.

## Installation

```bash
npm install @routup/i18n ilingo
```

## Quick start

```typescript
import { Router, defineCoreHandler, serve } from 'routup';
import { MemoryStore } from 'ilingo';
import { i18n, useTranslator } from '@routup/i18n';

const store = new MemoryStore({
    data: {
        en: { app: { greeting: 'Hello, my name is {{name}}' } },
        de: { app: { greeting: 'Hallo, mein Name ist {{name}}' } },
    },
});

const router = new Router();

router.use(i18n({ store }));

router.get('/', defineCoreHandler((event) => {
    const t = useTranslator(event);
    return t({ group: 'app', key: 'greeting', data: { name: 'Peter' } });
}));

serve(router, { port: 3000 });
```

The middleware inspects each incoming request and selects a locale (defaulting to ilingo's resolver — typically `Accept-Language` or a configured query/cookie strategy). `useTranslator(event)` returns a translator pre-bound to that locale.

## When to use it

- Multi-language API responses, error messages, or email bodies rendered server-side
- Centralizing translation files under one `Store` shared across the request pipeline
- Reusing existing ilingo stores (memory, filesystem, custom async loader)

## Helpers

### `useTranslator`

Returns a translator bound to the request's resolved locale.

```typescript
import type { IRoutupEvent } from 'routup';
import type { Translator } from '@routup/i18n';

declare function useTranslator(event: IRoutupEvent): Translator;
```

```typescript
const t = useTranslator(event);
const greeting = t({ group: 'app', key: 'greeting', data: { name: 'Peter' } });
```

For ilingo's `Translator` API (interpolation, fallback chains, plurals), see the [ilingo documentation](https://github.com/tada5hi/ilingo).
