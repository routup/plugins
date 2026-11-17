---
title: Decorators Helpers
description: Functions and types exported by @routup/decorators besides the decorators.
relatedPlugins: [swagger-ui]
---

# Helpers and API

The exports of `@routup/decorators` besides the decorators, which are on [Controllers](/decorators/controllers) and [Parameters](/decorators/parameters). The `@routup/decorators/preset` entry is described under [OpenAPI Generation](/decorators/#openapi-generation).

## Plugin

### `decorators()`

Creates the plugin, named `decorators`. It is also the default export. The plugin mounts the controllers with [`mountControllers()`](#mountcontrollers) when it is installed with `app.use()`, not when `decorators()` is called ([`controllers`](/decorators/configuration#controllers)).

```typescript
declare function decorators(options: Options): Plugin;
```

## Mounting

### `mountController()`

Mounts one controller, a class or an instance, on an app right away: a class is created with `new Controller()`, and the routes are added under each `@DController()` path.

```typescript
declare function mountController(router: IApp, input: ClassType | Record<string, any>): void;
```

### `mountControllers()`

Calls [`mountController()`](#mountcontroller) for each element, in order. It is what the plugin does at install, without the plugin wrapper.

```typescript
declare function mountControllers(router: IApp, input: (ClassType | Record<string, any>)[]): void;
```

<<< @/../examples/decorators/mount-controllers.ts

### `getControllerRoutes()`

Lists the routes a controller instance or class is mounted under, without mounting it and without creating an instance of a class.

```typescript
declare function getControllerRoutes(input: ClassType | Record<string, any>): ControllerRoute[];
```

<<< @/../examples/decorators/list-routes.ts

- One entry per controller path and decorated method, ordered by controller path, then by declaration. Only routes bound to a method are listed, so middlewares are not.
- `method` is upper case, and `path` is joined as the mount joins it, relative to the app the controller is mounted on: mounted under `app.use('/api', ...)`, the route answers at `/api/users`, but is listed as `/users`.
- A target without decorator metadata, or a value that is neither an object nor a class, gives `[]` and gains no metadata entry.

## Custom Decorators

The factories write to the same metadata as the built-in decorators, which use them. A custom decorator works at runtime right away; to appear in an OpenAPI document it needs a handler in a [preset built from `buildPreset()`](/decorators/#buildpreset), unless its name is one the preset knows.

### `createClassDecorator()`

Creates a decorator like `@DController()`: it sets the controller path and middlewares.

```typescript
declare function createClassDecorator(url: string | string[], middlewares?: ClassType[]): ClassDecorator;
```

### `createMethodDecorator()`

Creates a method decorator for any HTTP method, given in lower case, such as `'options'`.

```typescript
declare function createMethodDecorator(method: string, url: string, handlers?: ClassType[]): MethodDecorator;
```

<<< @/../examples/decorators/custom-decorator.ts

```bash
curl -X OPTIONS http://localhost:3000/uploads
# {"methods":["OPTIONS","PUT"]}
```

### `createParameterDecorator()`

Creates a parameter decorator that passes in one of the [`ParameterType`](#other-exports) values, with an optional `property` (the name of `@DPath()`, `@DHeader()`, `@DBody()` and so on).

```typescript
declare function createParameterDecorator(type: `${ParameterType}`, property?: string): ParameterDecorator;
```

The types are fixed: a type that is not a `ParameterType` value fails the request with `SyntaxError: Parameter <type> could not be extracted.`

## Metadata

The metadata of a controller lives on its class prototype. These functions read or create it, for custom decorators and tooling.

### `useDecoratorMeta()`

Returns the metadata of a target, creating an empty entry when there is none. A class prototype that inherits the metadata of a decorated parent gets its own copy on first use, also by a plain read ([Inheritance](/decorators/controllers#inheritance)); an instance reads it through its prototype chain.

```typescript
declare function useDecoratorMeta(target: Record<string, any>): DecoratorMeta;
```

### `hasDecoratorMeta()`

Tells whether a controller instance or class carries metadata, without creating an entry as `useDecoratorMeta()` does. `false` for a function without a prototype, such as an arrow or bound function.

```typescript
declare function hasDecoratorMeta(target: Record<string, any>): boolean;
```

### `useDecoratorResponseOptions()`

Returns the response options of one method (what `@DStatus()` and a method-level `@DProduces()` write), creating them when there are none. It resolves the metadata as `useDecoratorMeta()` does.

```typescript
declare function useDecoratorResponseOptions(target: Record<string, any>, propertyKey: string): DecoratorResponseOptions;
```

### `buildDecoratorMethodArguments()`

Resolves the argument list of a method from its parameter metadata, as the plugin does before each call. An empty list gives `[event]`. When several entries share an index, only the last one is read.

```typescript
declare function buildDecoratorMethodArguments(context: HandlerContext, parameters: DecoratorParameterOptions[]): Promise<any[]>;
```

## Middleware Helpers

### `createHandlerForClassType()`

Wraps a middleware class as a routup handler that creates a new instance for each request and calls its `run(event)`. `options` are handler options such as `method` and `path`; the plugin passes the route's method and path for method middlewares and none for class middlewares.

```typescript
declare function createHandlerForClassType(item: ClassType, options: Partial<CoreHandlerOptions>): Handler;
```

### `isHandlerClassInstance()`

Tells whether a value is an object with a `run` function, a [`HandlerInterface`](#types).

```typescript
declare function isHandlerClassInstance(input: unknown): input is HandlerInterface;
```

## Types

| Type | Definition |
|------|------------|
| `Options` | `{ controllers: (ClassType \| Record<string, any>)[] }` ([Options](/decorators/configuration#options)) |
| `ClassType` | A constructor: `Function & { new(...args: any[]): any }` |
| `ControllerRoute` | `{ method: string, path: string }`, an entry of `getControllerRoutes()` |
| `HandlerInterface` | `{ run(event: IAppEvent): Promise<unknown> \| unknown }`, the shape of a middleware class instance |
| `HandlerContext` | `{ event: IAppEvent }`, the context of `buildDecoratorMethodArguments()` |
| `DecoratorMeta` | `{ url, methods, middlewares, produces, responses, parameters }`, the metadata of a controller |
| `DecoratorMethodOptions` | `{ method: string, url: string, middlewares: ClassType[] }`, an entry of `DecoratorMeta.methods` |
| `DecoratorParameterOptions` | ``{ index: number, type: `${ParameterType}`, property?: string }``, an entry of `DecoratorMeta.parameters` |
| `DecoratorResponseOptions` | `{ status?: number, produces?: string[] }`, an entry of `DecoratorMeta.responses` |

## Other Exports

| Export | Description |
|--------|-------------|
| `ParameterType` | Enum of the parameter kinds: `CONTEXT` (`'context'`), `REQUEST`, `RESPONSE`, `NEXT`, `PARAM`, `HEADER`, `COOKIE`, `QUERY`, `BODY`, each the lower-case name |
| `isObject` | `true` for a value that is an object and not `null` or an array |
