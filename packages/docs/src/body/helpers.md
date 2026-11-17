---
title: Body Helpers
description: Functions and types exported by @routup/body for reading parsed and raw request bodies.
relatedPlugins: [basic]
---

# Helpers and API

Everything `@routup/body` exports. Each helper takes the routup event first and can be called from any handler; options are on [Configuration](/body/configuration).

## `body()`

Creates the plugin. It is also the default export.

```typescript
declare function body(options?: Options): Plugin;
```

## `readRequestBody()`

Returns the parsed JSON or URL-encoded body; with a key, one property of it. The first call parses, later calls return the cached result.

```typescript
declare function readRequestBody(
    event: IAppEvent,
): Promise<Record<string, any>>;

declare function readRequestBody(
    event: IAppEvent,
    key: string,
): Promise<any | undefined>;
```

- Without the `body()` plugin no parser is enabled and the result is `{}`.
- A keyed read resolves only an own property of an object body. It resolves to `undefined` for an array (`readRequestBody(event, '0')`), a primitive or `null` (possible with `json: { strict: false }`), and for an inherited member such as `constructor`.

## `setRequestBody()`

Provides the parsed body, for example from your own reader for a format the plugin does not parse. `readRequestBody()` and `@DBody()` of [`@routup/decorators`](/decorators/) return this value from then on and do not read the request body.

```typescript
declare function setRequestBody(
    event: IAppEvent,
    value: unknown,
): void;
```

<<< @/../examples/body/custom-reader.ts

Set after a first read, the value replaces the parsed body. A read that is still parsing when the value is set resolves to that value, even when the request body fails to parse.

## `readRequestBodyText()`

Returns the body as a string, decoded with `defaultCharset`.

```typescript
declare function readRequestBodyText(
    event: IAppEvent,
    options?: TextOptions,
): Promise<string>;
```

Without `options`, it uses the plugin's [`text`](/body/configuration#text) options; with them, those options replace the plugin's for this call. It reads the body whatever its `content-type`.

## `readRequestBodyBytes()`

Returns the body as a `Uint8Array`.

```typescript
declare function readRequestBodyBytes(
    event: IAppEvent,
    options?: RawOptions,
): Promise<Uint8Array>;
```

Without `options`, it uses the plugin's [`raw`](/body/configuration#raw) options; with them, those options replace the plugin's for this call. It reads the body whatever its `content-type`.

## `readRequestBodyArrayBuffer()`

Returns the body as an `ArrayBuffer`, for APIs such as Web Crypto that take a `BufferSource`. Options as for `readRequestBodyBytes()`.

```typescript
declare function readRequestBodyArrayBuffer(
    event: IAppEvent,
    options?: BaseOptions,
): Promise<ArrayBuffer>;
```

## `readRequestBodyBlob()`

Returns the body as a `Blob` whose `type` is the request's `content-type`, or `application/octet-stream` when there is none. Options as for `readRequestBodyBytes()`.

```typescript
declare function readRequestBodyBlob(
    event: IAppEvent,
    options?: BaseOptions,
): Promise<Blob>;
```

## `readRequestBodyStream()`

Returns the body as a `ReadableStream`, decoded according to `content-encoding`, without buffering or caching it; `null` when the request has no body.

```typescript
declare function readRequestBodyStream(
    event: IAppEvent,
    options?: BaseOptions,
): ReadableStream | null;
```

<<< @/../examples/body/stream.ts

- `limit` is only checked against the `content-length` header; the streamed bytes are not counted. Count them yourself when the header may be missing.
- `cache` has no effect, and the plugin's `raw` options are not used.
- Once the stream is read, no other helper can read the body.

## `readRequestBodyRaw()`

The reader behind the buffered helpers: collects the decoded stream into a `Uint8Array`, enforces `limit` on the decoded bytes, and reads or writes the byte cache when `cache` is `true`.

```typescript
declare function readRequestBodyRaw(
    event: IAppEvent,
    options?: BaseOptions,
): Promise<Uint8Array>;
```

Unlike `readRequestBodyBytes()`, it does not fall back to the plugin's `raw` options.

## Types

| Type | Definition |
|------|------------|
| `Options` | `{ json?, urlEncoded?, raw?, text? }`, each an options object or a boolean ([Configuration](/body/configuration)) |
| `BaseOptions` | `{ limit?: number \| string; cache?: boolean }`, the part every format shares |
| `JsonOptions` | `BaseOptions` plus `strict`, `reviver` and `type` ([`json`](/body/configuration#json)) |
| `UrlEncodedOptions` | `BaseOptions` plus `parameterLimit` and `type` ([`urlEncoded`](/body/configuration#urlencoded)) |
| `RawOptions` | `BaseOptions` plus `type` ([`raw`](/body/configuration#raw)) |
| `TextOptions` | `BaseOptions` plus `defaultCharset` and `type` ([`text`](/body/configuration#text)) |
