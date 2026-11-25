<div align="center">

<img src="./assets/logo.svg" alt="@routup/body logo: four coloured tiles, one per body format" width="128" height="128" />

<h1>@routup/body</h1>

</div>

[![npm version](https://img.shields.io/npm/v/@routup/body)](https://www.npmjs.com/package/@routup/body)
[![CI](https://github.com/routup/plugins/actions/workflows/main.yml/badge.svg)](https://github.com/routup/plugins/actions/workflows/main.yml)
[![Coverage](https://codecov.io/gh/routup/plugins/branch/master/graph/badge.svg)](https://codecov.io/gh/routup/plugins)
[![Known Vulnerabilities](https://snyk.io/test/github/routup/plugins/badge.svg)](https://snyk.io/test/github/routup/plugins)

**Read the request body of a routup app as parsed JSON or form data, text, bytes, a Blob or a stream.**

You stop writing buffering, size limits, decompression and content-type checks; the parsed body is cached for the request.

[Docs](https://plugins.routup.dev/body/) · [Configuration](https://plugins.routup.dev/body/configuration) · [Helpers](https://plugins.routup.dev/body/helpers) · [Recipes](https://plugins.routup.dev/body/recipes)

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

## Installation

```bash
npm install @routup/body
```

ESM only, Node.js >=24. Peer dependency: `routup@^6.5.1`.

## Quick Start

```typescript
import { App, defineCoreHandler } from 'routup';
import { body, readRequestBody } from '@routup/body';

export const app = new App();

// parses application/json and application/x-www-form-urlencoded bodies
app.use(body());

app.post('/users', defineCoreHandler(async (event) => {
    // the same handler for a JSON client and an HTML <form>
    const email = await readRequestBody(event, 'email');

    return { email };
}));
```

The sample exports the app; [serve it](https://routup.dev/guide/quickstart) from your entry file. `body()` only stores its options; `readRequestBody()` parses the body on its first call, picking the JSON or URL-encoded parser by `content-type`, and caches the result for the request.

## Documentation

The full reference lives on [plugins.routup.dev](https://plugins.routup.dev/body/):

- [Overview](https://plugins.routup.dev/body/): requirements, default behaviour, content types, compression and error responses
- [Configuration](https://plugins.routup.dev/body/configuration): the four formats, size limits, caching and each parser's options
- [Helpers](https://plugins.routup.dev/body/helpers): `readRequestBody()`, `setRequestBody()`, the text, byte, Blob and stream readers, and the types
- [Recipes](https://plugins.routup.dev/body/recipes): a JSON size limit, an HTML form, a signed webhook, a text upload, a limit per path

## License

Made with 💚

Published under [MIT License](https://github.com/routup/plugins/blob/master/LICENSE).
