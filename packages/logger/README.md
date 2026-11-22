<div align="center">

<img src="./assets/logo.svg" alt="@routup/logger logo: printed log strip" width="128" height="128" />

<h1>@routup/logger</h1>

</div>

[![npm version](https://img.shields.io/npm/v/@routup/logger)](https://www.npmjs.com/package/@routup/logger)
[![CI](https://github.com/routup/plugins/actions/workflows/main.yml/badge.svg)](https://github.com/routup/plugins/actions/workflows/main.yml)
[![Coverage](https://codecov.io/gh/routup/plugins/branch/master/graph/badge.svg)](https://codecov.io/gh/routup/plugins)
[![Known Vulnerabilities](https://snyk.io/test/github/routup/plugins/badge.svg)](https://snyk.io/test/github/routup/plugins)

**Log one line per routup request, using morgan's token syntax and its tiny, short, common, combined and dev formats.**

You stop timing requests and assembling access-log lines by hand; format strings you know from morgan keep working.

[Docs](https://plugins.routup.dev/logger/) · [Configuration](https://plugins.routup.dev/logger/configuration) · [Helpers](https://plugins.routup.dev/logger/helpers) · [Recipes](https://plugins.routup.dev/logger/recipes)

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

The colored `dev` preset and its extension are shown in [Extend the Dev Format](https://plugins.routup.dev/logger/recipes#extend-the-dev-format).

## Installation

```bash
npm install @routup/logger
```

ESM only, Node.js >=24. Peer dependency: `routup@^6.3.0`.

## Quick Start

```typescript
import { App, defineCoreHandler } from 'routup';
import { logger } from '@routup/logger';

export const app = new App();

// first, so it sees every request the routes answer
app.use(logger());

app.get('/', defineCoreHandler(() => 'Hello, World!'));
```

The sample exports the app; [serve it](https://routup.dev/guide/quickstart) from your entry file. `logger()` returns a routup handler: mount it with `app.use()` before the routes it logs. Each request then writes a line in the `tiny` format to `console.log`, such as `GET / 200 - - 0.412 ms`.

## Documentation

The full reference lives on [plugins.routup.dev](https://plugins.routup.dev/logger/):

- [Overview](https://plugins.routup.dev/logger/): requirements, default behaviour and when the line is written
- [Configuration](https://plugins.routup.dev/logger/configuration): the options, the preset formats and the built-in tokens
- [Helpers](https://plugins.routup.dev/logger/helpers): `compile()`, `resolveFormat()`, `devFormatter` and the types
- [Recipes](https://plugins.routup.dev/logger/recipes): a custom format, skipping requests, JSON lines, writing to a file

## License

Made with 💚

Published under [MIT License](https://github.com/routup/plugins/blob/master/LICENSE).
