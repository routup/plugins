---
title: Decorators — Controllers
description: "@DController and method decorators (@DGet, @DPost, @DPut, @DPatch, @DDelete)."
relatedPlugins: [swagger]
---

# Controllers

A controller is a class annotated with `@DController(path)`. Methods inside it become handlers when annotated with one of `@DGet` / `@DPost` / `@DPut` / `@DPatch` / `@DDelete`.

```typescript
import {
    DController,
    DGet,
    DPost,
    DPut,
    DPatch,
    DDelete,
    DPath,
    DBody,
} from '@routup/decorators';

@DController('/users')
export class UserController {
    @DGet('')          async list()                                {}
    @DGet('/:id')      async show(@DPath('id') id: string)         {}
    @DPost('')         async create(@DBody() body: any)            {}
    @DPut('/:id')      async replace(@DPath('id') id: string)      {}
    @DPatch('/:id')    async patch(@DPath('id') id: string)        {}
    @DDelete('/:id')   async remove(@DPath('id') id: string)       {}
}
```

The full path is `controllerPath + methodPath`, so the `show` handler above resolves to `GET /users/:id`.

## Multiple mount paths

`@DController` also accepts an array of paths. The controller is mounted under each path, so every method is reachable through any of them:

```typescript
@DController(['/users', '/members'])
export class UserController {
    @DGet('')         async list()                          {}
    @DGet('/:id')     async show(@DPath('id') id: string)   {}
}
```

`GET /users` and `GET /members` both resolve to `list`; `GET /users/42` and `GET /members/42` both resolve to `show`. This mirrors `@trapi/core`'s controller `paths` field, so the OpenAPI generator picks up every mount point.

## Returning values

In routup v5, handlers return values directly — no `send(res, data)`. The return value is converted to a `Response` by the core (see [routup's response model](https://routup.dev/guide/response)):

```typescript
@DGet('')
async list() {
    return [{ id: 1 }, { id: 2 }];   // → application/json
}

@DGet('/raw')
async raw() {
    return 'hello';                  // → text/plain
}

@DGet('/file')
async file() {
    return new Response(buffer, { headers: { 'content-type': 'image/png' } });
}
```

## Success status

`@DStatus(code)` declares the status a method answers with on success:

```typescript
import { DBody, DController, DPost, DStatus } from '@routup/decorators';

@DController('/jobs')
export class JobController {
    @DStatus(202)
    @DPost('')
    async enqueue(@DBody() body: JobInput): Promise<Job> {
        return queue.add(body);       // → 202 application/json
    }
}
```

The status is written to `event.response.status` after the arguments are resolved and before the method runs, so:

- a status the method sets itself (`event.response.status = 200`) still wins,
- a returned `Response` keeps its own status (routup ignores `event.response` for it),
- a parameter error (e.g. a malformed JSON body) still answers with its own status.

The OpenAPI preset documents the return type under this status instead of `200`. Pass a numeric literal: trapi cannot resolve an imported constant, and generation fails on anything that is not a three-digit status code.

## Accessing the event

Use `@DContext()` when you need the full `IAppEvent` (e.g. to set `event.response.status`, read `event.headers`, mutate `event.store`):

```typescript
import type { IAppEvent } from 'routup';
import { DContext, DController, DPost } from '@routup/decorators';

@DController('/orders')
export class OrderController {
    @DPost('')
    async create(@DContext() event: IAppEvent) {
        event.response.status = 201;
        return { id: '...' };
    }
}
```

## Async handlers

All method decorators support `async` handlers; the plugin awaits the returned promise before passing the result to the response pipeline.

## Multiple controllers

Pass an array to `decorators({ controllers: [...] })`. Each controller's `@DController(path)` becomes a sub-mount:

```typescript
router.use(decorators({
    controllers: [UserController, OrderController, AuthController],
    // ...
}));
```

## See also

- [Parameters](./parameters) — every `@D*` parameter decorator
- [Overview](./) — installation, tsconfig, and full app wiring
