# @routup/basic

[![npm version](https://badge.fury.io/js/@routup%2Fbasic.svg)](https://badge.fury.io/js/@routup%2Fbasic)
[![main](https://github.com/routup/plugins/actions/workflows/main.yml/badge.svg)](https://github.com/routup/plugins/actions/workflows/main.yml)
[![codecov](https://codecov.io/gh/routup/plugins/branch/master/graph/badge.svg)](https://codecov.io/gh/routup/plugins)
[![Known Vulnerabilities](https://snyk.io/test/github/routup/plugins/badge.svg)](https://snyk.io/test/github/routup/plugins)
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

The modules **body**, **cookie** and **query** have an individual
export path as shown in the following code snippet.

```typescript
import {
    defineCoreHandler,
    App,
    serve,
} from 'routup';
import { basic } from '@routup/basic';
import { readRequestBody } from '@routup/basic/body';
import { useRequestCookie, useRequestCookies } from '@routup/basic/cookie';
import { useRequestQuery } from '@routup/basic/query';

const router = new App();

router.use(basic());

router.post('/', defineCoreHandler(async (event) => {
    const body = await readRequestBody(event);
    // { key: value, ... }
    
    const cookies = useRequestCookies(event);
    // { key: value, ... }
    
    const cookie = useRequestCookie(event, 'key');
    // value
    
    const query = useRequestQuery(event);
    // query
}));

serve(router, { port: 3000 });
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
