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
import {
    DBody,
    DController,
    DDelete,
    DGet,
    DNext,
    DParam,
    DPost,
    DRequest,
    DResponse,
} from '@routup/decorators';

import {
    Next,
    Request,
    Response,
    send,
} from 'routup';

@DController('/users')
export class UserController {
    @DGet('')
    async getMany(
        @DRequest() req: Request,
        @DResponse() res: Response,
        @DNext() next: Next
    ) {
        return 'Hello, World!';
    }

    @DGet('/:id')
    async getOne(
        @DRequest() req: Request,
        @DResponse() res: Response,
        @DParam('id') id: string,
    ) {
        return 'Hello, World!';
    }

    @DPost('')
    async create(
        @DRequest() req: Request,
        @DResponse() res: Response,
        @DBody() body: any,
    ) {
        return 'Hello, World!';
    }

    @DDelete('/:id', [])
    async delete(
        @DRequest() req: Request,
        @DResponse() res: Response,
        @DParam('id') id: string,
    ) {
        return 'Hello, World!';
    }
}
```

### Installation

The last step is to install the plugin and mount the controllers to a router instance.

`app.ts`
```typescript
import { UserController } from './controller';
import { decorators } from '@routup/decorators';
import { createServer } from 'node:http';
import { createNodeDispatcher, Router } from 'routup';

const router = new Router();

router.use(decorators({
    controllers: [
        UserController
    ]
}))

const server = createServer(createNodeDispatcher(router));
server.listen(3000);

```

## License

Made with 💚

Published under [MIT License](./LICENSE).
