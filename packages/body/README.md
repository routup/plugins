<p align="center">
    <img src="./assets/logo.svg" alt="@routup/body logo: four coloured tiles, one per body format" width="128" height="128" />
</p>

<h1 align="center">@routup/body</h1>

<p align="center">
    <b>Read the request body of a routup app as parsed JSON or form data, text, bytes, a Blob or a stream.</b><br>
    You stop writing buffering, size limits, decompression and content-type checks; the parsed body is cached for the request.
</p>

<p align="center">
    <a href="https://www.npmjs.com/package/@routup/body"><img src="https://img.shields.io/npm/v/@routup/body" alt="npm version" /></a>
    <a href="https://github.com/routup/plugins/actions/workflows/main.yml"><img src="https://github.com/routup/plugins/actions/workflows/main.yml/badge.svg" alt="CI" /></a>
    <a href="https://codecov.io/gh/routup/plugins"><img src="https://codecov.io/gh/routup/plugins/branch/master/graph/badge.svg" alt="Coverage" /></a>
    <a href="https://snyk.io/test/github/routup/plugins"><img src="https://snyk.io/test/github/routup/plugins/badge.svg" alt="Known Vulnerabilities" /></a>
</p>

<p align="center">
    <a href="#installation"><b>Installation</b></a>
    ·
    <a href="#usage">Usage</a>
    ·
    <a href="#options">Options</a>
    ·
    <a href="#api">API</a>
    ·
    <a href="https://plugins.routup.dev/body/">Docs</a>
</p>

---

## Why @routup/body?

`await event.request.json()` works for one JSON endpoint. Once the same route also accepts HTML forms, needs a size limit, receives gzip-compressed webhooks or reads the body in two places, you end up writing the buffering and error handling yourself.

| Concern | Without it | With @routup/body |
|---------|------------|-------------------|
| Content types | Branch on `content-type` and call `request.json()` or `request.formData()` | `readRequestBody(event)` picks the JSON or URL-encoded parser from the header |
| Size limits | Count bytes while reading the stream, abort and answer 413 | `limit: '1mb'`; checked against `content-length` first, then against the decoded bytes, 413 when exceeded |
| Compression | Pipe through a `DecompressionStream` per `content-encoding` | `gzip`, `deflate`, `deflate-raw` and `br` are decoded; any other encoding answers 415 |
| Reading twice | The `Request` body stream can only be consumed once | The parsed body is cached on `event.store`; raw bytes are cached with `cache: true` |
| Bad input | `JSON.parse` throws a plain error, which becomes a 500 | Malformed JSON and bare primitives in strict mode answer 400, too many form fields answer 413 |

```typescript
import { App, defineCoreHandler, serve } from 'routup';
import { body, readRequestBody } from '@routup/body';

const app = new App();

app.use(body({ json: { limit: '1mb' }, urlEncoded: true }));

app.post('/users', defineCoreHandler(async (event) => {
    // the same handler for a JSON client and an HTML <form>
    const email = await readRequestBody(event, 'email');

    return { email };
}));

serve(app, { port: 3000 });
```

**Table of Contents**

- [Installation](#installation)
- [Usage](#usage)
  - [Parse JSON and form bodies](#parse-json-and-form-bodies)
  - [Limit the body size](#limit-the-body-size)
  - [Read text, bytes, an ArrayBuffer or a Blob](#read-text-bytes-an-arraybuffer-or-a-blob)
  - [Stream large bodies](#stream-large-bodies)
  - [Read the body more than once](#read-the-body-more-than-once)
- [Options](#options)
- [API](#api)
  - [readRequestBody](#readrequestbody)
  - [setRequestBody](#setrequestbody)
  - [readRequestBodyText](#readrequestbodytext)
  - [readRequestBodyBytes](#readrequestbodybytes)
  - [readRequestBodyArrayBuffer](#readrequestbodyarraybuffer)
  - [readRequestBodyBlob](#readrequestbodyblob)
  - [readRequestBodyStream](#readrequestbodystream)
  - [readRequestBodyRaw](#readrequestbodyraw)
- [Notes](#notes)
- [License](#license)

## Installation

```bash
npm install @routup/body
```

The package is ESM only, requires Node.js >= 24 and has `routup@^6.3.0` as a peer dependency.

## Usage

### Parse JSON and form bodies

```typescript
import { App, defineCoreHandler, serve } from 'routup';
import { body, readRequestBody } from '@routup/body';

const app = new App();

// parses requests with Content-Type:
// application/json
// application/x-www-form-urlencoded
app.use(body());

app.post('/', defineCoreHandler(async (event) => {
    const data = await readRequestBody(event);

    return data;
}));

serve(app, { port: 3000 });
```

- `body()` with no options enables `json` and `urlEncoded`. It only stores the options on the event; nothing is read until a helper is called.
- `readRequestBody(event)` tries the JSON parser first, then the URL-encoded one, and returns `{}` when neither matches the request's `content-type`.
- `readRequestBody(event, 'email')` returns a single own property of the parsed body, and `undefined` when the body is an array, a primitive or `null`.
- The parsed result is cached for the rest of the request: a second call returns the same object.

### Limit the body size

```typescript
import { App } from 'routup';
import { body } from '@routup/body';

const app = new App();

app.use(body({
    json: { limit: '1mb', strict: true },
    urlEncoded: { limit: '100kb', parameterLimit: 1000 },
}));
```

- `limit` accepts a number of bytes or a string with the unit `b`, `kb`, `mb` or `gb` (1024-based, case-insensitive).
- A `content-length` above the limit is rejected before reading. The limit is checked again against the actual, decompressed bytes while the stream is read, so a missing or wrong `content-length` does not bypass it. Both cases answer 413.

### Read text, bytes, an ArrayBuffer or a Blob

```typescript
import { App, defineCoreHandler } from 'routup';
import {
    body,
    readRequestBodyBlob,
    readRequestBodyBytes,
    readRequestBodyText,
} from '@routup/body';

const app = new App();

app.use(body({
    raw: { limit: '5mb' },
    text: { limit: '100kb', defaultCharset: 'utf-8' },
}));

app.post('/webhook', defineCoreHandler(async (event) => {
    const payload = await readRequestBodyText(event);

    return { length: payload.length };
}));

app.post('/upload', defineCoreHandler(async (event) => {
    const bytes = await readRequestBodyBytes(event);

    return { size: bytes.byteLength };
}));

app.post('/file', defineCoreHandler(async (event) => {
    const blob = await readRequestBodyBlob(event);

    return { type: blob.type, size: blob.size };
}));
```

- The `raw` and `text` options are defaults for these helpers (`raw` for `readRequestBodyBytes`, `readRequestBodyArrayBuffer` and `readRequestBodyBlob`, `text` for `readRequestBodyText`). The helpers also work when the option is not set, then without a limit.
- Options passed to a helper replace the plugin options for that call: `readRequestBodyText(event, { limit: '10kb' })`.
- These helpers read the body regardless of its `content-type`.
- Passing `raw` or `text` alone turns the JSON and URL-encoded defaults off; set them explicitly, as in this sample, if `readRequestBody` should still parse.

### Stream large bodies

```typescript
import { App, defineCoreHandler } from 'routup';
import { readRequestBodyStream } from '@routup/body';

declare function saveToDisk(stream: ReadableStream): Promise<void>;

const app = new App();

app.post('/upload', defineCoreHandler(async (event) => {
    const stream = readRequestBodyStream(event, { limit: '50mb' });

    if (stream) {
        await saveToDisk(stream);
    }

    return { ok: true };
}));
```

- The stream is decompressed according to `content-encoding` and neither buffered nor cached.
- `limit` is only checked against the `content-length` header here; the bytes are not counted.
- Returns `null` when the request has no body.

### Read the body more than once

```typescript
import { App, defineCoreHandler } from 'routup';
import { body, readRequestBody, readRequestBodyText } from '@routup/body';

const app = new App();

app.use(body({ json: true, text: { cache: true } }));

app.post('/signed', defineCoreHandler(async (event) => {
    const data = await readRequestBody(event);
    // reuses the raw bytes cached by the JSON parser
    const raw = await readRequestBodyText(event);

    return { data, raw };
}));
```

- The JSON and URL-encoded parsers always cache the raw bytes on `event.store`.
- The other helpers read the cache, and write to it, only with `cache: true`. Without it a second read of an already consumed body throws (`ReadableStream is locked`) and the request answers 500.
- Leave `cache` off for large uploads so the bytes are not held in memory for the whole request.

## Options

`body(options?)` takes one entry per format. Each entry is an options object, `true` (enabled with defaults) or `false`. When you pass no entry at all, `json` and `urlEncoded` are enabled; as soon as you pass one, the others stay off unless you set them.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `json` | `JsonOptions \| boolean` | `true` | Parse `application/json` in `readRequestBody` |
| `urlEncoded` | `UrlEncodedOptions \| boolean` | `true` | Parse `application/x-www-form-urlencoded` in `readRequestBody` |
| `raw` | `RawOptions \| boolean` | `false` | Defaults for `readRequestBodyBytes`, `readRequestBodyArrayBuffer`, `readRequestBodyBlob` |
| `text` | `TextOptions \| boolean` | `false` | Defaults for `readRequestBodyText` |

Every options object accepts the base options:

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `limit` | `number \| string` | none | Maximum body size in bytes, or a string such as `'100kb'`, `'1mb'` |
| `cache` | `boolean` | `false` | Keep the raw bytes on `event.store` for later reads (always on for `json` and `urlEncoded`) |

**`JsonOptions`**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `strict` | `boolean` | `true` | Only accept objects and arrays; anything else answers 400 |
| `reviver` | `(key: string, value: unknown) => unknown` | none | Passed to `JSON.parse` |
| `type` | `string \| string[]` | `'application/json'` | Content types to parse |

**`UrlEncodedOptions`**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `parameterLimit` | `number` | `1000` | Maximum number of fields; more answer 413 |
| `type` | `string \| string[]` | `'application/x-www-form-urlencoded'` | Content types to parse |

**`TextOptions`**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `defaultCharset` | `string` | `'utf-8'` | Charset passed to `TextDecoder` |
| `type` | `string \| string[]` | `'text/plain'` | Declared, but not checked by `readRequestBodyText` |

**`RawOptions`**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `type` | `string \| string[]` | `'application/octet-stream'` | Declared, but not checked by the raw helpers |

## API

| Export | Kind | Purpose |
|--------|------|---------|
| `body` (also the default export) | function | Create the plugin |
| `readRequestBody` | function | Parsed JSON or URL-encoded body, cached per request |
| `setRequestBody` | function | Provide the parsed body yourself; `readRequestBody` returns it from then on |
| `readRequestBodyText` | function | Body as a string |
| `readRequestBodyBytes` | function | Body as a `Uint8Array` |
| `readRequestBodyArrayBuffer` | function | Body as an `ArrayBuffer` |
| `readRequestBodyBlob` | function | Body as a `Blob` |
| `readRequestBodyStream` | function | Body as a decompressed `ReadableStream` |
| `readRequestBodyRaw` | function | Low-level reader behind the buffered helpers |
| `Options`, `BaseOptions`, `JsonOptions`, `UrlEncodedOptions`, `TextOptions`, `RawOptions` | type | Option shapes |

The [helpers page](https://plugins.routup.dev/body/helpers) and the [configuration page](https://plugins.routup.dev/body/configuration) of the docs cover the same reference.

### `readRequestBody`

Returns the parsed request body (JSON or URL-encoded). The result is cached after the first call. Needs the `body()` plugin: without it no parser is enabled and the result is `{}`.

With a `key`, it returns a single property of the body, but only an own property of an object body (e.g. a parsed JSON object). A keyed read resolves to `undefined` for an array (`readRequestBody(event, '0')`), a primitive or `null` (e.g. with `json: { strict: false }`), and for an inherited member such as `constructor`.

```typescript
declare function readRequestBody(
    event: IAppEvent,
): Promise<Record<string, any>>;

declare function readRequestBody(
    event: IAppEvent,
    key: string,
): Promise<any | undefined>;
```

URL-encoded fields that appear more than once become arrays (`tag=a&tag=b` gives `{ tag: ['a', 'b'] }`); keys are not expanded into nested objects.

### `setRequestBody`

Provides the parsed body, e.g. from your own body reader (a bounded read with custom 413/415 rules). `readRequestBody()` and `@DBody()` of `@routup/decorators` return this value from then on and never read the request stream. Setting it after a first read replaces the parsed body, and a read that is still parsing when it is set resolves to the provided value, even when the request body fails to parse.

```typescript
declare function setRequestBody(
    event: IAppEvent,
    value: unknown,
): void;
```

```typescript
import { setRequestBody } from '@routup/body';
import { defineCoreHandler } from 'routup';

app.use(defineCoreHandler(async (event) => {
    setRequestBody(event, await myBodyReader(event));

    return event.next();
}));
```

### `readRequestBodyText`

Returns the request body as a string, decoded with `defaultCharset`.

```typescript
declare function readRequestBodyText(
    event: IAppEvent,
    options?: TextOptions,
): Promise<string>;
```

### `readRequestBodyBytes`

Returns the request body as a `Uint8Array`.

```typescript
declare function readRequestBodyBytes(
    event: IAppEvent,
    options?: RawOptions,
): Promise<Uint8Array>;
```

### `readRequestBodyArrayBuffer`

Returns the request body as an `ArrayBuffer`.

```typescript
declare function readRequestBodyArrayBuffer(
    event: IAppEvent,
    options?: BaseOptions,
): Promise<ArrayBuffer>;
```

### `readRequestBodyBlob`

Returns the request body as a `Blob`. The blob's `type` is the request's `content-type` header, or `application/octet-stream` when there is none.

```typescript
declare function readRequestBodyBlob(
    event: IAppEvent,
    options?: BaseOptions,
): Promise<Blob>;
```

### `readRequestBodyStream`

Returns the request body as a `ReadableStream`, decompressed if the `content-encoding` header indicates compression (`gzip`, `deflate`, `deflate-raw`, `br`). It does not buffer or cache, which makes it the choice for piping large bodies without holding them in memory.

```typescript
declare function readRequestBodyStream(
    event: IAppEvent,
    options?: BaseOptions,
): ReadableStream | null;
```

### `readRequestBodyRaw`

Collects the decompressed stream into a `Uint8Array`, enforces `limit` on the decoded bytes and reads or writes the byte cache when `cache` is `true`. It does not fall back to the plugin's `raw` options; the other buffered helpers are built on it.

```typescript
declare function readRequestBodyRaw(
    event: IAppEvent,
    options?: BaseOptions,
): Promise<Uint8Array>;
```

## Notes

- **Passing any option disables the defaults.** `body({ text: true })` enables only `text`; `readRequestBody` then returns `{}`. Add `json: true, urlEncoded: true` to keep them.
- **A request without `content-type` is treated as JSON.** routup's content-type matcher accepts a missing header, so the JSON parser runs first and a non-JSON body answers 400.
- **Content types are compared exactly.** The media type before `;` must equal one of `type`; parameters such as `charset` are ignored, wildcards such as `application/*+json` are not supported (list them in `type`).
- **An empty JSON body is `{}`**, not an error.
- **The body stream is consumed once.** After `readRequestBodyStream` or an uncached buffered read, other helpers cannot read the body again; see [Read the body more than once](#read-the-body-more-than-once).
- **Error responses:** 400 for malformed JSON or a primitive in strict mode, 413 for a body over `limit` or more fields than `parameterLimit`, 415 for an unsupported `content-encoding` or one the runtime's `DecompressionStream` does not support (`br` is not available everywhere).
- **The plugin does not parse `multipart/form-data`.** Use `event.request.formData()` for file uploads from forms.

## License

Made with 💚

Published under [MIT License](https://github.com/routup/plugins/blob/master/LICENSE).
