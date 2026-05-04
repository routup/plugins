---
title: Assets — Configuration
description: All options accepted by the assets plugin.
relatedPlugins: []
---

# Configuration

The plugin's second argument is an options object:

```typescript
router.use(assets('public', {
    cacheMaxAge: 3600,
    fallback: '/index.html',
}));
```

## Options

### `scan`

- **Type**: `boolean`
- **Default**: `true`

Pre-load metadata for every file in the directory at startup. With `scan: true`, the filesystem is not traversed on every request — file existence and `stat` info are looked up from an in-memory map.

Disable for very large or rapidly-changing directories.

### `cacheMaxAge`

- **Type**: `number`
- **Default**: `0`

Sets the `max-age` directive (in seconds) on the `Cache-Control` response header. `0` disables caching.

### `cacheImmutable`

- **Type**: `boolean`
- **Default**: `false`

Appends the `immutable` directive to the `Cache-Control` header. Pair with content-hashed filenames (e.g. `app.[hash].js`) for long-lived cache entries.

### `fallback`

- **Type**: `boolean | string`
- **Default**: `false`

When a request resolves to no file, serve the file at this path instead. The classic SPA pattern:

```typescript
router.use(assets('dist', { fallback: '/index.html' }));
```

Set to `true` to default the fallback to `/`.

### `fallbackIgnores`

- **Type**: `RegExp[]`
- **Default**: `[]`

Patterns excluded from `fallback`. Typically used to make sure API routes don't get rewritten to the SPA shell:

```typescript
router.use(assets('dist', {
    fallback: '/index.html',
    fallbackIgnores: [/^\/api\//, /^\/auth\//],
}));
```

### `fallthrough`

- **Type**: `boolean`
- **Default**: `true`

When `true` and no file matches and no `fallback` applies, control passes to the next handler. Set to `false` to make the plugin respond with `404` itself.

### `extensions`

- **Type**: `string[]`
- **Default**: `['html', 'htm']`

Extensions to try when a request doesn't match a file directly. `GET /about` will try `/about.html` then `/about.htm`.

### `dotFiles`

- **Type**: `boolean`
- **Default**: `false`

Whether to serve files or directories that begin with `.`. Defaulting to `false` is a security guard against exposing `.env`, `.git/`, etc.

### `ignores`

- **Type**: `RegExp[]`
- **Default**: `[]`

Patterns that should never be served. Useful for dropping source maps in production:

```typescript
router.use(assets('dist', { ignores: [/\.map$/] }));
```
