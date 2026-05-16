# @routup/decorators

[![npm version](https://badge.fury.io/js/@routup%2Fdecorators.svg)](https://badge.fury.io/js/@routup%2Fdecorators)
[![main](https://github.com/routup/plugins/actions/workflows/main.yml/badge.svg)](https://github.com/routup/plugins/actions/workflows/main.yml)
[![codecov](https://codecov.io/gh/routup/plugins/branch/master/graph/badge.svg)](https://codecov.io/gh/routup/plugins)
[![Known Vulnerabilities](https://snyk.io/test/github/routup/plugins/badge.svg)](https://snyk.io/test/github/routup/plugins)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-%23FE5196?logo=conventionalcommits&logoColor=white)](https://conventionalcommits.org)

This is a plugin to create request handlers with class-, method- & parameter-decorators.
Those, can than be bound/mounted to an arbitrary router instance.  

**Table of Contents**

- [Installation](#installation)
- [Configuration](#configuration)
- [Documentation](#documentation)
- [Usage](#usage)
- [OpenAPI generation](#openapi-generation)
- [License](#license)

## Installation

```bash
npm install @routup/decorators --save
```

## Configuration

The following TypeScript options must be present in the project tsconfig.json file:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

## Documentation

To read the docs, visit [https://routup.net](https://routup.net)

## Usage

### Controller

The first step is to define a Controller.

`controller.ts`
```typescript
import type { IAppEvent } from 'routup';
import {
    DBody,
    DContext,
    DController,
    DDelete,
    DGet,
    DPath,
    DPost,
} from '@routup/decorators';

@DController('/users')
export class UserController {
    @DGet('')
    async getMany() {
        return 'Hello, World!';
    }

    // `@DController` also accepts `string[]` to mount the controller under
    // multiple paths, e.g. `@DController(['/users', '/members'])`.

    @DGet('/:id')
    async getOne(
        @DPath('id') id: string,
    ) {
        return 'Hello, World!';
    }

    @DPost('')
    async create(
        @DBody() body: any,
    ) {
        return 'Hello, World!';
    }

    @DDelete('/:id', [])
    async delete(
        @DPath('id') id: string,
    ) {
        return 'Hello, World!';
    }
}
```

In routup v5, handlers return values directly instead of calling `send(res, data)`.
Use `@DContext()` when you need the full event object (e.g. to access `event.store`, `event.headers`, or `event.response`):

```typescript
import type { IAppEvent } from 'routup';
import { DContext, DController, DGet } from '@routup/decorators';

@DController('/example')
export class ExampleController {
    @DGet('')
    async handle(
        @DContext() event: IAppEvent,
    ) {
        event.response.status = 201;
        return { message: 'created' };
    }
}
```

### Parameter Decorators

| Decorator | Description |
|-----------|-------------|
| `@DContext()` | Full `IAppEvent` object (preferred) |
| `@DRequest()` | Web Standard `Request` (`event.request`) |
| `@DResponse()` | Response metadata (`event.response`) |
| `@DNext()` | Next function (`event.next`) |
| `@DPath(name)` | Route parameter by name |
| `@DPaths()` | All route parameters |
| `@DHeader(name)` | Request header by name |
| `@DHeaders()` | All request headers (`Headers` object) |
| `@DBody(prop?)` | Request body (requires `@routup/body`) |
| `@DQuery(prop?)` | Query parameter (requires `@routup/query`) |
| `@DCookie(name)` | Cookie by name (requires `@routup/cookie`) |
| `@DCookies()` | All cookies (requires `@routup/cookie`) |

### Installation

The last step is to install the plugin and mount the controllers to a router instance.

`@DBody`, `@DCookie`/`@DCookies`, and `@DQuery` defer to the helpers from `@routup/body`, `@routup/cookie`, and `@routup/query` — install whichever parsers your controllers actually use. The simplest setup mounts [`@routup/basic`](https://www.npmjs.com/package/@routup/basic), which bundles all three.

`app.ts`

```typescript
import { decorators } from '@routup/decorators';
import { basic } from '@routup/basic';
import { App, serve } from 'routup';

import { UserController } from './controller';

const router = new App();

router.use(basic());
router.use(decorators({
    controllers: [
        UserController,
    ],
}));

serve(router, { port: 3000 });
```

## OpenAPI generation

`@routup/decorators` ships a [TRAPI](https://github.com/trapi/trapi) preset under the `./preset` subpath that decodes routup's `@D*` decorators into the schema TRAPI's generators understand. There's no separate generator package — extract metadata with `@trapi/metadata`, hand it to `@trapi/swagger`, or wire the preset into the `trapi` CLI.

### Programmatically

`@trapi/swagger`'s `generateSwagger()` accepts pre-built metadata, so call `generateMetadata()` from `@trapi/metadata` first. Reference the preset by package specifier — `@trapi/metadata` resolves it via the `preset` export of `@routup/decorators/preset`:

```typescript
import { generateMetadata } from '@trapi/metadata';
import { generateSwagger, Version, saveSwagger } from '@trapi/swagger';
import process from 'node:process';
import path from 'node:path';

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

await saveSwagger(spec, { outputDirectory: 'writable' });
```

If you need to customise the preset before passing it in, import `buildPreset` from `@routup/decorators/preset` and supply the returned object as `preset` instead of the string identifier.

Pair the result with [`@routup/swagger-ui`](https://www.npmjs.com/package/@routup/swagger-ui) to serve the generated document at runtime.

### Via the trapi CLI

Skip the JS glue entirely — the CLI accepts the preset by name:

```bash
npx trapi --preset @routup/decorators/preset
```

`@trapi/core` is declared as an *optional* peer dependency, so runtime-only consumers of `@routup/decorators` never pay for it. Install it (alongside `@trapi/metadata` and `@trapi/swagger`) only when you actually call into the generator.

## License

Made with 💚

Published under [MIT License](./LICENSE).
