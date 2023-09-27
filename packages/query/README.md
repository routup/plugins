# @routup/query

[![npm version](https://badge.fury.io/js/@routup%2Fquery.svg)](https://badge.fury.io/js/@routup%2Fquery)
[![main](https://github.com/Tada5hi/routup/actions/workflows/main.yml/badge.svg)](https://github.com/Tada5hi/routup/actions/workflows/main.yml)
[![codecov](https://codecov.io/gh/tada5hi/routup/branch/master/graph/badge.svg?token=CLIA667K6V)](https://codecov.io/gh/tada5hi/routup)
[![Known Vulnerabilities](https://snyk.io/test/github/Tada5hi/routup/badge.svg)](https://snyk.io/test/github/Tada5hi/routup)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-%23FE5196?logo=conventionalcommits&logoColor=white)](https://conventionalcommits.org)

This is a plugin for reading and parsing the query string of the request url.

**Table of Contents**

- [Installation](#installation)
- [Documentation](#documentation)
- [Usage](#usage)
- [License](#license)

## Installation

```bash
npm install @routup/query --save
```

## Documentation

To read the docs, visit [https://routup.net](https://routup.net)

## Usage

It is important to invoke the request middleware,
to parse the query-string of the request url.

```typescript
import { createServer } from 'node:http';
import {
    createNodeDispatcher,
    defineHandler,
    Router,
    send
} from 'routup';
import {
    createHandler,
    useRequestQuery
} from '@routup/query';

const router = new Router();

router.use(createHandler());

router.get('/', defineHandler((req, res) => {
    const query = useRequestQuery(req);
    console.log(query);
    // { key: ..., ... }

    return send(res, query);
}));

const server = createServer(createNodeDispatcher(router));
server.listen(3000);
```

## License

Made with 💚

Published under [MIT License](./LICENSE).
