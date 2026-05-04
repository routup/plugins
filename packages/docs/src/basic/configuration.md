---
title: Basic — Configuration
description: Per-sub-plugin configuration for the body, cookie, and query bundle.
relatedPlugins: [body, cookie, query]
---

# Configuration

The bundle takes one option per sub-plugin. Each is either a config object (forwarded to that sub-plugin), `true` (enabled with defaults), or `false` (disabled).

```typescript
router.use(basic({
    body: { json: { limit: '1mb' } },
    cookie: true,
    query: false, // skip query parsing entirely
}));
```

## Options

### `body`

- **Type**: [Body options](/body/configuration) | `boolean`
- **Default**: `true`

Forwarded to the body plugin. See [body — configuration](/body/configuration) for the full option set.

### `cookie`

- **Type**: [Cookie options](/cookie/helpers#options) | `boolean`
- **Default**: `true`

Forwarded to the cookie plugin. See [cookie — helpers (Options)](/cookie/helpers) for the available config.

### `query`

- **Type**: [Query options](/query/helpers) | `boolean`
- **Default**: `true`

Forwarded to the query plugin.

## Example: parse JSON only

```typescript
router.use(basic({
    body: {
        json: { limit: '512kb' },
        urlEncoded: false,
    },
}));
```
