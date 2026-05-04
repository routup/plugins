---
title: Decorators — Parameters
description: Parameter decorators with built-in body, cookie, and query extraction.
relatedPlugins: [body, cookie, query, basic]
---

# Parameter decorators

Parameter decorators inject typed values into a controller method. The helpers backing `@DBody`, `@DCookie`/`@DCookies`, and `@DQuery` defer to [`@routup/body`](/body/), [`@routup/cookie`](/cookie/), and [`@routup/query`](/query/) respectively — install whichever parsers your controllers actually use. No extractor wiring required.

## Reference table

| Decorator | Source |
|---|---|
| `@DContext()` | `IRoutupEvent` |
| `@DRequest()` | `event.request` |
| `@DResponse()` | `event.response` |
| `@DNext()` | `event.next` |
| `@DPath(name)` | `event.params[name]` |
| `@DPaths()` | `event.params` |
| `@DHeader(name)` | `event.headers.get(name)` |
| `@DHeaders()` | `event.headers` |
| `@DBody(prop?)` | `readRequestBody(event[, prop])` |
| `@DQuery(prop?)` | `useRequestQuery(event[, prop])` |
| `@DCookie(name)` | `useRequestCookie(event, name)` |
| `@DCookies()` | `useRequestCookies(event)` |

## Setup

Install whichever parsers your controllers actually use, then mount decorators. The simplest setup uses [`@routup/basic`](/basic/), which bundles all three:

```typescript
import { Router } from 'routup';
import { basic } from '@routup/basic';
import { decorators } from '@routup/decorators';

const router = new Router();

router.use(basic());
router.use(decorators({
    controllers: [UserController],
}));
```

If you'd rather pick parsers individually — for instance to skip cookies or pass non-default body options — install them directly:

```typescript
import { body } from '@routup/body';
import { cookie } from '@routup/cookie';
import { query } from '@routup/query';

router.use(body({ json: { limit: '5mb' } }));
router.use(cookie());
router.use(query());
router.use(decorators({ controllers: [UserController] }));
```

## Examples

```typescript
import {
    DController,
    DBody,
    DCookie,
    DGet,
    DHeader,
    DPath,
    DPost,
    DQuery,
} from '@routup/decorators';

@DController('/users')
export class UserController {
    @DGet('/:id')
    async show(
        @DPath('id') id: string,
        @DQuery('include') include: string | undefined,
        @DHeader('accept-language') lang: string | undefined,
        @DCookie('session') session: string | undefined,
    ) {
        return { id, include, lang, session };
    }

    @DPost('')
    async create(
        @DBody() body: { name: string; email: string },
    ) {
        return { id: 'new', ...body };
    }
}
```

## See also

- [Controllers](./controllers) — `@DController` and HTTP method decorators
- [`@routup/basic`](/basic/) — bundle of body, cookie, and query parsers
- [`@routup/body`](/body/) · [`@routup/cookie`](/cookie/) · [`@routup/query`](/query/) — the parsers decorators depends on
