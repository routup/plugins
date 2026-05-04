# @routup/decorators

[![npm version](https://badge.fury.io/js/@routup%2Fdecorators.svg)](https://badge.fury.io/js/@routup%2Fdecorators)
[![main](https://github.com/Tada5hi/routup/actions/workflows/main.yml/badge.svg)](https://github.com/Tada5hi/routup/actions/workflows/main.yml)
[![codecov](https://codecov.io/gh/tada5hi/routup/branch/master/graph/badge.svg?token=QFGCsHRUax)](https://codecov.io/gh/tada5hi/routup)
[![Known Vulnerabilities](https://snyk.io/test/github/Tada5hi/routup/badge.svg)](https://snyk.io/test/github/Tada5hi/routup)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-%23FE5196?logo=conventionalcommits&logoColor=white)](https://conventionalcommits.org)

This is a plugin to create request handlers with class-, method- & parameter-decorators.
Those, can than be bound/mounted to an arbitrary router instance.  

**Table of Contents**

- [Installation](#installation)
- [Configuration](#configuration)
- [Documentation](#documentation)
- [Usage](#usage)
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
import type { IRoutupEvent } from 'routup';
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
import type { IRoutupEvent } from 'routup';
import { DContext, DController, DGet } from '@routup/decorators';

@DController('/example')
export class ExampleController {
    @DGet('')
    async handle(
        @DContext() event: IRoutupEvent,
    ) {
        event.response.status = 201;
        return { message: 'created' };
    }
}
```

### Parameter Decorators

| Decorator | Description |
|-----------|-------------|
| `@DContext()` | Full `IRoutupEvent` object (preferred) |
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
import { Router, serve } from 'routup';

import { UserController } from './controller';

const router = new Router();

router.use(basic());
router.use(decorators({
    controllers: [
        UserController,
    ],
}));

serve(router, { port: 3000 });
```

## License

Made with 💚

Published under [MIT License](./LICENSE).
