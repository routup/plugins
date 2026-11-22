<div align="center">

<img src="./assets/logo.svg" alt="@routup/query logo: a key and value pair next to a question mark" width="128" height="128" />

<h1>@routup/query</h1>

</div>

[![npm version](https://img.shields.io/npm/v/@routup/query)](https://www.npmjs.com/package/@routup/query)
[![CI](https://github.com/routup/plugins/actions/workflows/main.yml/badge.svg)](https://github.com/routup/plugins/actions/workflows/main.yml)
[![Coverage](https://codecov.io/gh/routup/plugins/branch/master/graph/badge.svg)](https://codecov.io/gh/routup/plugins)
[![Known Vulnerabilities](https://snyk.io/test/github/routup/plugins/badge.svg)](https://snyk.io/test/github/routup/plugins)

**Parse the query string of a routup request into an object, nested keys and arrays included.**

The URL is parsed once per request with [qs](https://github.com/ljharb/qs); handlers read the result instead of walking `URLSearchParams`.

[Docs](https://plugins.routup.dev/query/) · [Configuration](https://plugins.routup.dev/query/configuration) · [Helpers](https://plugins.routup.dev/query/helpers) · [Recipes](https://plugins.routup.dev/query/recipes)

---

## Why @routup/query?

`new URL(event.request.url).searchParams.get('sort')` is enough for one flat value. Filters and pagination such as `?page[limit]=10&page[offset]=0&tag=a&tag=b` need a parser that turns brackets into objects and repeated keys into arrays, and you want to run it once, not in every handler that looks at the query.

| Concern | Without it | With @routup/query |
|---------|------------|--------------------|
| Nested keys | `searchParams.get('page[limit]')`, one key at a time | `useRequestQuery(event, 'page')` returns `{ limit: '10', offset: '0' }` |
| Repeated keys | `searchParams.getAll('tag')` | `tag=a&tag=b` becomes `['a', 'b']` (up to `arrayLimit`) |
| Parsing cost | Parse in every handler that reads the query | Parsed once by the middleware and stored on `event.store` |
| Parser settings | Write your own depth and size limits | qs options under `parse`: `depth`, `arrayLimit`, `parameterLimit`, `allowDots`, ... |
| Overrides | Pass a normalised query object around yourself | `setRequestQuery(event, ...)` changes what later handlers read |

## Installation

```bash
npm install @routup/query
```

ESM only, Node.js >=24. Peer dependency: `routup@^6.3.0`. `qs` and its types are installed as dependencies.

## Quick Start

```typescript
import { App, defineCoreHandler } from 'routup';
import { query, useRequestQuery } from '@routup/query';

export const app = new App();

app.use(query());

// GET /users?page[limit]=10&page[offset]=0&sort=-name
app.get('/users', defineCoreHandler((event) => {
    const page = useRequestQuery(event, 'page');
    // { limit: '10', offset: '0' }

    return { page, sort: useRequestQuery(event, 'sort') };
}));
```

The sample exports the app; [serve it](https://routup.dev/guide/quickstart) from your entry file. `query()` parses the query string once per request; every value is a string, an array or an object, never a number.

## Documentation

The full reference lives on [plugins.routup.dev](https://plugins.routup.dev/query/):

- [Overview](https://plugins.routup.dev/query/): requirements, default behaviour and what qs builds from a query string
- [Configuration](https://plugins.routup.dev/query/configuration): the qs parse options and their limits
- [Helpers](https://plugins.routup.dev/query/helpers): `useRequestQuery()`, `setRequestQuery()`, `hasRequestQuery()` and the types
- [Recipes](https://plugins.routup.dev/query/recipes): read and convert values, filters with nested keys, parser options, a default value

## License

Made with 💚

Published under [MIT License](https://github.com/routup/plugins/blob/master/LICENSE).
