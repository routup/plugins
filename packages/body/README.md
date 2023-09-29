# @routup/body

[![npm version](https://badge.fury.io/js/@routup%2Fbody.svg)](https://badge.fury.io/js/@routup%2Fbody)
[![main](https://github.com/Tada5hi/routup/actions/workflows/main.yml/badge.svg)](https://github.com/Tada5hi/routup/actions/workflows/main.yml)
[![codecov](https://codecov.io/gh/tada5hi/routup/branch/master/graph/badge.svg?token=QFGCsHRUax)](https://codecov.io/gh/tada5hi/routup)
[![Known Vulnerabilities](https://snyk.io/test/github/Tada5hi/routup/badge.svg)](https://snyk.io/test/github/Tada5hi/routup)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-%23FE5196?logo=conventionalcommits&logoColor=white)](https://conventionalcommits.org)

This is a plugin for reading and parsing the request payload.

**Table of Contents**

- [Installation](#installation)
- [Documentation](#documentation)
- [Usage](#usage)
- [Options](#options)
  - [json](#json)
  - [urlEncoded](#urlencoded)
  - [raw](#raw)
  - [text](#text)
- [Credits](#credits)
- [License](#license)

## Installation

```bash
npm install @routup/body --save
```

## Documentation

To read the docs, visit [https://routup.net](https://routup.net)

## Usage

For standard use, the package is installed as a plugin, as shown below.

```typescript
import { createServer } from 'node:http';
import { 
    createNodeDispatcher,
    coreHandler,
    Router, 
    send
} from 'routup';
import { body, useRequestBody } from '@routup/body';

const router = new Router();
// This will parse requests with Content-Type:
// application/json
// application/x-www-form-urlencoded
router.install(body());

router.get('/', coreHandler((req, res) => {
    const body = useRequestBody(req);
    console.log(body);
    // ...
}));


const server = createServer(createNodeDispatcher(router));
server.listen(3000)
```

## Options

The plugin accepts an object as input parameter to modify the default behaviour.

### `json`

To parse `application/json` input data, enable the json handler.

- Type: [Options](https://github.com/expressjs/body-parser#bodyparserjsonoptions) | `boolean`
- Default: `true`

```typescript
router.use(body({
    json: {
        limit: '100kb'
    }
}));
```

### `urlEncoded`

To parse `application/x-www-form-urlencoded` input data, enable the url-encoded handler.

- Type: [Options](https://github.com/expressjs/body-parser#bodyparserurlencodedoptions) | `boolean`
- Default: `true`

```typescript
router.use(body({
    urlEncoded: {
        extended: false
    }
}));
```

### `raw`

To parse `any` input data as Buffer, enable the raw handler.

- Type: [Options](https://github.com/expressjs/body-parser#bodyparserurlencodedoptions) | `boolean`
- Default: `false`

```typescript
router.use(body({
    raw: {
        inflate: false
    }
}));
```

### `text`

To parse `any` input data as string, enable the text handler.

- Type: [Options](https://github.com/expressjs/body-parser#bodyparsertextoptions) | `boolean`
- Default: `false`

```typescript
router.use(body({
    raw: {
        inflate: false
    }
}));
```

## Credits

This library is currently based on the [body-parser](https://www.npmjs.com/package/body-parser) library,
but this might change in the near future.

## License

Made with 💚

Published under [MIT License](./LICENSE).
