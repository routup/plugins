---
title: Basic
description: Register the body, cookie and query parsers with one plugin and one dependency.
relatedPlugins: [body, cookie, query, decorators]
plugin:
    package: '@routup/basic'
    summary: 'Body, cookie and query in one.'
    group: 'Bundles'
    order: 1
---

# @routup/basic

Registers the request body, cookie and query string parsers in a routup app with one `app.use()` call. It depends on [`@routup/body`](/body/), [`@routup/cookie`](/cookie/) and [`@routup/query`](/query/) and re-exports their helpers under subpaths, so one install is enough.

## Requirements

- Node.js 24 or later, ESM only
- `routup` `^6.3.0` (peer dependency)
- `@routup/body`, `@routup/cookie` and `@routup/query` are installed as dependencies

## Installation

```bash
npm install @routup/basic
```

## Quick Start

<<< @/../examples/basic/quick-start.ts

`basic()` is a plugin: register it with `app.use()` before the routes that read the body, cookies or query ([Plugins](https://routup.dev/guide/plugins)). The file exports the app; [serve it](https://routup.dev/guide/quickstart) from your entry file.

```bash
curl -X POST 'http://localhost:3000/items?page=2' \
    -H 'cookie: session=abc' \
    -H 'content-type: application/json' \
    -d '{"name":"pen"}'
# {"item":{"name":"pen"},"page":"2","session":"abc"}
```

## Default Behaviour

| Step | What happens |
|------|--------------|
| Register | `basic()` without options registers `body()`, `cookie()` and `query()` with their default options |
| Order | Always body, then cookie, then query, all at the position of the `basic()` call; a handler that runs before it sees an empty body, no cookies and no query |
| Helpers | `@routup/basic/body`, `@routup/basic/cookie` and `@routup/basic/query` re-export the named exports of the three packages |

What each parser does by default is on its own page: [body](/body/#default-behaviour), [cookie](/cookie/#default-behaviour), [query](/query/#default-behaviour).

When you need only one of the three, install it alone: [`@routup/body`](/body/), [`@routup/cookie`](/cookie/) or [`@routup/query`](/query/). To run a parser at another position, for example the body parser under `/api` only, install the three packages and register them yourself ([Combining Plugins](/guide/combining#body-cookie-and-query)).

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `body` | [`BodyOptions`](/body/configuration) `\| boolean` | `true` when no key is set | Options of `body()`; `true` registers it with its defaults, `false` skips it |
| `cookie` | [`CookieOptions`](/cookie/configuration) `\| boolean` | `true` when no key is set | Options of `cookie()`; `true` registers it with its defaults, `false` skips it |
| `query` | [`QueryOptions`](/query/configuration) `\| boolean` | `true` when no key is set | Options of `query()`; `true` registers it with its defaults, `false` skips it |

When none of the three keys is set, `basic()` sets all three to `true`. Once one key is set, only the keys that are `true` or an options object are registered; a key left out counts as `false`. `basic({ query: false })` therefore registers no parser at all; list every parser you want.

<<< @/../examples/basic/configure.ts

```bash
curl -X POST 'http://localhost:3000/items?page=2' \
    -H 'cookie: session=abc' \
    -H 'content-type: application/json' \
    -d '{"name":"pen"}'
# {"item":{"name":"pen"},"cookies":{"session":"abc"},"query":{}}
```

- An options object is passed to the plugin unchanged, so its own defaults apply one level down: `body: { json: { limit: '1kb' } }` enables JSON only, without URL-encoded forms ([body Options](/body/configuration#options)).
- Without keys, `basic()` writes the three `true` values into the object you passed; do not share one options object between apps if that matters.
- Registering `basic()` twice is harmless for cookie and query, which do not parse again when a result is stored. The second `body()` replaces the body options for the handlers after it.

## Subpath Exports

| Import | Re-exports |
|--------|------------|
| `@routup/basic/body` | Every named export of [`@routup/body`](/body/helpers): `body`, `readRequestBody`, `readRequestBodyText`, ... |
| `@routup/basic/cookie` | Every named export of [`@routup/cookie`](/cookie/helpers): `cookie`, `useRequestCookie`, `setResponseCookie`, ... |
| `@routup/basic/query` | Every named export of [`@routup/query`](/query/helpers): `query`, `useRequestQuery`, `setRequestQuery`, ... |

The subpaths have no default export. Importing from the original packages works as well and reads the same request store.

## `basic()`

Creates the plugin. It is also the default export.

```typescript
declare function basic(options?: Options): Plugin;
```

## Types

| Type | Definition |
|------|------------|
| `Options` | `{ body?, cookie?, query? }`, each an options object or a boolean ([Options](#options)) |

## Other Exports

| Export | Description |
|--------|-------------|
| `boolToObject` | Internal: turns `true` or `false` into `{}` and returns an object unchanged |

## Next Steps

- [`@routup/body`](/body/), [`@routup/cookie`](/cookie/), [`@routup/query`](/query/): the options, helpers and recipes of each parser
- [Combining Plugins](/guide/combining#body-cookie-and-query): register the parsers separately
- [`@routup/decorators`](/decorators/): its body, query and cookie decorators read the values these parsers store
