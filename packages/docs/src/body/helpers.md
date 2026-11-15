---
title: Body — Helpers
description: Tree-shakeable helpers for reading parsed and raw request bodies.
relatedPlugins: [basic]
---

# Helpers

Each helper takes the routup event as its first argument. All buffered helpers cache their result on `event.store`, so subsequent calls within the same request return the cached value.

## `readRequestBody`

Returns the parsed body (JSON or URL-encoded). Pass a `key` to extract a single field. A keyed read returns the value only for an own property of an object body (e.g. a parsed JSON object). It resolves to `undefined` for an array (`readRequestBody(event, '0')`), a primitive or `null` (e.g. with `json: { strict: false }`), and for an inherited member such as `constructor`.

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

## `setRequestBody`

Provides the parsed body, e.g. from your own body reader (a bounded read with custom 413/415 rules). `readRequestBody()` and [`@DBody()`](/decorators/parameters) return this value from then on and never read the request stream. Setting it after a first read replaces the parsed body, and a read that is still parsing when it is set resolves to the provided value.

```typescript
declare function setRequestBody(
    event: IAppEvent,
    value: unknown,
): void;
```

```typescript
router.use(defineCoreHandler(async (event) => {
    setRequestBody(event, await myBodyReader(event));

    return event.next();
}));
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
