---
title: Body Configuration
description: Parser options for JSON, URL-encoded, raw and text bodies.
relatedPlugins: [basic]
---

# Configuration

`body(options?)` takes one entry per format, the `Options` type. Each entry is an options object, `true` (enabled with the defaults below) or `false`.

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `json` | `JsonOptions \| boolean` | `true` when no format is set | Parse JSON bodies in `readRequestBody()` |
| `urlEncoded` | `UrlEncodedOptions \| boolean` | `true` when no format is set | Parse URL-encoded form bodies in `readRequestBody()` |
| `raw` | `RawOptions \| boolean` | none | Default options of `readRequestBodyBytes()`, `readRequestBodyArrayBuffer()` and `readRequestBodyBlob()` |
| `text` | `TextOptions \| boolean` | none | Default options of `readRequestBodyText()` |

When no entry is set at all, `body()` sets `json` and `urlEncoded` to `true` on the options object you passed. Once one entry is set, the others stay off: `body({ text: true })` enables only `text`, and `readRequestBody()` then returns `{}`. Set `json: true, urlEncoded: true` as well to keep them.

### Size Limits

Every format takes `limit`: a number of bytes, or a string with the unit `b`, `kb`, `mb` or `gb` (1024-based, case-insensitive, such as `'100kb'` or `'1.5mb'`). Without `limit` there is no size limit.

- A `content-length` header above the limit answers `413` before anything is read.
- The limit is checked again against the decoded bytes while the body is read, so a missing or wrong `content-length`, or a compressed body that expands, does not get past it.
- A string with another unit is read as its leading number of bytes: `'2 MiB'` allows 2 bytes. A string without a leading number, such as `'large'`, makes every read answer `500`.

### Caching the Bytes

`cache: true` keeps the raw bytes on the request for later reads; the next helper that runs with `cache: true` returns them instead of reading the body again. Without it, a second read of a body already consumed answers `500` (`ReadableStream is locked`). The JSON and URL-encoded parsers always cache, whatever `cache` says. Leave it off for large uploads, so the bytes are not held in memory for the whole request. [Verify a Webhook Signature](/body/recipes#verify-a-webhook-signature) reads the same body twice.

### `json`

The JSON parser of `readRequestBody()`. An empty body gives `{}`.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `limit` | `number \| string` | none | Maximum body size ([Size Limits](#size-limits)) |
| `cache` | `boolean` | always on | The parser caches the raw bytes whatever this says |
| `strict` | `boolean` | `true` | Only accept objects and arrays; any other JSON value answers `400` |
| `reviver` | `(key: string, value: unknown) => unknown` | none | Passed to `JSON.parse` |
| `type` | `string \| string[]` | `'application/json'` | Content types to parse |

With `strict: false`, a primitive or `null` is the result of `readRequestBody()`, and a keyed read of it resolves to `undefined`.

### `urlEncoded`

The URL-encoded parser of `readRequestBody()`, for HTML forms. Fields that appear more than once become arrays (`tag=a&tag=b` gives `{ tag: ['a', 'b'] }`); bracket keys such as `user[name]` stay flat keys and are not expanded into nested objects.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `limit` | `number \| string` | none | Maximum body size ([Size Limits](#size-limits)) |
| `cache` | `boolean` | always on | The parser caches the raw bytes whatever this says |
| `parameterLimit` | `number` | `1000` | Maximum number of fields; more answer `413` |
| `type` | `string \| string[]` | `'application/x-www-form-urlencoded'` | Content types to parse |

### `raw`

Default options of `readRequestBodyBytes()`, `readRequestBodyArrayBuffer()` and `readRequestBodyBlob()` when they are called without options. Without `raw`, they read without a limit.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `limit` | `number \| string` | none | Maximum body size ([Size Limits](#size-limits)) |
| `cache` | `boolean` | `false` | Keep the raw bytes for later reads ([Caching the Bytes](#caching-the-bytes)) |
| `type` | `string \| string[]` | `'application/octet-stream'` | Declared, but not checked: the helpers read any content type |

### `text`

Default options of `readRequestBodyText()` when it is called without options. Without `text`, it reads without a limit and decodes UTF-8.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `limit` | `number \| string` | none | Maximum body size ([Size Limits](#size-limits)) |
| `cache` | `boolean` | `false` | Keep the raw bytes for later reads ([Caching the Bytes](#caching-the-bytes)) |
| `defaultCharset` | `string` | `'utf-8'` | Charset passed to `TextDecoder`; the request's `charset` parameter is not read |
| `type` | `string \| string[]` | `'text/plain'` | Declared, but not checked: the helper reads any content type |
