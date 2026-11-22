---
title: Decorators Controllers
description: "@DController, method decorators (@DGet, @DPost, @DPut, @DPatch, @DDelete), @DStatus, @DReturns and @DProduces."
relatedPlugins: [swagger-ui]
---

# Controllers

A controller is a class whose methods answer requests. `@DController()` gives the class its path and middlewares, a method decorator turns a method into a route, and `@DStatus()` and `@DProduces()` shape a successful response. The [documentation decorators](#documentation-decorators) only feed the OpenAPI document.

## Controller Class

### `DController()`

Sets the path, or several paths, the routes of the class are mounted under, and the middlewares that run for every request under them.

```typescript
declare function DController(url: string | string[], middlewares?: ClassType[]): ClassDecorator;
```

<<< @/../examples/decorators/paths.ts

```bash
curl http://localhost:3000/members/3
# {"id":"3"}
```

- **Several paths.** With an array, every route of the class answers under each path: `/users/:id` and `/members/:id` above.
- **Path joining.** A route's path is the controller path, a slash and the method path. A method path without a leading slash (`':id'`) gives the same route as one with it (`'/:id'`), and `''` answers at the controller path itself (`/users`).
- **Optional groups.** An optional group that starts with a slash comes after the added slash: `'{/:id}'` under `/users` becomes `/users/{/:id}`, which matches `/users/` but not `/users/5`. `'{:id}'` matches `/users/` and `/users/5`, but not `/users`. For an optional trailing id, declare two methods, `''` and `'/:id'`.
- **Middlewares.** Classes in `middlewares` run for every request whose path is under a controller path, for any HTTP method, also for a path no method of the class answers; see [Middleware](#middleware).
- **Without `@DController()`** the methods of a class are mounted at the root of the app.

## Method Decorators

Each of the five decorators binds a method to one HTTP method and a path relative to the controller path. The optional `handlers` are [middleware classes](#middleware) that run only for this route.

```typescript
declare function DGet(url: string, handlers?: ClassType[]): MethodDecorator;
```

| Decorator | HTTP method |
|-----------|-------------|
| `@DGet(url, handlers?)` | `GET` |
| `@DPost(url, handlers?)` | `POST` |
| `@DPut(url, handlers?)` | `PUT` |
| `@DPatch(url, handlers?)` | `PATCH` |
| `@DDelete(url, handlers?)` | `DELETE` |

The method may be `async`; it is awaited. [Return Values](#return-values) says how its result becomes the response. For another HTTP method, build a decorator with [`createMethodDecorator()`](/decorators/helpers#createmethoddecorator).

## Return Values

A method returns the response value instead of sending it, as any routup handler does ([Return Values](https://routup.dev/guide/handlers#return-values)).

<<< @/../examples/decorators/return-values.ts

| The method | The response |
|------------|--------------|
| Returns an object, array, number or boolean | JSON, `application/json; charset=utf-8` |
| Returns a string | Text, `text/plain; charset=utf-8` |
| Returns a `Response` | That response, unchanged; `@DStatus()` and `@DProduces()` are not applied |
| Returns `null` | An empty body with the status of `event.response` (`200`, or the `@DStatus()` code) |
| Returns `undefined` | **No response.** routup waits for `event.next()` to be called, so the request hangs until a [timeout](https://routup.dev/guide/timeouts) answers `408` ([Returning `undefined`](https://routup.dev/guide/handlers#returning-undefined)) |
| Throws | The error goes to the error handlers; without one, routup answers with the error's status (`500` for a plain `Error`) and `{"status":500,"message":"..."}` when the request accepts JSON or sends no `Accept` header, the message as plain text otherwise. `@DStatus()` and `@DProduces()` are not applied |

- To set a status or header from the method, take the event with [`@DContext()`](/decorators/parameters#dcontext) (`event.response.status = 201` above) or the response accumulator with [`@DResponse()`](/decorators/parameters#dresponse).
- To hand the request on to the next matching handler, return `event.next()` from a method that takes the event with `@DContext()`.

## Response Status and Media Type

<<< @/../examples/decorators/status.ts

```bash
curl -i -X POST http://localhost:3000/jobs
# HTTP/1.1 202 Accepted
# content-type: application/json; charset=utf-8
#
# {"id":"job-1","state":"queued"}
curl -i http://localhost:3000/jobs/export
# HTTP/1.1 200 OK
# content-type: text/csv
#
# id,state
# job-1,queued
```

### `DStatus()`

Sets the status a method answers with on success.

```typescript
declare function DStatus(status: number): MethodDecorator;
```

- **Applied after the method returned a value**, neither `undefined` nor a `Response`, and only when the method left `event.response.status` as it was. A status the method sets itself, or a returned `Response`, wins. The method cannot read the code from `event.response` while it runs, and setting the status it already had (`200`) cannot be told apart from leaving it.
- **`204` needs `null`.** A method that returns nothing does not answer the request ([Return Values](#return-values)).
- **Not passed on.** Neither an error thrown by the method nor a handler it hands over to with `event.next()` gets the status (nor the `@DProduces()` media type), also with a custom error handler. Neither does a returned value routup fails to serialize, such as an object holding a `BigInt`: the error handlers see the status and `content-type` the method left.
- **An integer from `200` to `599`**, the range a `Response` accepts. Any other value throws a `RangeError` when the class is defined.
- The order of `@DStatus()` and the method decorator does not matter.
- **OpenAPI:** the return type is documented under this status instead of `200`, described by its reason phrase (`202` gives `Accepted`). `204`, `205` and `304` are documented without a body, whatever the return type. The code can be a literal or a numeric constant or enum member (`@DStatus(HttpStatus.Created)`); anything the generator cannot resolve, such as a call, fails generation.

### `DProduces()`

Declares the media types a method, or every method of a class, answers with.

```typescript
declare function DProduces(...mediaTypes: string[]): (target: any, propertyKey?: string | symbol) => void;
```

- **Runtime:** the first media type becomes the `content-type` of a returned plain value, unless a `content-type` header is already set or the method sets its own. A returned `Response` is left untouched. Like `@DStatus()`, it is applied after the method returned, so the method cannot read it from `event.response.headers`.
- A method-level `@DProduces()` replaces the class-level one.
- **OpenAPI:** it documents only the success response (the `@DStatus()` code, or `200`) with these media types; error responses, such as a `@DReturns(404)`, keep `application/json`. Swagger 2.0 has no media types per response, so there they are the `produces` of the operation.
- **OpenAPI schema:** when the return type says nothing about the payload (`Response`, `Blob`, `File`, `Buffer`, `Uint8Array`, `ArrayBuffer`, `ReadableStream`, `any`, `unknown`, a union of them, also with `null` or `undefined`, or no return value), a method-level `@DProduces()` also sets the schema of that response:
  - `type: string` when all media types are text (`text/*`, YAML, JavaScript, NDJSON, form-urlencoded)
  - `type: string, format: binary` when all of them are other non-JSON, non-XML types (`application/pdf`, `image/png`, `application/vnd.ms-excel`, ...)
  - no schema for JSON, XML, wildcards or a mix

  Any other return type, and the return type under a class-level `@DProduces()`, is kept as the schema. A schema declared with `@DReturns<T>()` at the same status takes precedence. `Response`, `Blob` and `File` are matched by name, so do not give a payload type of your own one of these names.

## Middleware

A middleware is a class with a `run(event)` method, the [`HandlerInterface`](/decorators/helpers#types). Return `event.next()` to continue to the route, or return a value or throw to answer the request yourself. The [middleware recipe](/decorators/recipes#a-controller-with-middleware) shows both kinds.

| Passed to | Runs for |
|-----------|----------|
| `@DController(path, [Middleware])` | Every request whose path is under a controller path, for any HTTP method, also when no method of the class answers it |
| `@DGet(path, [Middleware])` and the other method decorators | Requests that match this route's method and path |

- Class middlewares run first, then those of the route, in array order.
- **A new instance is created for every request**, with `new Middleware()` and no arguments; keep state in `event.store`, not in the instance.
- A class without a `run()` method fails the request.

## Inheritance

A controller can extend a decorated class:

<<< @/../examples/decorators/inheritance.ts

- **What is inherited.** A subclass inherits the routes of its parent with their parameter decorators, `@DStatus()` and `@DProduces()`, and the controller path, middlewares and class-level `@DProduces()`.
- **Its own copy.** On first use a subclass gets its own copy of that metadata. Its decorators add to or overwrite the copy as on a class without a parent; the built-in decorators and the `create*` factories never change the parent or another subclass:
  - an override with a method decorator (`@DGet()`, ...) replaces the route of that method, including its inherited method middlewares (repeat them on the override), and keeps its inherited parameter decorators; the override's own are added, and at an index the parent used only the override's parameter decorator is applied
  - its `@DStatus()` overwrites the inherited status, and its `@DProduces()` media types come before the inherited ones, so they are sent
  - an override without decorators keeps the inherited route, which calls the override
  - `@DController(path)` without middlewares starts from the class middlewares of the parent (dropping what a decorator below it added); an array, also `[]`, replaces them
- **Order.** Inherited routes are registered first, in the declaration order of the parent: with a parent `@DGet('/:id')`, a subclass's `@DGet('/me')` is answered by the parent's route. Declare such a static route in the parent, or let the parent's method hand it over with `event.next()`.
- **Decorate the parent first.** A subclass takes its copy at its first decorator, so a decorator applied to the parent by hand after the subclass is defined does not reach it. Place a class decorator that seals or freezes the class above `@DController()`; below it, a subclass without decorators of its own on its members shares the metadata of the parent.
- **Custom decorators replace values.** The copy holds the fields a custom decorator stored by reference: assign a new value instead of changing the inherited one in place, or the parent changes too.
- **OpenAPI.** The preset lists inherited methods only for a class with its own `@DController()`, does not inherit the class-level decorators of a parent, and documents a method from one declaration (the override when it has a method decorator, else the parent's), while the runtime combines the inherited parameter decorators and response options with those of the override.

## Documentation Decorators

These decorators do nothing at runtime; the [OpenAPI preset](/decorators/#openapi-generation) reads them from the source. `@DSecurity()` checks nothing: guard the route with a [middleware](#middleware).

<<< @/../examples/decorators/openapi/user-controller.ts

| Decorator | On | Effect in the document |
|-----------|----|------------------------|
| `@DTags(...names)` | class, method | Adds tags |
| `@DReturns<T>(status, description?, example?)` | class, method | Adds a response with that status; the type argument is its schema |
| `@DConsumes(...mediaTypes)` | class, method | Sets the request body media types |
| `@DDescription<T>(status, description?, example?)` | class, method | Deprecated alias of `@DReturns()` |
| `@DExample(example)` | method | Adds an example to the default response |
| `@DSecurity(scopes?, name?)` | class, method | Adds a security requirement, named `'default'` without `name` |
| `@DDeprecated()` | class, method | Marks the operations deprecated |
| `@DHidden()` | class, method | Leaves the operations out of the document |

### `DReturns()`

Documents a response: the type argument is the payload schema, and the description defaults to the reason phrase of the status (`409` gives `Conflict`, `200` gives `Ok`, an unknown code `Ok`).

```typescript
declare function DReturns<T>(status: number | string, description?: string, example?: T): any;
```

- A class-level declaration applies to every operation of the controller; a method-level one at the same status wins. A class-level success code is kept next to a different `@DStatus()` code, since a method can answer with either (an upsert that sets `200` or `201` itself, for example).
- A `@DReturns()` at the `@DStatus()` code describes that success response instead of adding a second one. Without a type argument it keeps the return type as the schema, for example `@DReturns(200, 'The user')`.
- The status is a literal (`409` or `'409'`), a constant or enum member (`HttpStatus.Conflict`), a range (`'4XX'`) or `'default'`. A status the generator cannot resolve, such as a call, or that is none of these, fails generation with an error naming the decorator and the method, instead of documenting the response at `200`.
- It only documents: when a method answers with another status, the method sets that status itself, for example with `@DContext()` and `event.response.status = 201`.

### `DDescription()`

Deprecated: use `@DReturns()`, which takes the same arguments.

```typescript
declare function DDescription<T>(name: string | number, description?: string, example?: T): any;
```

### `DSecurity()`

`roles` are the scopes of the requirement: an array, or one string.

```typescript
declare function DSecurity(roles?: string | string[], name?: string): (...args: any) => void;
```
