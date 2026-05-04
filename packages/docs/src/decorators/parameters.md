---
title: Decorators — Parameters
description: Parameter decorators and the parser-extractor wiring they depend on.
relatedPlugins: [body, cookie, query, basic]
---

# Parameter decorators

Parameter decorators inject typed values into a controller method. Some are extracted directly from the event; others (body, cookie, query) require you to **register an extractor function** when installing the plugin, because routup itself doesn't ship a body parser.

## Reference table

| Decorator | Source | Extractor required? |
|---|---|---|
| `@DContext()` | `IRoutupEvent` | No |
| `@DRequest()` | `event.request` | No |
| `@DResponse()` | `event.response` | No |
| `@DNext()` | `event.next` | No |
| `@DPath(name)` | `event.params[name]` | No |
| `@DPaths()` | `event.params` | No |
| `@DHeader(name)` | `event.headers.get(name)` | No |
| `@DHeaders()` | `event.headers` | No |
| `@DBody(prop?)` | extractor from `parameter.body` | **Yes** |
| `@DQuery(prop?)` | extractor from `parameter.query` | **Yes** |
| `@DCookie(name)` | extractor from `parameter.cookie` | **Yes** |
| `@DCookies()` | extractor from `parameter.cookie` (no name) | **Yes** |

## Wiring extractors

Body, cookie, and query are not built into routup core — they live in dedicated plugins. The decorators plugin asks you to map each to the helper of your choice. Pair with [`@routup/basic`](/basic/) (or its individual sub-plugins) for the standard wiring:

```typescript
import { Router } from 'routup';
import { decorators } from '@routup/decorators';
import {
    basic,
    readRequestBody,
    useRequestCookie,
    useRequestCookies,
    useRequestQuery,
} from '@routup/basic';

const router = new Router();

router.use(basic());
router.use(decorators({
    controllers: [UserController],
    parameter: {
        body: async (ctx, name) => {
            return name
                ? readRequestBody(ctx.event, name)
                : readRequestBody(ctx.event);
        },
        cookie: (ctx, name) => {
            return name
                ? useRequestCookie(ctx.event, name)
                : useRequestCookies(ctx.event);
        },
        query: (ctx, name) => {
            return name
                ? useRequestQuery(ctx.event, name)
                : useRequestQuery(ctx.event);
        },
    },
}));
```

The `ctx` argument the extractor receives carries the event plus decorator metadata. Custom extractors are how you'd plug in `multer`-style file-upload helpers, schema validation (via [validup](https://github.com/tada5hi/validup)), or a different cookie store.

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
- [`@routup/basic`](/basic/) — the standard parser bundle most extractors are built on
