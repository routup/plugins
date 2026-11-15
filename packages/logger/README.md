<p align="center">
    <img src="https://cdn.jsdelivr.net/npm/@routup/logger@2/assets/logo.svg" alt="@routup/logger logo: printed log strip" width="128" height="128" />
</p>

<h1 align="center">@routup/logger</h1>

<p align="center">
    <b>Log one line per routup request, using morgan's token syntax and its tiny, short, common, combined and dev formats.</b><br>
    You stop timing requests and assembling access-log lines by hand; format strings you know from morgan keep working.
</p>

<p align="center">
    <a href="https://www.npmjs.com/package/@routup/logger"><img src="https://img.shields.io/npm/v/@routup/logger" alt="npm version" /></a>
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
    <a href="https://plugins.routup.dev/logger/">Docs</a>
</p>

---

## Why @routup/logger?

morgan is written for Node's `(req, res, next)` and hooks into `res.on('finish')`. A routup handler works with Web `Request` and `Response` objects, so morgan has nothing to attach to. The alternative is a handler of your own that records a start time, awaits `event.next()` and formats the line.

| Concern | Without it | With @routup/logger |
|---------|-----------|---------------------|
| Timing | Store `performance.now()` and subtract after `await event.next()` | `:response-time` renders the elapsed milliseconds (3 decimals by default) |
| Line format | Build each line with template strings | Format strings such as `':method :url :status'` and the five morgan presets |
| Request and response data | Read the IP, basic-auth user, headers and status yourself | Built-in tokens for each, `-` when a value is missing |
| Extra fields | Edit the template | `tokens: { user: (event) => ... }` adds `:user` |
| Output and noise | `console.log` in the handler, `if` around it | `write` picks the sink, `skip` drops requests (health checks, static files) |

```typescript
import { logger } from '@routup/logger';
import { App, defineCoreHandler } from 'routup';

const app = new App();

app.use(logger('dev'));

app.get('/', defineCoreHandler(() => 'ok'));
// GET / 200 0.412 ms - -
```

**Table of Contents**

- [Installation](#installation)
- [Usage](#usage)
  - [Logging requests](#logging-requests)
  - [Preset formats](#preset-formats)
  - [Format strings](#format-strings)
  - [Tokens](#tokens)
  - [Custom tokens](#custom-tokens)
  - [Formatter functions](#formatter-functions)
  - [Write target and skip](#write-target-and-skip)
- [Options](#options)
- [API](#api)
  - [compile](#compile)
  - [resolveFormat](#resolveformat)
  - [formatStrings](#formatstrings)
  - [defaultTokens](#defaulttokens)
  - [devFormatter](#devformatter)
- [Notes](#notes)
- [License](#license)

## Installation

```bash
npm install @routup/logger --save
```

ESM only, Node.js `>=22`, peer dependency `routup@^6.1.0`.

## Usage

### Logging requests

```typescript
import { logger } from '@routup/logger';
import { App, defineCoreHandler, serve } from 'routup';

const router = new App();

router.use(logger('tiny'));

router.get('/', defineCoreHandler(() => 'ok'));

serve(router, { port: 3000 });
```

- `logger()` returns a routup handler, not a `Plugin`. Pass it to `router.use()` like any other handler.
- Mount it before your routes. It wraps everything after it: it records the start time, awaits `event.next()`, then writes the line, so `:status`, `:response-time` and `:res[*]` see the resolved `Response`. Routes registered before it are not logged.
- `logger()` with no argument uses the `tiny` format and `console.log`.

### Preset formats

```typescript
import { logger } from '@routup/logger';
import { App } from 'routup';

const router = new App();

router.use(logger('combined'));
```

| Name | Format |
|------|--------|
| `combined` | `:remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"` |
| `common` | `:remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length]` |
| `short` | `:remote-addr :remote-user :method :url HTTP/:http-version :status :res[content-length] - :response-time ms` |
| `tiny` | `:method :url :status :res[content-length] - :response-time ms` |
| `dev` | `:method :url :status :response-time ms - :res[content-length]`, with the status coloured by range: red `5xx`, yellow `4xx`, cyan `3xx`, green `2xx` |

`combined` and `common` are the Apache combined and common log formats. `dev` writes ANSI colour codes, so use it for terminals, not log files.

### Format strings

```typescript
import { logger } from '@routup/logger';
import { App } from 'routup';

const router = new App();

router.use(logger(':method :url :status :response-time[0] ms :req[x-request-id]'));
```

- A token is `:name` or `:name[arg]`. Names are at least two characters of letters, digits, `_` or `-`.
- Everything else is copied as is.
- An unknown token, or a token that returns `undefined`, renders as `-`.

### Tokens

| Token | Renders |
|-------|---------|
| `:method` | HTTP method (`GET`, `POST`, ...) |
| `:url` | `pathname + search` of the request URL |
| `:status` | Response status code; `-` when there is no `Response` (immediate mode, see [Notes](#notes)) |
| `:response-time[digits]` | Milliseconds since the logger handler started, with `digits` decimals (default `3`) |
| `:total-time[digits]` | Same as `:response-time` |
| `:date[format]` | Current time: `web` (default, `toUTCString()`), `iso` (`toISOString()`) or `clf` (`10/Oct/2000:13:55:36 +0000`, UTC) |
| `:remote-addr` | Client IP from routup's `getRequestIP` (respects the app's `trustProxy` option) |
| `:remote-user` | User name from an `Authorization: Basic ...` header |
| `:user-agent` | `User-Agent` header |
| `:referrer` | `Referer` header, or `Referrer` |
| `:http-version` | `httpVersion` of the request if the runtime sets one, otherwise `1.1` |
| `:req[name]` | Request header `name` |
| `:res[name]` | Response header `name` |
| `:pid` | Process id (`0` where `process` does not exist) |

### Custom tokens

```typescript
import { logger } from '@routup/logger';
import { App } from 'routup';

const UserKey = Symbol.for('app:user');

const router = new App();

router.use(logger(':method :url :user', {
    tokens: {
        user: (event) => event.store[UserKey] as string | undefined,
    },
}));
```

- A token is `(event, response, arg) => string | undefined`. `arg` is the text in brackets.
- Your tokens are merged over the built-ins, so they extend the set and can replace a built-in of the same name.

### Formatter functions

```typescript
import { logger } from '@routup/logger';
import { App } from 'routup';

const router = new App();

router.use(logger(
    (_tokens, event, response) => `[${event.method}] ${event.path} -> ${response?.status ?? '?'}`,
));
```

A `Formatter` gets the token map, the event and the `Response` (or `undefined`) and returns the line. Return `undefined` to write nothing for that request.

### Write target and skip

```typescript
import { logger } from '@routup/logger';
import { App } from 'routup';

declare const myStructuredLogger: { info(entry: { msg: string }): void };

const router = new App();

router.use(logger('tiny', {
    skip: (event) => event.path === '/health',
    write: (line) => myStructuredLogger.info({ msg: line }),
}));
```

## Options

`logger(options?)` or `logger(format, options?)`. With the second form, `format` overrides `options.format`.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `format` | `string \| Formatter` | `'tiny'` | Preset name (`'tiny' \| 'short' \| 'common' \| 'combined' \| 'dev'`), format string (e.g. `':method :url :status'`) or `Formatter` function |
| `skip` | `(event, response) => boolean` | none | Return `true` to not log the request |
| `write` | `(line: string) => void` | `console.log` | Where each line goes. Errors it throws are swallowed |
| `immediate` | `boolean` | `false` | Write the line when the request arrives instead of after the response. There is no `Response` then: `:status` and `:res[*]` render `-` and `:response-time` is close to `0` |
| `tokens` | `Record<string, Token>` | `{}` | Extra tokens, merged over the built-ins |

## API

| Export | Kind | Purpose |
|--------|------|---------|
| `logger(format?, options?)` (also default export) | Handler factory | Returns the logging handler |
| `createHandler(options?)` | Function | Same handler from an options object only |
| `compile(format)` | Function | Compiles a format string into a `Formatter` |
| `resolveFormat(format)` | Function | Turns a `format` option into a `Formatter` |
| `formatStrings` | Object | Preset name to format string, for `tiny`, `short`, `common`, `combined` |
| `devFormatter` | `Formatter` | The coloured formatter behind `'dev'` |
| `defaultTokens` | `TokenMap` | The built-in tokens |
| `StartTimeSymbol` | Symbol | `event.store` key holding the start time read by `:response-time` |
| `Options`, `Token`, `TokenMap`, `Formatter`, `FormatInput`, `PresetFormatName`, `SkipFn`, `WriteFn` | Types | Option and callback shapes |

### `compile`

Compiles a format string into a `Formatter`. Each `:name` or `:name[arg]` is replaced by the matching token's return value, or `-` when the token is missing or returns `undefined`. Throws a `TypeError` when `format` is not a string.

```typescript
import type { Formatter } from '@routup/logger';

declare function compile(format: string): Formatter;
```

### `resolveFormat`

Resolves a `format` option into a `Formatter`:

- a function is returned as is
- `'dev'` returns `devFormatter`
- `'tiny'`, `'short'`, `'common'` and `'combined'` return the compiled preset
- any other string is compiled as a format string
- anything else (`undefined`, a number) falls back to `'tiny'`

```typescript
import type { Formatter } from '@routup/logger';

declare function resolveFormat(format: unknown): Formatter;
```

### `formatStrings`

Maps preset names to their format strings. Use it to derive a format:

```typescript
import { formatStrings, logger } from '@routup/logger';
import { App } from 'routup';

const router = new App();

router.use(logger(`${formatStrings.tiny} :req[x-trace]`));
```

`dev` is not in this map; it is the `devFormatter` function.

### `defaultTokens`

`logger()` already merges `defaultTokens` under `options.tokens`. Import it when you call `compile()` yourself, outside `logger()`:

```typescript
import { compile, defaultTokens } from '@routup/logger';
import type { IAppEvent } from 'routup';

declare const event: IAppEvent;
declare const response: Response | undefined;

const formatter = compile(':method :url :user');
const line = formatter({ ...defaultTokens, user: () => 'alice' }, event, response);
```

### `devFormatter`

The coloured `Formatter` used by `format: 'dev'`. Wrap it to add fields:

```typescript
import { devFormatter, logger } from '@routup/logger';
import { App } from 'routup';

const router = new App();

router.use(logger((tokens, event, response) => {
    const line = devFormatter(tokens, event, response);

    return line && `${line} ${tokens.pid?.(event, response)}`;
}));
```

See the docs site for the [logger guide](https://plugins.routup.dev/logger/) and the [helpers](https://plugins.routup.dev/logger/helpers).

## Notes

- **Errors and unmatched routes log `-` as status.** When a route throws or no route matches, the logger's `event.next()` resolves without a `Response` (routup creates the error or `404` response further out), so `:status` and `:res[*]` render `-`. The line is still written.
- **Mount order matters.** Requests answered by a handler registered before `logger()` are not logged.
- **`:res[content-length]` is often `-`.** Tokens read the headers of the `Response` object the handler chain returned. A plain return value (a string, an object) typically has no `content-length` header at that point.
- **`immediate` loses the response.** The line is written before any route runs, so it has no status, no response headers and no meaningful time.
- **Logging never breaks a request.** An exception thrown by `write` is swallowed. Exceptions thrown by a token, a formatter or `skip` are not.
- **`:http-version` is usually `1.1`.** Web `Request` objects carry no HTTP version; the token only shows another value when the runtime adds `httpVersion` to the request.

## License

Made with 💚

Published under [MIT License](https://github.com/routup/plugins/blob/master/LICENSE).
