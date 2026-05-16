# @routup/body

[![npm version](https://badge.fury.io/js/@routup%2Fbody.svg)](https://badge.fury.io/js/@routup%2Fbody)
[![main](https://github.com/routup/plugins/actions/workflows/main.yml/badge.svg)](https://github.com/routup/plugins/actions/workflows/main.yml)
[![codecov](https://codecov.io/gh/routup/plugins/branch/master/graph/badge.svg)](https://codecov.io/gh/routup/plugins)
[![Known Vulnerabilities](https://snyk.io/test/github/routup/plugins/badge.svg)](https://snyk.io/test/github/routup/plugins)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-%23FE5196?logo=conventionalcommits&logoColor=white)](https://conventionalcommits.org)

This is a plugin for reading and parsing the request payload.

**Table of Contents**

- [Installation](#installation)
- [Documentation](#documentation)
- [Usage](#usage)
- [Options](#options)
  - [json](#json)
  - [urlEncoded](#urlencoded)
  - [raw](#raw)
  - [text](#text)
- [Helpers](#helpers)
  - [readRequestBody](#readrequestbody)
  - [readRequestBodyText](#readrequestbodytext)
  - [readRequestBodyBytes](#readrequestbodybytes)
  - [readRequestBodyArrayBuffer](#readrequestbodyarraybuffer)
  - [readRequestBodyBlob](#readrequestbodyblob)
  - [readRequestBodyStream](#readrequestbodystream)
- [License](#license)

## Installation

```bash
npm install @routup/body --save
```

## Documentation

To read the docs, visit [https://routup.net](https://routup.net)

## Usage

For standard use, the package is installed as a plugin, as shown below.

```typescript
import {
    App,
    defineCoreHandler,
    serve,
} from 'routup';
import { body, readRequestBody } from '@routup/body';

const router = new App();

// This will parse requests with Content-Type:
// application/json
// application/x-www-form-urlencoded
router.use(body());

router.post('/', defineCoreHandler(async (event) => {
    const data = await readRequestBody(event);
    console.log(data);

    return data;
}));

serve(router, { port: 3000 });
```

## Options

The plugin accepts an object as input parameter to modify the default behaviour.
By default, `json` and `urlEncoded` are enabled.

### `json`

To parse `application/json` input data.

- Type: `JsonOptions | boolean`
- Default: `true`

```typescript
router.use(body({
    json: {
        limit: '1mb',
        strict: true,
    }
}));
```

**JsonOptions:**

| Property | Type | Default | Description |
|---|---|---|---|
| `limit` | `number \| string` | none | Maximum body size (bytes or string like `'1mb'`) |
| `strict` | `boolean` | `true` | Only accept arrays and objects |
| `reviver` | `function` | `undefined` | A reviver function passed to `JSON.parse` |
| `type` | `string \| string[]` | `'application/json'` | Content-types to parse |

### `urlEncoded`

To parse `application/x-www-form-urlencoded` input data.

- Type: `UrlEncodedOptions | boolean`
- Default: `true`

```typescript
router.use(body({
    urlEncoded: {
        limit: '100kb',
        parameterLimit: 1000,
    }
}));
```

**UrlEncodedOptions:**

| Property | Type | Default | Description |
|---|---|---|---|
| `limit` | `number \| string` | none | Maximum body size |
| `parameterLimit` | `number` | `1000` | Maximum number of parameters |
| `type` | `string \| string[]` | `'application/x-www-form-urlencoded'` | Content-types to parse |

### `raw`

Configure options for raw body reading (used by `readRequestBodyBytes`, `readRequestBodyArrayBuffer`, `readRequestBodyBlob`).

- Type: `RawOptions | boolean`
- Default: `false`

```typescript
router.use(body({
    raw: {
        limit: '5mb',
    }
}));
```

### `text`

Configure options for text body reading (used by `readRequestBodyText`).

- Type: `TextOptions | boolean`
- Default: `false`

```typescript
router.use(body({
    text: {
        limit: '100kb',
        defaultCharset: 'utf-8',
    }
}));
```

**TextOptions:**

| Property | Type | Default | Description |
|---|---|---|---|
| `limit` | `number \| string` | none | Maximum body size |
| `defaultCharset` | `string` | `'utf-8'` | Default charset if not specified in content-type |
| `type` | `string \| string[]` | `'text/plain'` | Content-types to parse |

## Helpers

### `readRequestBody`

Returns the parsed request body (JSON or URL-encoded). The result is cached after the first call.

```typescript
declare function readRequestBody(
    event: IAppEvent,
) : Promise<Record<string, any>>;

declare function readRequestBody(
    event: IAppEvent,
    key: string,
) : Promise<any | undefined>;
```

### `readRequestBodyText`

Returns the request body as a string.

```typescript
declare function readRequestBodyText(
    event: IAppEvent,
    options?: TextOptions,
) : Promise<string>;
```

### `readRequestBodyBytes`

Returns the request body as a `Uint8Array`.

```typescript
declare function readRequestBodyBytes(
    event: IAppEvent,
    options?: RawOptions,
) : Promise<Uint8Array>;
```

### `readRequestBodyArrayBuffer`

Returns the request body as an `ArrayBuffer`.

```typescript
declare function readRequestBodyArrayBuffer(
    event: IAppEvent,
    options?: BaseOptions,
) : Promise<ArrayBuffer>;
```

### `readRequestBodyBlob`

Returns the request body as a `Blob`.

```typescript
declare function readRequestBodyBlob(
    event: IAppEvent,
    options?: BaseOptions,
) : Promise<Blob>;
```

### `readRequestBodyStream`

Returns the request body as a `ReadableStream`, decompressed if the `content-encoding` header indicates compression (gzip, deflate, brotli). Does not buffer or cache — useful for piping large bodies without holding them in memory.

```typescript
declare function readRequestBodyStream(
    event: IAppEvent,
    options?: BaseOptions,
) : ReadableStream | null;
```

## License

Made with 💚

Published under [MIT License](./LICENSE).
