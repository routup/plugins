---
title: Query Recipes
description: Task-oriented samples for reading the query string with @routup/query.
relatedPlugins: [basic]
---

# Recipes

## Read and Convert Values

`useRequestQuery(event)` returns the whole query, `useRequestQuery(event, key)` one value. A value is a string, or an array when the key repeats, so a handler converts and bounds it itself.

<<< @/../examples/query/read-values.ts

```bash
curl 'http://localhost:3000/search?q=routup&limit=5&tag=http&tag=router'
# {"all":{"q":"routup","limit":"5","tag":["http","router"]},"q":"routup","limit":5,"tags":["http","router"]}
curl 'http://localhost:3000/search?limit=abc&tag=http'
# {"all":{"limit":"abc","tag":"http"},"q":"","limit":20,"tags":["http"]}
```

## Filters With Nested Keys

Bracket keys become objects, and `[]` appends to an array, as in JSON:API style filters.

<<< @/../examples/query/filters.ts

```bash
curl -g 'http://localhost:3000/issues?filter[status]=open&filter[labels][]=bug&filter[labels][]=ui&fields[issue]=title'
# {"filter":{"status":"open","labels":["bug","ui"]},"fields":{"issue":"title"}}
```

`curl -g` sends the brackets as they are; browsers and HTTP clients usually percent-encode them, which qs decodes the same way.

## Parser Options

`parse` is passed to qs. Here dots nest like brackets, commas split values, and the limits are tighter than the defaults.

<<< @/../examples/query/parser-options.ts

```bash
curl 'http://localhost:3000/issues?filter.status=open&ids=1,2,3'
# {"filter":{"status":"open"},"ids":["1","2","3"]}
curl -g 'http://localhost:3000/issues?a[b][c][d]=x'
# {"a":{"b":{"c":{"[d]":"x"}}}}
```

Parameters beyond the fiftieth are dropped without an error.

## Default a Missing Value

`setRequestQuery()` changes what later handlers read, here a page size for requests that sent none. The request URL stays as it was.

<<< @/../examples/query/default-value.ts

```bash
curl http://localhost:3000/items
# {"limit":"20"}
curl 'http://localhost:3000/items?limit=5'
# {"limit":"5"}
```
