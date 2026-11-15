---
title: Decorators — Controllers
description: "@DController, method decorators (@DGet, @DPost, @DPut, @DPatch, @DDelete), @DStatus, @DReturns and @DProduces."
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

The status is written to `event.response.status` after the method returned a value other than `undefined` or a `Response`, and only when the method left the status as it was. So:

- a status the method sets itself (`event.response.status = 201`) still wins; setting the status it already had (`200`) cannot be told apart from leaving it,
- a returned `Response` keeps its own status (routup ignores `event.response` for it),
- the method cannot read the declared status from `event.response` while it runs,
- a parameter error (e.g. a malformed JSON body) still answers with its own status,
- neither an error thrown by the method nor a handler it hands over to with `event.next()` inherits it (nor the `@DProduces` media type), also with a custom error handler,
- a returned value routup fails to serialize (e.g. an object holding a `BigInt`) fails after the status and media type were applied, so a custom error handler that answers with a value gets them.

`@DStatus(204)` needs a method that returns `null`: a method that returns nothing (`undefined`) hands the request over to the next handler in routup. The OpenAPI preset documents `204`, `205` and `304` as responses without a body, whatever the return type.

The OpenAPI preset documents the return type under this status instead of `200`, described by its reason phrase (`202` → `Accepted`). The code can be a literal or a numeric constant or enum member (`@DStatus(HttpStatus.Created)`). Generation fails on a code it cannot resolve, such as a call, and on anything that is not a three-digit status code.

## Declared responses

`@DReturns<T>(status, description?, example?)` documents a response of a method: the type argument is the payload schema, the description defaults to the HTTP reason phrase of the status (`409` → `Conflict`, `200` → `Ok`, `Ok` for an unknown code). It only affects the OpenAPI document; at runtime it does nothing.

```typescript
import { DBody, DController, DPost, DReturns } from '@routup/decorators';

@DController('/users')
export class UserController {
    @DPost('')
    @DReturns<ConflictPayload>(409, 'User exists')
    @DReturns<ValidationPayload>(400)
    async create(@DBody() data: UserInput): Promise<UserPayload> {
        return users.create(data);    // → 200 UserPayload
    }
}
```

The return type stays the success response (`200 UserPayload`); `409` and `400` are added next to it. Further success statuses can be listed next to the `@DStatus` one:

```typescript
@DPut('/:name')
@DStatus(200)
@DReturns<UserPayload>(201, 'Created')
async upsert(
    @DPath('name') name: string,
    @DContext() event: IAppEvent,
): Promise<UserPayload> {
    const { user, created } = await users.upsert(name);

    if (created) {
        event.response.status = 201;   // the method sets the status at runtime
    }

    return user;                       // → 200 or 201 UserPayload
}
```

`@DReturns` only documents the `201`; the method sets it itself.

A `@DReturns` at the `@DStatus` code (or at `200` without one) describes that success response instead of adding a second one; without a type argument the return type stays its schema.

As for `@DStatus`, the status is a literal (`409` or `'409'`) or a constant or enum member (`HttpStatus.Conflict`); a range (`'4XX'`) and `'default'` work too. A status the generator cannot resolve, such as a call, or that is none of these, fails generation with an error naming the decorator and the method, instead of documenting the response at `200`.

On a class, `@DReturns` applies to every operation of the controller; a method-level declaration at the same status wins:

```typescript
@DController('/users')
@DReturns<UnauthorizedPayload>(401)
export class UserController { /* ... */ }
```

For responses shared by every controller, pass them to `generateSwagger`'s `data.responses` (an operation's own response at the same status wins): `responses: [{ name: '401', status: '401', description: 'Unauthorized' }]`.

`@DDescription` is a deprecated alias of `@DReturns`.

## Response media types

`@DConsumes(...mediaTypes)` (on a method or a class) declares the request body media types for the OpenAPI document; at runtime it does nothing.

`@DProduces(...mediaTypes)` declares what a method answers with. Put it on a class to apply it to every method; a method-level `@DProduces` replaces the class-level one at runtime.

```typescript
import { DController, DGet, DProduces } from '@routup/decorators';

@DController('/exports')
export class ExportController {
    @DProduces('text/csv')
    @DGet('/users.csv')
    async users(): Promise<string> {
        return 'id,name\n1,Ada';          // → text/csv
    }

    @DProduces('application/octet-stream')
    @DGet('/archive')
    async archive(): Promise<Response> {
        return new Response(stream);      // headers left untouched
    }
}
```

At runtime the first media type becomes the `content-type` of a returned plain value (string, object, `Uint8Array`, …), unless a header is already set or the method sets its own. It is set after the method returned, like the `@DStatus` code, so the method cannot read it from `event.response.headers`. A returned `Response` is left untouched, so set its `content-type` yourself.

In the OpenAPI preset the media types of `@DProduces` document the success response (the `@DStatus` code, or `200`) only; error responses such as `@DReturns(404)` keep `application/json`. A method-level `@DProduces` replaces the class-level one, as at runtime.

Some return types say nothing about the payload: `Response`, `Blob`, `File`, `Buffer`, `Uint8Array`, `ArrayBuffer`, `ReadableStream`, `any`, `unknown`, a union of them, also with `null` or `undefined`, or no return value. For such a method, a method-level `@DProduces` also sets the schema of the success response:

| Media types of a method-level `@DProduces` | Schema of the success response |
|---|---|
| all text: `text/*` (e.g. `text/event-stream`, `text/csv`, `text/xml`), YAML, JavaScript, NDJSON, `application/x-www-form-urlencoded` | `type: string` |
| all other types except the ones below (e.g. `application/pdf`, `application/zip`, `image/png`, `application/vnd.ms-excel`) | `type: string, format: binary` |
| JSON or XML (`application/json`, `application/xml`, `*+json`, `*+xml` such as `image/svg+xml`), `multipart/*`, a wildcard, or a mix of kinds | unspecified (any value) |

A return type that describes the payload (an object type, `string`, …) is kept whatever the media types are, and so is the return type under a class-level `@DProduces`. A schema declared with `@DReturns<T>(status, …)` at the same status takes precedence. `Response`, `Blob` and `File` are matched by name, so do not give an own payload type one of these names. A media type the generator cannot resolve, such as a call, fails generation. Swagger 2.0 has no media types per response, so there they are the `produces` of the operation.

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
