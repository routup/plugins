<p align="center">
    <img src="./assets/logo.svg" alt="@routup/decorators logo: decorators pinned on a class and its methods" width="128" height="128" />
</p>

<h1 align="center">@routup/decorators</h1>

<p align="center">
    <b>Write routup routes as TypeScript classes with method and parameter decorators, and generate OpenAPI from them.</b><br>
    You stop repeating path prefixes and reading params, body, query and cookies by hand in every handler; the same decorators feed your OpenAPI document.
</p>

<p align="center">
    <a href="https://www.npmjs.com/package/@routup/decorators"><img src="https://img.shields.io/npm/v/@routup/decorators" alt="npm version" /></a>
    <a href="https://github.com/routup/plugins/actions/workflows/main.yml"><img src="https://github.com/routup/plugins/actions/workflows/main.yml/badge.svg" alt="CI" /></a>
    <a href="https://codecov.io/gh/routup/plugins"><img src="https://codecov.io/gh/routup/plugins/branch/master/graph/badge.svg" alt="Coverage" /></a>
    <a href="https://snyk.io/test/github/routup/plugins"><img src="https://snyk.io/test/github/routup/plugins/badge.svg" alt="Known Vulnerabilities" /></a>
</p>

<p align="center">
    <a href="#installation"><b>Installation</b></a>
    ·
    <a href="#usage">Usage</a>
    ·
    <a href="#options">Options</a>
    ·
    <a href="#api">API</a>
    ·
    <a href="https://plugins.routup.dev/decorators/">Docs</a>
</p>

---

## Why @routup/decorators?

With plain routup you register each route with `app.get(path, defineCoreHandler(...))`, repeat the resource prefix on every path, and pull `event.params`, the parsed body, query and cookies out of the event inside each handler. If you also publish an OpenAPI document, it is a second description of the same routes that you keep in sync by hand.

| Concern | Without it | With @routup/decorators |
|---------|-----------|-------------------------|
| Route registration | One `app.get` / `app.post` call per route, prefix repeated in each path | `@DController('/users')` on the class, `@DGet('/:id')` on the method; the route is `controller path + method path` |
| Reading input | `event.params.id`, `await readRequestBody(event)`, `useRequestQuery(event, 'page')` in the handler body | `@DPath('id')`, `@DBody()`, `@DQuery('page')` inject the values as method arguments |
| Scoped middleware | `app.use('/users', handler)` or a sub-`App` you build yourself | Middleware classes in `@DController(path, [Auth])` (whole controller) or `@DGet(path, [Auth])` (one route) |
| Several mount paths | Register the routes again under each prefix | `@DController(['/users', '/members'])` mounts the controller under both |
| OpenAPI | A spec written by hand next to the code | The `./preset` subpath lets `@trapi/metadata` read the same decorators; `@trapi/swagger` writes the document |

Functional handlers need no compiler flags and no class instances; decorators need `experimentalDecorators`. Both can live on the same `App`.

```typescript
import { DController, DGet, DPath, decorators } from '@routup/decorators';
import { App } from 'routup';

@DController('/users')
class UserController {
    @DGet('/:id')
    async show(@DPath('id') id: string) {
        return { id };
    }
}

const app = new App();

app.use(decorators({ controllers: [UserController] }));
```

**Table of Contents**

- [Installation](#installation)
- [Usage](#usage)
  - [Controllers](#controllers)
  - [Mounting controllers](#mounting-controllers)
  - [Return values and the event](#return-values-and-the-event)
  - [Success status](#success-status)
  - [Response media types](#response-media-types)
  - [Parameter decorators](#parameter-decorators)
  - [Parsers for body, query and cookies](#parsers-for-body-query-and-cookies)
  - [Middleware](#middleware)
  - [OpenAPI generation](#openapi-generation)
- [Options](#options)
- [API](#api)
  - [mountControllers](#mountcontrollers)
  - [Custom decorators](#custom-decorators)
- [Notes](#notes)
- [License](#license)

## Installation

```bash
npm install @routup/decorators --save
```

ESM only, Node.js `>=22`, peer dependency `routup@^6.1.0`. `@routup/body`, `@routup/cookie` and `@routup/query` are installed as dependencies; you still mount their plugins (see [Parsers](#parsers-for-body-query-and-cookies)). For OpenAPI generation you also install the optional peer `@trapi/core` plus `@trapi/metadata` and `@trapi/swagger` (see [OpenAPI generation](#openapi-generation)).

The decorators are legacy TypeScript decorators. Your `tsconfig.json` needs:

```json
{
    "compilerOptions": {
        "experimentalDecorators": true,
        "emitDecoratorMetadata": true
    }
}
```

If you build with a tool other than `tsc` (esbuild, SWC, Vite), enable its legacy-decorator mode as well.

## Usage

### Controllers

```typescript
import {
    DBody,
    DController,
    DDelete,
    DGet,
    DPatch,
    DPath,
    DPost,
    DPut,
} from '@routup/decorators';

@DController('/users')
export class UserController {
    @DGet('')
    async list() {
        return [{ id: 1, name: 'Ada' }];
    }

    @DGet('/:id')
    async show(@DPath('id') id: string) {
        return { id: Number(id), name: 'Ada' };
    }

    @DPost('')
    async create(@DBody() body: { name: string }) {
        return { id: 2, ...body };
    }

    @DPut('/:id')
    async replace(@DPath('id') id: string, @DBody() body: { name: string }) {
        return { id: Number(id), ...body };
    }

    @DPatch('/:id')
    async update(@DPath('id') id: string, @DBody('name') name: string) {
        return { id: Number(id), name };
    }

    @DDelete('/:id', [])
    async remove(@DPath('id') id: string) {
        return { id: Number(id), deleted: true };
    }
}
```

- The route path is the controller path joined with the method path: `show` answers `GET /users/:id`, `list` answers `GET /users`.
- Method decorators: `@DGet`, `@DPost`, `@DPut`, `@DPatch`, `@DDelete`. Each takes `(path, middlewares?)`.
- `@DController` also takes an array of paths, for example `@DController(['/users', '/members'])`. Every method is then reachable under each path.
- Methods may be `async`; the plugin awaits them.

### Mounting controllers

```typescript
import { basic } from '@routup/basic';
import { decorators } from '@routup/decorators';
import { App, serve } from 'routup';
import { UserController } from './controller';

const router = new App();

router.use(basic());
router.use(decorators({
    controllers: [UserController],
}));

serve(router, { port: 3000 });
```

- `controllers` takes classes or instances. A class is instantiated once with `new Controller()` (no constructor arguments); pass an instance when the controller needs dependencies: `controllers: [new UserController(repository)]`.
- Each controller becomes a child `App` mounted at its `@DController` path. You can mount decorator controllers and functional handlers on the same router.

### Return values and the event

```typescript
import type { IAppEvent } from 'routup';
import { DContext, DController, DGet, DPost } from '@routup/decorators';

@DController('/orders')
export class OrderController {
    @DGet('')
    async list() {
        return [{ id: 1 }, { id: 2 }];
    }

    @DGet('/raw')
    async raw() {
        return 'hello';
    }

    @DGet('/image')
    async image() {
        return new Response(new Uint8Array([137, 80, 78, 71]), {
            headers: { 'content-type': 'image/png' },
        });
    }

    @DPost('')
    async create(@DContext() event: IAppEvent) {
        event.response.status = 201;

        return { message: 'created' };
    }
}
```

- Return the value instead of sending it. routup turns objects into JSON, strings into text, and passes a `Response` through unchanged.
- Use `@DContext()` when you need the whole event, for example to set `event.response.status`, read `event.headers` or use `event.store`.

### Success status

```typescript
import { DBody, DController, DPost, DStatus } from '@routup/decorators';

@DController('/jobs')
export class JobController {
    @DStatus(202)
    @DPost('')
    async enqueue(@DBody() body: JobInput): Promise<Job> {
        return queue.add(body); // 202 application/json
    }
}
```

- `@DStatus(code)` sets the status a method answers with on success. It is written to `event.response` before the method runs, so a status the method sets itself, or a returned `Response`, still wins.
- An error thrown by the method does not inherit the status (nor the `@DProduces` media type), also with a custom error handler.
- The OpenAPI preset documents the return type under this status instead of `200`. Pass a numeric literal (e.g. `@DStatus(202)`), since trapi cannot resolve imported constants.

### Response media types

```typescript
import { DController, DGet, DProduces } from '@routup/decorators';

@DController('/events')
export class EventController {
    @DProduces('text/event-stream')
    @DGet('')
    async events(): Promise<Response> {
        return new Response(stream, { headers: { 'content-type': 'text/event-stream' } });
    }
}
```

- `@DProduces(...mediaTypes)` (on a method or a class) declares the media types a method answers with. At runtime the first one becomes the `content-type` of a returned plain value unless a header is already set or the method sets its own; a returned `Response` is left untouched.
- In the OpenAPI preset, a method-level `@DProduces` documents only the success response (the `@DStatus` code, or `200`) with these media types: as `type: string, format: binary` when all of them are binary (`application/octet-stream`, `application/pdf`, `application/zip`, `application/gzip`, `image/*`, `audio/*`, `video/*`, `font/*`, but not `*+xml` / `*+json`), or as `type: string` when all of them are `text/*`. Error responses (e.g. `@DReturns(404)`) keep `application/json`.
- Other media types, a mix, and a class-level `@DProduces` keep the return type and go to the operation-wide `produces`, since trapi cannot attach media types to the implicit return-type response.
- `@DConsumes(...mediaTypes)` (on a method or a class) declares the request body media types for the OpenAPI document; at runtime it does nothing.

### Parameter decorators

| Decorator | Injects |
|-----------|---------|
| `@DContext()` | The full `IAppEvent` |
| `@DRequest()` | The Web Standard `Request` (`event.request`) |
| `@DResponse()` | The response accumulator (`event.response`) |
| `@DNext()` | The next function (`event.next`) |
| `@DPath(name)` | One route parameter (`event.params[name]`) |
| `@DPaths()` | All route parameters (`event.params`) |
| `@DHeader(name)` | One request header (`event.headers.get(name)`, name lower-cased) |
| `@DHeaders()` | All request headers (the `Headers` object) |
| `@DBody(prop?)` | The parsed body, or one property of it (`readRequestBody` from `@routup/body`) |
| `@DQuery(prop?)` | The parsed query, or one key of it (`useRequestQuery` from `@routup/query`) |
| `@DCookie(name)` | One cookie (`useRequestCookie` from `@routup/cookie`) |
| `@DCookies()` | All cookies (`useRequestCookies` from `@routup/cookie`) |

```typescript
import {
    DController,
    DCookie,
    DGet,
    DHeader,
    DPath,
    DQuery,
} from '@routup/decorators';

@DController('/users')
export class ProfileController {
    @DGet('/:id/profile')
    async show(
        @DPath('id') id: string,
        @DQuery('include') include: string | undefined,
        @DHeader('accept-language') lang: string | null,
        @DCookie('session') session: string | undefined,
    ) {
        return { id, include, lang, session };
    }
}
```

A method without any parameter decorator receives the event as its first argument.

### Parsers for body, query and cookies

`@DBody`, `@DQuery`, `@DCookie` and `@DCookies` read what the matching plugin parsed. Mount the plugins your controllers use before `decorators()`. [`@routup/basic`](https://www.npmjs.com/package/@routup/basic) mounts all three:

```typescript
import { basic } from '@routup/basic';
import { decorators } from '@routup/decorators';
import { App } from 'routup';
import { UserController } from './controller';

const router = new App();

router.use(basic());
router.use(decorators({ controllers: [UserController] }));
```

Or pick them one by one, for example to skip cookies or change body options:

```typescript
import { body } from '@routup/body';
import { cookie } from '@routup/cookie';
import { decorators } from '@routup/decorators';
import { query } from '@routup/query';
import { App } from 'routup';
import { UserController } from './controller';

const router = new App();

router.use(body({ json: { limit: '5mb' } }));
router.use(cookie());
router.use(query());
router.use(decorators({ controllers: [UserController] }));
```

### Middleware

```typescript
import type { IAppEvent } from 'routup';
import type { HandlerInterface } from '@routup/decorators';
import { DContext, DController, DGet } from '@routup/decorators';

const UserKey = Symbol.for('app:user');

class AuthMiddleware implements HandlerInterface {
    run(event: IAppEvent) {
        event.store[UserKey] = 'ada';

        return event.next();
    }
}

class AuditMiddleware implements HandlerInterface {
    run(event: IAppEvent) {
        console.log('audit', event.path);

        return event.next();
    }
}

@DController('/account', [AuthMiddleware])
export class AccountController {
    @DGet('', [AuditMiddleware])
    async show(@DContext() event: IAppEvent) {
        return { user: event.store[UserKey] };
    }
}
```

- Middleware is a class with a `run(event)` method (`HandlerInterface`). Return `event.next()` to continue to the route; return a value to answer the request yourself.
- Classes passed to `@DController(path, [...])` run for every route of the controller. Classes passed to a method decorator run only for that method and path.
- A new middleware instance is created for every request it handles.

### OpenAPI generation

`@routup/decorators` ships a [TRAPI](https://github.com/tada5hi/trapi) preset under the `./preset` subpath. It tells `@trapi/metadata` how to read the `@D*` decorators; there is no separate generator package. Install the generator packages as dev dependencies:

```bash
npm install --save-dev @trapi/core @trapi/metadata @trapi/swagger
```

#### Programmatically

`@trapi/swagger`'s `generateSwagger()` takes pre-built metadata, so call `generateMetadata()` from `@trapi/metadata` first. Reference the preset by its package specifier; `@trapi/metadata` imports `@routup/decorators/preset` and uses its default export:

```typescript
import { generateMetadata } from '@trapi/metadata';
import { Version, generateSwagger, saveSwagger } from '@trapi/swagger';
import path from 'node:path';
import process from 'node:process';

const metadata = await generateMetadata({
    preset: '@routup/decorators/preset',
    entryPoint: {
        cwd: path.join(process.cwd(), 'src'),
        pattern: '**/*.ts',
    },
    ignore: ['**/node_modules/**'],
});

const spec = await generateSwagger({
    version: Version.V3_2,
    metadata,
    data: {
        name: 'My API',
        servers: ['http://localhost:3000/'],
    },
});

await saveSwagger(spec, { cwd: 'writable' });
```

`saveSwagger()` writes `writable/swagger.json` (the `name` and `format` options change the file name and switch to YAML).

To change the preset before generation, import `buildPreset` from `@routup/decorators/preset` and pass the returned object as `preset` instead of the string:

```typescript
import { buildPreset } from '@routup/decorators/preset';
import { generateMetadata } from '@trapi/metadata';

const preset = buildPreset();

preset.parameters = preset.parameters?.filter((handler) => handler.match.name !== 'DHeaders');

const metadata = await generateMetadata({
    preset,
    entryPoint: { cwd: 'src', pattern: '**/*.ts' },
});
```

Serve the result with [`@routup/swagger-ui`](https://www.npmjs.com/package/@routup/swagger-ui).

#### Via the trapi CLI

The `trapi` binary comes from `@trapi/cli` and takes the preset by name:

```bash
npm install --save-dev @trapi/cli
npx trapi generate --preset @routup/decorators/preset --entry-point 'src/**/*.ts' --output swagger.json
```

#### Documentation decorators

These decorators do nothing at runtime; the preset reads them into the generated document.

| Decorator | Where | Effect in the document |
|-----------|-------|------------------------|
| `@DTags(...names)` | class, method | Adds tags |
| `@DReturns<T>(status, description?, example?)` | class, method | Adds a response with that status; the type argument becomes the schema (see [Declared responses](#declared-responses)) |
| `@DConsumes(...mediaTypes)` | class, method | Sets the request body media types |
| `@DDescription<T>(status, description?, example?)` | class, method | Deprecated alias of `@DReturns` |
| `@DExample(example)` | method | Adds an example to the default response |
| `@DSecurity(scopes?, name?)` | class, method | Adds a security requirement (name defaults to `'default'`) |
| `@DDeprecated()` | class, method | Marks the operation(s) deprecated |
| `@DHidden()` | class, method | Leaves the operation(s) out of the document |

```typescript
import {
    DController,
    DGet,
    DPath,
    DReturns,
    DSecurity,
    DTags,
} from '@routup/decorators';

type User = { id: string, name: string };

@DTags('users')
@DController('/users')
export class DocumentedUserController {
    @DGet('/:id')
    @DSecurity(['users:read'], 'bearer')
    @DReturns<User>(200, 'The user')
    async show(@DPath('id') id: string): Promise<User> {
        return { id, name: 'Ada' };
    }
}
```

#### Declared responses

`@DReturns<T>(status, description?, example?)` documents a response; the type argument is the payload schema and the description defaults to the HTTP reason phrase (`409` → `Conflict`, `200` → `OK`, `Ok` for an unknown code).

- A class-level declaration applies to every operation of the controller; a method-level one at the same status wins.
- A `@DReturns` at the `@DStatus` code describes that success response instead of adding a second one.
- It only documents: when a method answers with another status, it sets that status itself.

```typescript
import type { IAppEvent } from 'routup';
import {
    DBody,
    DContext,
    DController,
    DPath,
    DPost,
    DPut,
    DReturns,
    DStatus,
} from '@routup/decorators';

@DController('/users')
@DReturns<UnauthorizedPayload>(401)
export class UserController {
    @DPost('')
    @DReturns<ConflictPayload>(409, 'User exists')
    @DReturns<ValidationPayload>(400)
    async create(@DBody() data: UserInput): Promise<UserPayload> {
        return users.create(data); // 200 UserPayload
    }

    @DPut('/:name')
    @DStatus(200)
    @DReturns<UserPayload>(201, 'Created')
    async upsert(
        @DPath('name') name: string,
        @DContext() event: IAppEvent,
    ): Promise<UserPayload> {
        const { user, created } = await users.upsert(name);

        if (created) {
            // the method sets the status; @DReturns only documents it
            event.response.status = 201;
        }

        return user; // 200 or 201 UserPayload
    }
}
```

For responses shared by every controller, pass them to `generateSwagger` as `data.responses` (an operation's own response at the same status wins), e.g. `responses: [{ name: '401', status: '401', description: 'Unauthorized' }]`.

## Options

`decorators(options)`:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `controllers` | `(ClassType \| Record<string, any>)[]` | required | Controller classes (instantiated with `new`) or controller instances to mount |

## API

| Export | Kind | Purpose |
|--------|------|---------|
| `decorators(options)` (also default export) | Plugin factory | Mounts the given controllers when installed |
| `DController(path, middlewares?)` | Class decorator | Controller path (string or string array) and controller-wide middleware |
| `DGet`, `DPost`, `DPut`, `DPatch`, `DDelete` | Method decorators | `(path, middlewares?)`: route a method for that HTTP verb |
| `DStatus(code)` | Method decorator | Success status of the method (runtime and OpenAPI) |
| `DProduces(...mediaTypes)` | Decorator | Response media types: `content-type` of a returned plain value, success response media types in OpenAPI |
| `DContext`, `DRequest`, `DResponse`, `DNext` | Parameter decorators | Inject the event, request, response accumulator or next function |
| `DPath`, `DPaths`, `DHeader`, `DHeaders` | Parameter decorators | Inject route params and request headers |
| `DBody`, `DQuery`, `DCookie`, `DCookies` | Parameter decorators | Inject parsed body, query and cookies |
| `DTags`, `DReturns`, `DConsumes`, `DExample`, `DSecurity`, `DDeprecated`, `DHidden` | Decorators | Documentation only, read by the preset |
| `DDescription` | Decorator | Deprecated alias of `DReturns` |
| `mountController(app, controller)`, `mountControllers(app, controllers)` | Functions | Mount controllers without the plugin wrapper |
| `createClassDecorator`, `createMethodDecorator`, `createParameterDecorator` | Functions | Build your own decorators on the same metadata |
| `useDecoratorMeta(target)` | Function | Read or create the metadata stored on a controller prototype |
| `buildDecoratorMethodArguments(context, parameters)` | Function | Resolve the argument list for a method from its parameter metadata |
| `createHandlerForClassType(Class, options)`, `isHandlerClassInstance(value)` | Functions | Wrap a middleware class as a routup handler; check for a `run` method |
| `ParameterType` | Enum | Parameter kinds: `context`, `request`, `response`, `next`, `param`, `header`, `body`, `query`, `cookie` |
| `Options`, `ClassType`, `HandlerInterface`, `HandlerContext`, `DecoratorMeta`, `DecoratorMethodOptions`, `DecoratorParameterOptions` | Types | Plugin options, middleware contract and metadata shapes |
| `buildPreset()`, default export (from `@routup/decorators/preset`) | TRAPI preset | Preset for `@trapi/metadata`; the default export is `buildPreset()` |

### `mountControllers`

`decorators()` is a thin wrapper around `mountControllers`. Call it yourself to mount controllers on an `App` directly:

```typescript
import { mountControllers } from '@routup/decorators';
import { App } from 'routup';
import { UserController } from './controller';

const router = new App();

mountControllers(router, [UserController]);
```

### Custom decorators

The factories write to the same metadata the built-in decorators use. For example a `@DOptions` method decorator:

```typescript
import { createMethodDecorator } from '@routup/decorators';
import type { ClassType } from '@routup/decorators';

export function DOptions(path: string, middlewares?: ClassType[]): MethodDecorator {
    return createMethodDecorator('options', path, middlewares);
}
```

A custom decorator works at runtime right away. The preset only knows the names listed above (plus `DAll`, `DHead` and `DOptions`), so other names need their own handler in a preset built from `buildPreset()`.

See the docs site for [controllers](https://plugins.routup.dev/decorators/controllers) and [parameters](https://plugins.routup.dev/decorators/parameters).

## Notes

- **Parser plugins are not optional at runtime.** Without `body()`, `@DBody()` yields `{}`; without `query()` or `cookie()`, `@DQuery()` and `@DCookies()` yield `{}` and the single-key forms yield `undefined`. Nothing throws.
- **No dependency injection.** A controller class is created with `new Controller()` and no arguments. Pass an instance if it needs constructor arguments.
- **Parameter positions matter.** Only decorated parameters are filled. If a method decorates some parameters but not others, the undecorated ones are `undefined`; a method with no parameter decorators gets the event as its first argument.
- **`@DHeader` returns `null` for a missing header** (that is what `Headers.get` returns), while `@DQuery(key)` and `@DCookie(name)` return `undefined`.
- **Documentation decorators are no-ops at runtime.** `@DSecurity` does not check anything; add a middleware for that.
- **`@trapi/core` is an optional peer.** The runtime entry never imports it; only `@routup/decorators/preset` does, so install it only where you generate the document.

## License

Made with 💚

Published under [MIT License](https://github.com/routup/plugins/blob/master/LICENSE).
