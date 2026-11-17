---
title: Query
description: Parse the request URL's query string into an object, nested keys and arrays included.
relatedPlugins: [basic, decorators]
plugin:
    package: '@routup/query'
    summary: 'Parse the query string.'
    group: 'Request & response'
    order: 3
---

# @routup/query

Parses the query string of a routup request into an object, nested keys and arrays included. The URL is parsed once per request with [qs](https://github.com/ljharb/qs); handlers read the result instead of walking `URLSearchParams`.

## Requirements

- Node.js 24 or later, ESM only
- `routup` `^6.3.0` (peer dependency)
- `qs` and `@types/qs` are installed as dependencies

## Installation

```bash
npm install @routup/query
```

## Quick Start

<<< @/../examples/query/quick-start.ts

`query()` is a plugin: register it with `app.use()` before the routes that read the query ([Plugins](https://routup.dev/guide/plugins)). The file exports the app; [serve it](https://routup.dev/guide/quickstart) from your entry file.

```bash
curl -g 'http://localhost:3000/users?page[limit]=10&page[offset]=0&sort=-name'
# {"page":{"limit":"10","offset":"0"},"sort":"-name"}
```

## Default Behaviour

| Step | What happens |
|------|--------------|
| Parse | The middleware parses the part of the URL between `?` and `#` with qs and stores the result on the request; the helpers only read that store |
| Skip | When a query is stored already, by an earlier `query()` or by `setRequestQuery()`, it does not parse again |
| Values | Every value is a string, an array or an object, never a number or a boolean; `+` and percent escapes are decoded |
| Empty | A URL without a query string gives `{}` |

Handlers that run before `query()` see no query: `useRequestQuery(event)` returns `{}` and `useRequestQuery(event, key)` returns `undefined`.

### What qs Builds

| Query string | Result |
|--------------|--------|
| `tag=a&tag=b` | `{ tag: ['a', 'b'] }` |
| `ids[]=1&ids[]=2` | `{ ids: ['1', '2'] }` |
| `page[limit]=10` | `{ page: { limit: '10' } }` |
| `a[19]=x` | `{ a: ['x'] }` |
| `a[20]=x` | `{ a: { 20: 'x' } }`: an index of 20 or more gives an object |
| `tag=...` 21 times | An object with the keys `0` to `20`: more than 20 repeated keys give an object |
| `a[b][c][d][e][f][g]=x` | Nesting stops after five levels; the rest stays one key, `'[g]'` |

Without options, qs keeps the first 1000 parameters and drops the rest. None of these limits raises an error unless you set `throwOnLimitExceeded` or `strictDepth`; [Configuration](/query/configuration) changes them.

## Next Steps

- [Configuration](/query/configuration): the qs parse options
- [Helpers](/query/helpers): `useRequestQuery()`, `setRequestQuery()`, `hasRequestQuery()` and the types
- [Recipes](/query/recipes): read and convert values, filters with nested keys, parser options, a default value
- [Combining Plugins](/guide/combining#body-cookie-and-query): `@routup/basic` registers `body()`, `cookie()` and `query()` in one call
