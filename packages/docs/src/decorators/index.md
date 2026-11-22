---
title: Decorators
description: Class, method and parameter decorators for routup that define controllers as TypeScript classes and mount them on an app.
relatedPlugins: [basic, body, cookie, query, swagger-ui]
plugin:
    package: '@routup/decorators'
    summary: 'Class controllers with decorators.'
    group: 'Routing patterns'
    order: 1
---

# @routup/decorators

Write routup routes as TypeScript classes: `@DController()` sets the path of a class, `@DGet()`, `@DPost()` and the other method decorators bind its methods to routes, and parameter decorators pass the path parameters, headers, body, query or cookies in as arguments. A [TRAPI](https://github.com/tada5hi/trapi) preset reads the same decorators to generate an OpenAPI document.

## Requirements

- Node.js 24 or later, ESM only
- `routup` `^6.5.0` (peer dependency)
- `@routup/body`, `@routup/cookie` and `@routup/query` are installed as dependencies. `@DBody()`, `@DQuery()`, `@DCookie()` and `@DCookies()` need their plugins registered before `decorators()`: see [Decorators and the Parsers](/guide/combining#decorators-and-the-parsers)
- For [OpenAPI generation](#openapi-generation) only: `@trapi/core`, `@trapi/metadata` and `@trapi/swagger` `^2.3.0` (optional peer dependencies). Only `@routup/decorators/preset` imports them, so install them where you generate the document. An older `@trapi/metadata` ignores `@DProduces` without an error. `@trapi/metadata` has `typescript` `>=5.0.0` as a peer dependency

### TypeScript Settings

The package supports **legacy (experimental) TypeScript decorators only**, the flavour that has parameter decorators. Standard (TC39) decorators, which TypeScript 5 and later compile when `experimentalDecorators` is off, have no parameter decorators and pass a context object instead of a property name: `tsc` rejects the controllers (`TS1206 Decorators are not valid here`, `TS1241 Unable to resolve signature of method decorator`), and code emitted anyway registers none of the method routes, so a request gets `404`. The class middlewares of `@DController()` still register, so under a guarded controller it gets `401` instead.

| Compiler | What to configure |
|----------|-------------------|
| `tsc` | `"experimentalDecorators": true` in the `compilerOptions` of `tsconfig.json` |
| esbuild, and tools built on it such as tsx | The same `tsconfig.json` setting, which the build API and tsx read. The transform API reads no file: pass `tsconfigRaw: { compilerOptions: { experimentalDecorators: true } }`. Without the setting esbuild fails with "Parameter decorators only work when experimental decorators are enabled" |
| SWC (also `unplugin-swc` for Vite or Vitest) | `jsc.parser.decorators: true` and `jsc.transform.legacyDecorator: true` |
| Node.js type stripping (`node app.ts`) | Not possible: decorators are not erasable syntax and fail with a `SyntaxError`. Compile first |

```json
{
    "compilerOptions": {
        "experimentalDecorators": true
    }
}
```

`emitDecoratorMetadata` is not needed: the package reads no design-type metadata. It does no harm when another library requires it.

## Installation

```bash
npm install @routup/decorators
```

## Quick Start

<<< @/../examples/decorators/quick-start.ts

`decorators()` returns a plugin: register it with `app.use()` ([Plugins](https://routup.dev/guide/plugins)). The file exports the app; [serve it](https://routup.dev/guide/quickstart) from your entry file.

```bash
curl http://localhost:3000/users/5
# {"id":"5"}
```

## Default Behaviour

| When | What happens |
|------|--------------|
| A class is defined | Its decorators store the paths, routes, parameters and middlewares on the class prototype. Nothing is registered yet; [`getControllerRoutes()`](/decorators/helpers#getcontrollerroutes) can already list the routes |
| `decorators({ controllers })` is called | Returns the plugin; no controller is touched |
| `app.use(decorators(...))` | Each class in `controllers` is created with `new Controller()`, without arguments; an instance is used as it is. Its middlewares and routes are added to the app at the position of this call, under each controller path. Installing the plugin again creates another instance and adds the routes again |
| A request arrives | The class middlewares run, then the middlewares of the method's route, each as a new instance; then the parameter values are read and the method is called and awaited |
| The method returns | The value becomes the response as for any routup handler; `undefined` leaves the request unanswered and a thrown error goes to the error handlers ([Return Values](/decorators/controllers#return-values)) |

Routes registered before `app.use(decorators(...))` for the same path and method answer first, and the parser plugins must come before it.

## OpenAPI Generation

The `@routup/decorators/preset` entry tells `@trapi/metadata` how to read the `@D*` decorators. `@trapi/metadata` reads the TypeScript sources with the compiler, it does not run them; `@trapi/swagger` turns the metadata into the document. Install the three packages where you generate the document:

```bash
npm install --save-dev @trapi/core @trapi/metadata @trapi/swagger
```

<<< @/../examples/decorators/openapi.ts

For the [controller of the documentation decorators](/decorators/controllers#documentation-decorators) this writes `GET /users/{id}` with the tag `users`, the `bearer` security requirement and the responses `200`, `401` and `404`, and `POST /users` with `201` and `401`.

- In place of `buildPreset()`, `preset` also takes the string `'@routup/decorators/preset'`: `@trapi/metadata` imports the entry and uses its default export.
- `saveSwagger(spec, { cwd: 'writable' })` from `@trapi/swagger` writes `writable/swagger.json`; its `name` and `format` options change the file name and switch to YAML.
- Error responses shared by every operation go to `generateSwagger()` as `data.responses`, for example `responses: [{ name: '401', status: '401', description: 'Unauthorized' }]`; an operation's own response at the same status wins.
- The document is a file or an object: serve it with [`@routup/swagger-ui`](/swagger-ui/). Nothing in `@routup/decorators` generates it at runtime.

The `trapi` binary of `@trapi/cli` takes the preset by name:

```bash
npm install --save-dev @trapi/cli
npx trapi generate --preset @routup/decorators/preset --entry-point 'src/**/*.ts' --output swagger.json
```

What each decorator adds to the document is described with the decorator: [`@DStatus()`](/decorators/controllers#dstatus), [`@DProduces()`](/decorators/controllers#dproduces), the [documentation decorators](/decorators/controllers#documentation-decorators) and the [parameter decorators](/decorators/parameters).

### `buildPreset()`

Returns a new preset object for `@trapi/metadata`. The default export of `@routup/decorators/preset` is the object `buildPreset()` returns.

```typescript
import type { Preset } from '@trapi/core';

declare function buildPreset(): Preset;
```

Change the returned object to adjust the preset, for example to leave out a parameter decorator, and pass it as `preset`:

<<< @/../examples/decorators/custom-preset.ts

The preset knows the decorators of this package by name, plus `DAll` (documented as `GET`), `DHead` and `DOptions`. A [custom decorator](/decorators/helpers#createmethoddecorator) with another name works at runtime, but needs a handler of its own in a preset built from `buildPreset()` to appear in the document.

## Next Steps

- [Controllers](/decorators/controllers): `@DController()`, the method decorators, return values, middleware, inheritance and the documentation decorators
- [Parameters](/decorators/parameters): every parameter decorator and what it passes in
- [Configuration](/decorators/configuration): the options of `decorators()`
- [Helpers](/decorators/helpers): mounting without the plugin, listing routes, custom decorators and the types
- [Recipes](/decorators/recipes): a CRUD controller, middleware, body, query and cookies, a path prefix
