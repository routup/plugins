---
title: Body — Helpers
description: Tree-shakeable helpers for reading parsed and raw request bodies.
relatedPlugins: [basic]
---

# Helpers

Each helper takes the routup event as its first argument. All buffered helpers cache their result on `event.store`, so subsequent calls within the same request return the cached value.

## `readRequestBody`

Returns the parsed body (JSON or URL-encoded). Pass a `key` to extract a single field.

```typescript
declare function readRequestBody(
    event: IAppEvent,
): Promise<Record<string, any>>;

declare function readRequestBody(
    event: IAppEvent,
    key: string,
): Promise<any | undefined>;
```

```typescript
const body = await readRequestBody(event);
const email = await readRequestBody(event, 'email');
```

## `readRequestBodyText`

Returns the body decoded as a string.

```typescript
declare function readRequestBodyText(
    event: IAppEvent,
    options?: TextOptions,
): Promise<string>;
```

Requires `body({ text: true })` (or a `text` config block) on the router.

## `readRequestBodyBytes`

Returns the body as a `Uint8Array`.

```typescript
declare function readRequestBodyBytes(
    event: IAppEvent,
    options?: RawOptions,
): Promise<Uint8Array>;
```

Requires `body({ raw: true })`.

## `readRequestBodyArrayBuffer`

Returns the body as an `ArrayBuffer`.

```typescript
declare function readRequestBodyArrayBuffer(
    event: IAppEvent,
    options?: BaseOptions,
): Promise<ArrayBuffer>;
```

## `readRequestBodyBlob`

Returns the body as a `Blob` — the `Blob`'s `type` reflects the request `Content-Type`.

```typescript
declare function readRequestBodyBlob(
    event: IAppEvent,
    options?: BaseOptions,
): Promise<Blob>;
```

## `readRequestBodyStream`

Returns the body as a `ReadableStream`, with transparent decoding when the `Content-Encoding` header indicates `gzip`, `deflate`, or `br`. **Does not buffer or cache** — useful for piping large bodies straight to disk, S3, etc.

```typescript
declare function readRequestBodyStream(
    event: IAppEvent,
    options?: BaseOptions,
): ReadableStream | null;
```

Returns `null` when the request has no body.
