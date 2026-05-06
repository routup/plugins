---
title: Logger — Helpers
description: Format compiler, preset resolver, and built-in token map.
relatedPlugins: []
---

# Helpers

## `compile`

Compiles a format string into a `Formatter`. Replaces tokens (`:name`, `:name[arg]`) with the matching token's return value, falling back to `-` when a token is missing.

```typescript
declare function compile(format: string): Formatter;
```

## `resolveFormat`

Resolves a `format` option into a `Formatter`:
- a function is returned as-is
- a known preset name (`'tiny'`, `'short'`, `'common'`, `'combined'`, `'dev'`) returns the preset's compiled formatter
- any other string is treated as a raw format string and compiled
- `undefined` / non-string / non-function falls back to `'tiny'`

```typescript
declare function resolveFormat(format: unknown): Formatter;
```

## `formatStrings`

Object map of preset name → format string. Use it to build derived formats:

```typescript
import { compile, formatStrings } from '@routup/logger';

const myFormat = compile(`${formatStrings.tiny} :req[x-trace]`);
```

## `defaultTokens`

The built-in token map. `logger()` already merges `defaultTokens` under any `options.tokens` you supply, so passing custom tokens **extends** the defaults — no manual spread required:

```typescript
router.use(logger(':method :url :user', {
    tokens: {
        user: (event) => event.store.userId as string | undefined,
    },
}));
```

Import `defaultTokens` directly when you call `compile()` yourself or build a `Formatter` outside of `logger()` (where the auto-merge doesn't apply):

```typescript
import { compile, defaultTokens } from '@routup/logger';

const formatter = compile(':method :url :user');
const line = formatter({ ...defaultTokens, user: () => 'alice' }, event, response);
```

## `devFormatter`

The colorized `Formatter` used by `format: 'dev'`. Exported in case you want to wrap it with extra information.
