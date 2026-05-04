---
title: Body — Configuration
description: Parser options for JSON, URL-encoded, raw, and text bodies.
relatedPlugins: [basic]
---

# Configuration

The plugin accepts an options object configuring four content-type families. Each entry can be a config object (enabled with overrides), `true` (enabled with defaults), or `false` (disabled).

```typescript
router.use(body({
    json: { limit: '1mb', strict: true },
    urlEncoded: { limit: '100kb' },
    raw: { limit: '5mb' },
    text: false,
}));
```

| Option | Default | Default content-types |
|---|---|---|
| `json` | `true` | `application/json` |
| `urlEncoded` | `true` | `application/x-www-form-urlencoded` |
| `raw` | `false` | (opt-in for `readRequestBodyBytes`, `readRequestBodyArrayBuffer`, `readRequestBodyBlob`) |
| `text` | `false` | (opt-in for `readRequestBodyText`) |

## `json`

Parses `application/json` requests.

| Property | Type | Default | Description |
|---|---|---|---|
| `limit` | `number \| string` | none | Maximum size — bytes or `'1mb'` style |
| `strict` | `boolean` | `true` | Only accept arrays and objects (rejects bare values) |
| `reviver` | `function` | — | Forwarded to `JSON.parse` |
| `type` | `string \| string[]` | `'application/json'` | Content-types this parser claims |

```typescript
router.use(body({
    json: { limit: '1mb', strict: true },
}));
```

## `urlEncoded`

Parses `application/x-www-form-urlencoded` requests.

| Property | Type | Default | Description |
|---|---|---|---|
| `limit` | `number \| string` | none | Maximum body size |
| `parameterLimit` | `number` | `1000` | Maximum number of fields |
| `type` | `string \| string[]` | `'application/x-www-form-urlencoded'` | Content-types this parser claims |

## `raw`

Configures the raw-byte readers. Off by default — opt in if you call `readRequestBodyBytes`, `readRequestBodyArrayBuffer`, or `readRequestBodyBlob`.

| Property | Type | Default | Description |
|---|---|---|---|
| `limit` | `number \| string` | none | Maximum body size |

## `text`

Configures the text reader.

| Property | Type | Default | Description |
|---|---|---|---|
| `limit` | `number \| string` | none | Maximum body size |
| `defaultCharset` | `string` | `'utf-8'` | Used when no charset is in the `Content-Type` header |
| `type` | `string \| string[]` | `'text/plain'` | Content-types this parser claims |
