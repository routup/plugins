<div align="center">

<img src="./assets/logo.svg" alt="@routup/decorators logo: decorators pinned on a class and its methods" width="128" height="128" />

<h1>@routup/decorators</h1>

</div>

[![npm version](https://img.shields.io/npm/v/@routup/decorators)](https://www.npmjs.com/package/@routup/decorators)
[![CI](https://github.com/routup/plugins/actions/workflows/main.yml/badge.svg)](https://github.com/routup/plugins/actions/workflows/main.yml)
[![Coverage](https://codecov.io/gh/routup/plugins/branch/master/graph/badge.svg)](https://codecov.io/gh/routup/plugins)
[![Known Vulnerabilities](https://snyk.io/test/github/routup/plugins/badge.svg)](https://snyk.io/test/github/routup/plugins)

**Write routup routes as TypeScript classes with method and parameter decorators, and generate OpenAPI from them.**

You stop repeating path prefixes and reading params, body, query and cookies by hand in every handler; the same decorators feed your OpenAPI document.

[Docs](https://plugins.routup.dev/decorators/) · [Controllers](https://plugins.routup.dev/decorators/controllers) · [Parameters](https://plugins.routup.dev/decorators/parameters) · [Configuration](https://plugins.routup.dev/decorators/configuration) · [Helpers](https://plugins.routup.dev/decorators/helpers) · [Recipes](https://plugins.routup.dev/decorators/recipes)

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

Functional handlers need no compiler flags and no class instances; decorators need `experimentalDecorators` ([TypeScript settings](https://plugins.routup.dev/decorators/#typescript-settings)). Both can live on the same `App`.

## Installation

```bash
npm install @routup/decorators
```

ESM only, Node.js >=24. Peer dependency: `routup@^6.5.0`. The decorators are legacy TypeScript decorators: set `"experimentalDecorators": true` in your `tsconfig.json`, or the legacy decorator mode of your compiler ([TypeScript settings](https://plugins.routup.dev/decorators/#typescript-settings)). `@routup/body`, `@routup/cookie` and `@routup/query` are installed as dependencies; register their plugins for `@DBody()`, `@DQuery()`, `@DCookie()` and `@DCookies()`. For OpenAPI generation, also install the optional peers `@trapi/core`, `@trapi/metadata` and `@trapi/swagger`.

## Quick Start

```typescript
import { App } from 'routup';
import {
    DController,
    DGet,
    DPath,
    decorators,
} from '@routup/decorators';

@DController('/users')
class UserController {
    @DGet('/:id')
    show(@DPath('id') id: string) {
        return { id };
    }
}

export const app = new App();

app.use(decorators({ controllers: [UserController] }));
```

The sample exports the app; [serve it](https://routup.dev/guide/quickstart) from your entry file.

## Documentation

The full reference lives on [plugins.routup.dev](https://plugins.routup.dev/decorators/):

- [Overview](https://plugins.routup.dev/decorators/): requirements and TypeScript settings, what happens when, OpenAPI generation and `@routup/decorators/preset`
- [Controllers](https://plugins.routup.dev/decorators/controllers): `@DController()`, the method decorators, return values, `@DStatus()`, `@DProduces()`, middleware, inheritance and the documentation decorators
- [Parameters](https://plugins.routup.dev/decorators/parameters): every parameter decorator and what it passes in
- [Configuration](https://plugins.routup.dev/decorators/configuration): the `controllers` option
- [Helpers](https://plugins.routup.dev/decorators/helpers): `mountControllers()`, `getControllerRoutes()`, the decorator factories, the metadata functions and the types
- [Recipes](https://plugins.routup.dev/decorators/recipes): a CRUD controller, a controller with middleware, body, query and cookies, controllers under a path prefix

## License

Made with 💚

Published under [MIT License](https://github.com/routup/plugins/blob/master/LICENSE).
