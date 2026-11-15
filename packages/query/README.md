<p align="center">
    <img src="https://cdn.jsdelivr.net/npm/@routup/query@4/assets/logo.svg" alt="@routup/query logo: a key and value pair next to a question mark" width="128" height="128" />
</p>

<h1 align="center">@routup/query</h1>

<p align="center">
    <b>Parse the query string of a routup request into an object, nested keys and arrays included.</b><br>
    The URL is parsed once per request with <a href="https://github.com/ljharb/qs">qs</a>; handlers read the result instead of walking <code>URLSearchParams</code>.
</p>

<p align="center">
    <a href="https://www.npmjs.com/package/@routup/query"><img src="https://img.shields.io/npm/v/@routup/query" alt="npm version" /></a>
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
    <a href="https://plugins.routup.dev/query/">Docs</a>
</p>

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

```typescript
import { App, defineCoreHandler, serve } from 'routup';
import { query, useRequestQuery } from '@routup/query';

const app = new App();

app.use(query());

// GET /users?page[limit]=10&page[offset]=0&sort=-name
app.get('/users', defineCoreHandler((event) => {
    const page = useRequestQuery(event, 'page');
    // { limit: '10', offset: '0' }

    return { page, sort: useRequestQuery(event, 'sort') };
}));

serve(app, { port: 3000 });
```

## Installation

```bash
npm install @routup/query
```

The package is ESM only, requires Node.js >= 22 and has `routup@^6.1.0` as a peer dependency. `qs` and its types are installed as dependencies.

## Usage

### Read the query

```typescript
import { App, defineCoreHandler, serve } from 'routup';
import { query, useRequestQuery } from '@routup/query';

const app = new App();

app.use(query());

app.get('/', defineCoreHandler((event) => {
    const q = useRequestQuery(event);
    // { key: ..., ... }

    return q;
}));

serve(app, { port: 3000 });
```

- Register `query()` before the handlers that read the query. The middleware parses the part of the URL between `?` and `#` and stores the result on `event.store`; the helpers only read that store.
- Without the middleware, `useRequestQuery(event)` returns `{}` and `useRequestQuery(event, key)` returns `undefined`.
- A URL without a query string gives `{}`.
- If a query was already stored for the request (by an earlier `query()` or `setRequestQuery`), the middleware does not parse again.

### Configure the parser

```typescript
import { App } from 'routup';
import { query } from '@routup/query';

const app = new App();

app.use(query({
    parse: {
        allowDots: true, // ?filter.name=foo -> { filter: { name: 'foo' } }
        depth: 3,
        parameterLimit: 100,
    },
}));
```

- `parse` is passed to qs `parse` unchanged. Every value stays a string unless you add a `decoder`; qs does not convert numbers or booleans.

### Override the query

```typescript
import { App, defineCoreHandler } from 'routup';
import { query, setRequestQuery, useRequestQuery } from '@routup/query';

const app = new App();

app.use(query());

app.use(defineCoreHandler((event) => {
    if (typeof useRequestQuery(event, 'limit') === 'undefined') {
        setRequestQuery(event, 'limit', '20');
    }

    return event.next();
}));
```

- `setRequestQuery(event, key, value)` merges one entry into the stored query; `setRequestQuery(event, record)` replaces it.
- This changes only what later handlers read, not the request URL.

## Options

`query(options?)`:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `parse` | `ParseOptions` (qs `IParseOptions`) | `undefined` | Passed to qs `parse` |

Common qs options and their qs defaults (qs 6.x; see the [qs documentation](https://github.com/ljharb/qs#parsing-objects) for the full list):

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `depth` | `number \| false` | `5` | Maximum nesting depth for bracket keys; deeper keys stay in the key string |
| `arrayLimit` | `number` | `20` | Largest array qs builds, for indices (`a[25]=x`) and for repeated keys (`tag=...` more than 20 times); above it the value becomes an object with numeric keys |
| `parameterLimit` | `number` | `1000` | Maximum number of parameters parsed |
| `allowDots` | `boolean` | `false` | Treat `a.b=c` like `a[b]=c` |
| `parseArrays` | `boolean` | `true` | Set to `false` to parse `a[0]=b` as an object |
| `comma` | `boolean` | `false` | Split `a=b,c` into `['b', 'c']` |
| `decoder` | `function` | qs URI decoder | Decode keys and values |

## API

| Export | Kind | Purpose |
|--------|------|---------|
| `query` (also the default export) | function | Create the plugin |
| `useRequestQuery` | function | The parsed query, or one key of it |
| `setRequestQuery` | function | Set one key or replace the stored query |
| `hasRequestQuery` | function | Whether a query is stored for the request |
| `Options`, `ParseOptions` | type | Option shapes |

The [helpers page](https://plugins.routup.dev/query/helpers) of the docs covers the same reference.

### `useRequestQuery`

Returns the query parameters of the request. Pass a key to read a single value.

```typescript
declare function useRequestQuery(
    event: IAppEvent,
): Record<string, any>;

declare function useRequestQuery(
    event: IAppEvent,
    key: string,
): any;
```

### `setRequestQuery`

Sets the parsed request query parameters for the current request: one key, or the whole record.

```typescript
declare function setRequestQuery(
    event: IAppEvent,
    key: string,
    value: unknown,
): void;

declare function setRequestQuery(
    event: IAppEvent,
    record: Record<string, any>,
): void;
```

### `hasRequestQuery`

Returns `true` once a query object is stored for the request.

```typescript
declare function hasRequestQuery(
    event: IAppEvent,
): boolean;
```

## Notes

- **Order matters.** Handlers registered before `query()` see an empty query.
- **Values are strings, arrays or objects, never numbers.** Validate and convert `?limit=10` yourself.
- **qs limits apply silently.** Parameters beyond `parameterLimit` are dropped, keys deeper than `depth` are kept as a literal key, and an index or a count of repeated keys above `arrayLimit` turns the array into an object with numeric keys. None of these raise an error by default.
- **The fragment is ignored.** Everything from `#` on is stripped before parsing.
- **The stored query is not the URL.** `setRequestQuery` does not change `event.request.url` or `event.searchParams`.

## License

Made with 💚

Published under [MIT License](https://github.com/routup/plugins/blob/master/LICENSE).
