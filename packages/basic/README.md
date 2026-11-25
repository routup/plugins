<div align="center">

<img src="./assets/logo.svg" alt="@routup/basic logo: three cards fanned out, one per bundled plugin" width="128" height="128" />

<h1>@routup/basic</h1>

</div>

[![npm version](https://img.shields.io/npm/v/@routup/basic)](https://www.npmjs.com/package/@routup/basic)
[![CI](https://github.com/routup/plugins/actions/workflows/main.yml/badge.svg)](https://github.com/routup/plugins/actions/workflows/main.yml)
[![Coverage](https://codecov.io/gh/routup/plugins/branch/master/graph/badge.svg)](https://codecov.io/gh/routup/plugins)
[![Known Vulnerabilities](https://snyk.io/test/github/routup/plugins/badge.svg)](https://snyk.io/test/github/routup/plugins)

**Install body, cookie and query parsing in a routup app with one plugin and one dependency.**

One `app.use(basic())` registers @routup/body, @routup/cookie and @routup/query; their helpers are re-exported under subpaths.

[Docs](https://plugins.routup.dev/basic/) · [Options](https://plugins.routup.dev/basic/#options) · [Subpath Exports](https://plugins.routup.dev/basic/#subpath-exports)

---

## Why @routup/basic?

Most APIs need the request body, cookies and the query string. Installing and registering three plugins separately means three dependencies to keep in sync and three `app.use()` lines in every app.

| Concern | Without it | With @routup/basic |
|---------|------------|--------------------|
| Dependencies | `@routup/body`, `@routup/cookie` and `@routup/query` in `package.json` | `@routup/basic`, which depends on all three |
| Registration | `app.use(body())`, `app.use(cookie())`, `app.use(query())` | `app.use(basic())` registers them in that order |
| Configuration | Options per plugin call | One object: `basic({ body: {...}, cookie: {...}, query: {...} })` |
| Imports | Helpers from three packages | Helpers from `@routup/basic/body`, `/cookie` and `/query` |
| Control | Full control over order and placement | Fixed order (body, cookie, query) at one point in the stack; install the plugins individually when you need more |

## Installation

```bash
npm install @routup/basic
```

ESM only, Node.js >=24. Peer dependency: `routup@^6.5.1`. `@routup/body`, `@routup/cookie` and `@routup/query` are installed as dependencies.

## Quick Start

```typescript
import { App, defineCoreHandler } from 'routup';
import { basic } from '@routup/basic';
import { readRequestBody } from '@routup/basic/body';
import { useRequestCookie } from '@routup/basic/cookie';
import { useRequestQuery } from '@routup/basic/query';

export const app = new App();

// registers body(), cookie() and query(), in that order
app.use(basic());

app.post('/items', defineCoreHandler(async (event) => ({
    item: await readRequestBody(event),
    page: useRequestQuery(event, 'page'),
    session: useRequestCookie(event, 'session'),
})));
```

The sample exports the app; [serve it](https://routup.dev/guide/quickstart) from your entry file.

## Documentation

The full reference lives on [plugins.routup.dev](https://plugins.routup.dev/basic/):

- [Overview](https://plugins.routup.dev/basic/): requirements, default behaviour, the options, the subpath exports and the API
- [@routup/body](https://plugins.routup.dev/body/), [@routup/cookie](https://plugins.routup.dev/cookie/), [@routup/query](https://plugins.routup.dev/query/): the options and helpers of each parser

## License

Made with 💚

Published under [MIT License](https://github.com/routup/plugins/blob/master/LICENSE).
