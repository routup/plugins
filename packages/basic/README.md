# @routup/basic

[![npm version](https://badge.fury.io/js/@routup%2Fbasic.svg)](https://badge.fury.io/js/@routup%2Fbasic)
[![main](https://github.com/Tada5hi/routup/actions/workflows/main.yml/badge.svg)](https://github.com/Tada5hi/routup/actions/workflows/main.yml)
[![codecov](https://codecov.io/gh/tada5hi/routup/branch/master/graph/badge.svg?token=QFGCsHRUax)](https://codecov.io/gh/tada5hi/routup)
[![Known Vulnerabilities](https://snyk.io/test/github/Tada5hi/routup/badge.svg)](https://snyk.io/test/github/Tada5hi/routup)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-%23FE5196?logo=conventionalcommits&logoColor=white)](https://conventionalcommits.org)

This is a bundle plugin which includes the following plugins:
- [body](../body/README.md) A plugin for reading and parsing the request payload.
- [cookie](../cookie/README.md) A plugin for reading and parsing request cookies, as well serializing cookies for the response.
- [query](../query/README.md) A plugin for reading and parsing the query string of the request url.

**Table of Contents**

- [Installation](#installation)
- [Documentation](#documentation)
- [Usage](#usage)
- [License](#license)

## Installation

```bash
npm install @routup/basic --save
```

## Documentation

To read the docs, visit [https://routup.net](https://routup.net)

## Usage

```typescript
import { createServer } from 'node:http';
import {
    createNodeDispatcher,
    coreHandler,
    Router
} from 'routup';
import {
    basic,
    useRequestBody,
    useRequestCookie,
    useRequestCookies,
    useRequetQuery
} from '@routup/basic';

const router = new Router();

router.use(basic());

router.get('/', coreHandler((req, res) => {
    const body = useRequestBody(req);
    // { key: value, ... }
    
    const cookies = useRequestCookies(req);
    // { key: value, ... }
    
    const cookie = useRequestCookie(req, 'key');
    // value
    
    const query = useRequetQuery(req);
    // query
}));

const server = createServer(createNodeDispatcher(router));
server.listen(3000);
```

## Options

### `body`

Configure the body plugin.

- Type: [Options](../body/README.md#options) | `boolean`
- Default: `true`

### `cookie`

Configure the cookie plugin.

- Type: [Options](../cookie/README.md#options) | `boolean`
- Default: `true`

### `query`

Configure the query plugin.

- Type: [Options](../query/README.md#options) | `boolean`
- Default: `true`

## License

Made with 💚

Published under [MIT License](./LICENSE).
