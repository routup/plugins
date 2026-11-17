---
title: Query Configuration
description: Options of the query plugin and the qs parse options.
relatedPlugins: [basic]
---

# Configuration

`query(options?)` takes one object, the `Options` type.

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `parse` | `ParseOptions` | none | Passed to qs `parse` unchanged |

### `parse`

The qs `IParseOptions`. The common ones, with the defaults of qs 6:

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `depth` | `number \| false` | `5` | Maximum nesting depth of bracket keys; deeper keys stay in the key string |
| `arrayLimit` | `number` | `20` | Largest array qs builds, for an index (`a[25]=x`) and for repeated keys; above it the value becomes an object with numeric keys |
| `parameterLimit` | `number` | `1000` | Maximum number of parameters parsed; the rest are dropped |
| `throwOnLimitExceeded` | `boolean` | `false` | Throw instead of dropping parameters or building an object |
| `allowDots` | `boolean` | `false` | Read `a.b=c` like `a[b]=c` |
| `comma` | `boolean` | `false` | Split `a=b,c` into `['b', 'c']` |
| `parseArrays` | `boolean` | `true` | With `false`, `a[0]=b` gives `{ a: { 0: 'b' } }` |
| `duplicates` | `'combine' \| 'first' \| 'last'` | `'combine'` | What a repeated key gives: an array, the first or the last value |
| `decoder` | `function` | qs URI decoder | Decodes keys and values; qs itself never turns a value into a number or boolean, a decoder can |

The [qs documentation](https://github.com/ljharb/qs#parsing-objects) lists the others. [Parser Options](/query/recipes#parser-options) shows a configuration.

The middleware parses every request it runs for, so with `throwOnLimitExceeded` a query over a limit answers `500` on every route behind `query()`, also on routes that do not read it.
