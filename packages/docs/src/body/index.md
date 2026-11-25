---
title: Body
description: Read and parse the request payload as JSON, URL-encoded form data, raw bytes, text, a Blob or a stream.
relatedPlugins: [basic, decorators]
plugin:
    package: '@routup/body'
    summary: 'Parse JSON, form and raw bodies.'
    group: 'Request & response'
    order: 1
---

# @routup/body

Reads the request body of a routup app as parsed JSON or form data, text, bytes, a Blob or a stream. The plugin takes care of size limits, decompression and content-type checks, and caches the parsed body for the rest of the request.

## Requirements

- Node.js 24 or later, ESM only
- `routup` `^6.5.0` (peer dependency)

## Installation

```bash
npm install @routup/body
```

## Quick Start

<<< @/../examples/body/quick-start.ts

`body()` is a plugin: register it with `app.use()` before the routes that read the body ([Plugins](https://routup.dev/guide/plugins)). The file exports the app; [serve it](https://routup.dev/guide/quickstart) from your entry file.

```bash
curl -X POST http://localhost:3000/users -H 'content-type: application/json' -d '{"email":"ada@example.com"}'
# {"email":"ada@example.com"}
curl -X POST http://localhost:3000/users -d 'email=ada@example.com'
# {"email":"ada@example.com"}
```

## Default Behaviour

| Step | What happens |
|------|--------------|
| Register | `body()` with no format set enables `json` and `urlEncoded`; it only stores the options on the request, nothing is read yet |
| Read | The first `readRequestBody(event)` tries the JSON parser, then the URL-encoded one, by the request's `content-type` |
| No match | When neither parser matches, or neither is enabled, the result is `{}` |
| Cache | The parsed body is kept for the request: a second call returns the same object without reading again |
| Other formats | `readRequestBodyText()`, `readRequestBodyBytes()` and the other helpers read the body whatever its `content-type` ([Helpers](/body/helpers)) |

As soon as you set one format, the others stay off unless you set them too: `body({ text: true })` parses no JSON ([Configuration](/body/configuration)).

### Content Types

- A request without a `content-type` header matches every parser. With `json` enabled it is parsed as JSON, and a body that is not JSON answers `400`; with only `urlEncoded` enabled it is parsed as a form.
- The media type before `;` must match one of the parser's `type` values; parameters such as `charset` and case are ignored. A value may be a pattern such as `application/*+json` (JSON:API and other `+json` types) or `text/*`; an extension such as `json` is compared exactly.
- `multipart/form-data` is not parsed. Use `event.request.formData()` for file uploads from forms.

### Compression

A body with `content-encoding` `gzip`, `deflate`, `deflate-raw` or `br` is decoded before it is parsed or returned. Any other encoding answers `415`, and so does one the runtime's `DecompressionStream` does not support (`br` is not available on every runtime).

### Error Responses

| Status | When |
|--------|------|
| `400` | Malformed JSON, or a JSON value that is not an object or array while `strict` is on |
| `413` | A body over `limit`, or more URL-encoded fields than `parameterLimit` |
| `415` | An unsupported `content-encoding` |
| `500` | Reading a body a second time without `cache` (`ReadableStream is locked`), or a `limit` string without a number |

The errors are thrown from the helper, so an [error handler](https://routup.dev/guide/error-handling) can answer them; otherwise routup's fallback response carries the status, for example `{"status":413,"message":"request entity too large"}`.

## Next Steps

- [Configuration](/body/configuration): the four formats and each parser's options
- [Helpers](/body/helpers): `readRequestBody()`, `setRequestBody()`, the text, byte, Blob and stream readers, and the types
- [Recipes](/body/recipes): a JSON size limit, an HTML form, a signed webhook, a text upload, a limit per path
- [Combining Plugins](/guide/combining#body-cookie-and-query): `@routup/basic` registers `body()`, `cookie()` and `query()` in one call
