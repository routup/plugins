---
title: Logger Configuration
description: Options, preset formats and built-in tokens of the logger.
relatedPlugins: []
---

# Configuration

`logger()` takes an options object, or a format followed by an options object: `logger(options?)` or `logger(format, options?)`. In the second form, `format` wins over `options.format`. Every option is optional.

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `format` | `string \| Formatter` | `'tiny'` | A preset name, a format string or a function that builds the line |
| `skip` | `(event, response) => boolean` | none | Return `true` to write no line for the request |
| `write` | `(line: string) => void` | `console.log` | Where each line goes |
| `immediate` | `boolean` | `false` | Write the line when the request arrives instead of after the response |
| `tokens` | `Record<string, Token>` | `{}` | Extra tokens, merged over the built-in ones |

### `format`

A preset name, a format string, or a [`Formatter`](/logger/helpers#types) function `(tokens, event, response) => string | undefined` that returns the line; `undefined` writes nothing for that request. Any value that is neither a string nor a function falls back to `'tiny'`.

| Preset | Format |
|--------|--------|
| `tiny` | `:method :url :status :res[content-length] - :response-time ms` |
| `short` | `:remote-addr :remote-user :method :url HTTP/:http-version :status :res[content-length] - :response-time ms` |
| `common` | `:remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length]` |
| `combined` | `:remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"` |
| `dev` | `:method :url :status :response-time ms - :res[content-length]`, the status coloured by range: red `5xx`, yellow `4xx`, cyan `3xx`, green `2xx` |

`common` and `combined` are the Apache common and combined log formats. `dev` writes ANSI colour codes, so use it for a terminal, not a log file.

In a format string, a token is `:name` or `:name[arg]`, where the name is at least two letters, digits, `_` or `-`. Any other text is copied as is. An unknown token, or a token that returns `undefined`, renders as `-`. [Custom Format and Tokens](/logger/recipes#custom-format-and-tokens) combines both.

### `skip`

Called before the line is formatted, with the event and the `Response`; return `true` to write nothing. The response is `undefined` with `immediate`, and when the logger received none (see [Default Behaviour](/logger/#default-behaviour)). [Skip Requests](/logger/recipes#skip-requests) skips health checks and successful responses.

### `write`

Receives each line, without a trailing newline. An error it throws is swallowed, so a failing log sink does not fail the request. [Write to a File](/logger/recipes#write-to-a-file) appends to a file stream.

### `immediate`

Writes the line when the request reaches the logger, before any route runs. There is no `Response` yet, so `:status` and `:res[*]` render `-` and `:response-time` is close to `0`. Use it to see requests that never finish.

### `tokens`

Extra tokens, `(event, response, arg) => string | undefined`, where `arg` is the text in brackets. They are merged over the built-in tokens, so they add names and can replace a built-in one.

| Token | Renders |
|-------|---------|
| `:method` | HTTP method |
| `:url` | Path and query string of the request URL |
| `:status` | Response status code |
| `:response-time[digits]` | Milliseconds since the logger handler started, with `digits` decimals (default `3`) |
| `:total-time[digits]` | Same as `:response-time` |
| `:date[format]` | Current time: `web` (default, `toUTCString()`), `iso` (`toISOString()`) or `clf` (`10/Oct/2000:13:55:36 +0000`, UTC) |
| `:remote-addr` | Client address from routup's `getRequestIP()`, which follows the app's `trustProxy` option |
| `:remote-user` | User name from an `Authorization: Basic` header |
| `:user-agent` | `User-Agent` header |
| `:referrer` | `Referer` header, or `Referrer` |
| `:http-version` | `httpVersion` of the request when the runtime sets one, otherwise `1.1`; a Web `Request` has none, so it is usually `1.1` |
| `:req[name]` | Request header `name` |
| `:res[name]` | Response header `name` |
| `:pid` | Process id, `0` where `process` does not exist |

Every token renders `-` when its value is missing.
