# @routup/logger

[![npm version](https://badge.fury.io/js/@routup%2Flogger.svg)](https://badge.fury.io/js/@routup%2Flogger)
[![main](https://github.com/routup/plugins/actions/workflows/main.yml/badge.svg)](https://github.com/routup/plugins/actions/workflows/main.yml)
[![codecov](https://codecov.io/gh/routup/plugins/branch/master/graph/badge.svg)](https://codecov.io/gh/routup/plugins)
[![Known Vulnerabilities](https://snyk.io/test/github/routup/plugins/badge.svg)](https://snyk.io/test/github/routup/plugins)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-%23FE5196?logo=conventionalcommits&logoColor=white)](https://conventionalcommits.org)

An HTTP request logger for routup — morgan-compatible token DSL on top of routup's web-API helpers.

**Table of Contents**

- [Installation](#installation)
- [Documentation](#documentation)
- [Usage](#usage)
- [Options](#options)
- [Preset formats](#preset-formats)
- [Tokens](#tokens)
- [Custom tokens](#custom-tokens)
- [License](#license)

## Installation

```bash
npm install @routup/logger --save
```

## Documentation

To read the docs, visit [https://routup.net](https://routup.net)

## Usage

`logger()` returns a routup `CoreHandler` — pass it to `router.use(...)`. It logs after the response is resolved so `:status`, `:response-time`, and `:res[*]` tokens see real values.

```typescript
import { Router, defineCoreHandler, serve } from 'routup';
import { logger } from '@routup/logger';

const router = new Router();

router.use(logger('tiny'));

router.get('/', defineCoreHandler(() => 'ok'));

serve(router, { port: 3000 });
```

> Logger is intentionally a handler factory rather than a routup `Plugin`. Routup plugins install into a dedicated sub-router whose `event.next()` only walks that sub-router's stack — sibling routes are invisible. Logging needs the resolved `Response`, so the handler form is the right shape.

## Options

```typescript
logger(options?: Options);
logger(format: string | Formatter, options?: Options);
```

| Option | Type | Default | Description |
|---|---|---|---|
| `format` | `string \| Formatter` | `'tiny'` | Format string (e.g. `':method :url :status'`), preset name (`'tiny' \| 'short' \| 'common' \| 'combined' \| 'dev'`), or a `Formatter` function. |
| `skip` | `(event, response) => boolean` | — | Skip a request from being logged. |
| `write` | `(line: string) => void` | `console.log` | Where to write the log line. |
| `immediate` | `boolean` | `false` | Emit at request start instead of after the response. `:status` / `:response-time` render as `-`. |
| `tokens` | `Record<string, Token>` | `{}` | Additional tokens merged on top of the built-ins. |

## Preset formats

```text
combined   :remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"
common     :remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length]
short      :remote-addr :remote-user :method :url HTTP/:http-version :status :res[content-length] - :response-time ms
tiny       :method :url :status :res[content-length] - :response-time ms
dev        :method :url :status (color-coded by status range) :response-time ms - :res[content-length]
```

Pass the preset name directly:

```typescript
router.use(logger('combined'));
```

## Tokens

| Token | Renders |
|---|---|
| `:method` | HTTP method (`GET`, `POST`, ...) |
| `:url` | `pathname + search` from the request URL |
| `:status` | Response status code (`-` if not yet sent in immediate mode) |
| `:response-time` / `:total-time` | Milliseconds since request start, 3 decimals |
| `:date[web\|iso\|clf]` | Current time in the requested format (defaults to `web`) |
| `:remote-addr` | Client IP (via `getRequestIP`) |
| `:remote-user` | Username from `Authorization: Basic …` |
| `:user-agent` | `User-Agent` header |
| `:referrer` | `Referer` / `Referrer` header |
| `:http-version` | `1.1` unless srvx exposes a richer value |
| `:req[name]` | Request header by name |
| `:res[name]` | Response header by name |
| `:pid` | Process id |

Missing values render as `-`.

## Custom tokens

```typescript
router.use(logger(':method :url :user', {
    tokens: {
        user: (event) => event.store.userId as string | undefined,
    },
}));
```

Or use a `Formatter` directly to bypass the token DSL:

```typescript
router.use(logger(
    (_tokens, event, response) => {
        return `[${event.method}] ${event.path} → ${response?.status ?? '?'}`;
    },
));
```

## License

Made with 💚

Published under [MIT License](./LICENSE).
