---
title: Decorators Parameters
description: Parameter decorators with built-in body, cookie, and query extraction.
relatedPlugins: [body, cookie, query, basic]
---

# Parameters

A parameter decorator tells the plugin what to pass in as that argument when the method is called. The values are read for each request, before the method runs.

<<< @/../examples/decorators/request.ts

```bash
curl -H 'accept-language: de' http://localhost:3000/files/docs/a.txt
# {"name":"a.txt","params":{"folder":"docs","name":"a.txt"},"language":"de","method":"GET"}
```

- **Only decorated parameters are filled.** When a method decorates some parameters but not others, the undecorated ones are `undefined`. A method without any parameter decorator gets the event as its first argument.
- **One decorator per parameter.** With two on the same parameter, the outer one, which TypeScript applies last, wins, and only it reads the request.
- **Missing values.** `@DHeader()` gives `null` for a missing header (what `Headers.get()` returns); `@DPath()`, `@DBody(name)`, `@DQuery(name)` and `@DCookie()` give `undefined`.
- **No validation or conversion.** Values arrive as the request or the parser plugin has them: a path parameter `'5'` stays a string, whatever the parameter's type says.
- **OpenAPI.** The preset types each parameter with its TypeScript type. A decorator with a name becomes a path, query, header or cookie parameter of that name, and `@DBody(name)` a property of the request body object; `@DBody()` is the whole body. Without a name, `@DQuery()` and `@DPaths()` with an object type give one parameter per property, and the other decorators one parameter named after the TypeScript parameter.

## Request Event

These read the request event and need no plugin.

### `DContext()`

Passes in the whole event, `IAppEvent`: use it to set `event.response.status`, read `event.store` or call `event.next()`.

```typescript
declare function DContext(): ParameterDecorator;
```

### `DRequest()`

Passes in the Web `Request`, `event.request`.

```typescript
declare function DRequest(): ParameterDecorator;
```

### `DResponse()`

Passes in the response accumulator, `event.response`, whose `status` and `headers` routup applies to the response it builds from the return value.

```typescript
declare function DResponse(): ParameterDecorator;
```

### `DNext()`

Passes in `event.next` without its event: calling it as `next()` throws a `TypeError` and the request fails with `500`. To hand the request on, take the event with `@DContext()` and return `event.next()`.

```typescript
declare function DNext(): ParameterDecorator;
```

### `DPath()`

Passes in one route parameter, `event.params[name]`.

```typescript
declare function DPath(property: string): ParameterDecorator;
```

### `DPaths()`

Passes in all route parameters, `event.params`.

```typescript
declare function DPaths(): ParameterDecorator;
```

### `DHeader()`

Passes in one request header, `event.headers.get(name)`, with the name lower-cased: a string, or `null` when the header is missing.

```typescript
declare function DHeader(property: string): ParameterDecorator;
```

### `DHeaders()`

Passes in all request headers, the `Headers` object.

```typescript
declare function DHeaders(): ParameterDecorator;
```

## Body, Query and Cookies

These read what a parser plugin provides: register `body()`, `query()` or `cookie()`, or `basic()` for all three, before `decorators()`. Without its plugin, a decorator with a name gives `undefined` and one without a name gives `{}`; nothing throws. [Decorators and the Parsers](/guide/combining#decorators-and-the-parsers) shows the setup; the [body, query and cookies recipe](/decorators/recipes#body-query-and-cookies) uses each form.

### `DBody()`

Passes in the parsed body, or with `property` one own property of an object body: `undefined` for a missing or inherited property, and when the body is an array, a primitive or `null`. It reads the body with `readRequestBody()` from [`@routup/body`](/body/helpers); a body the parser rejects, such as malformed JSON, fails the request with the parser's error (`400`).

```typescript
declare function DBody(property?: string): ParameterDecorator;
```

### `DQuery()`

Passes in the parsed query, or with `property` one key of it, read with `useRequestQuery()` from [`@routup/query`](/query/helpers).

```typescript
declare function DQuery(property?: string): ParameterDecorator;
```

### `DCookie()`

Passes in one cookie, read with `useRequestCookie()` from [`@routup/cookie`](/cookie/helpers): a string, or `undefined`.

```typescript
declare function DCookie(property: string): ParameterDecorator;
```

### `DCookies()`

Passes in all cookies, read with `useRequestCookies()` from [`@routup/cookie`](/cookie/helpers).

```typescript
declare function DCookies(): ParameterDecorator;
```
