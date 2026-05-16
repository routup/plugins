# @routup/query

[![npm version](https://badge.fury.io/js/@routup%2Fquery.svg)](https://badge.fury.io/js/@routup%2Fquery)
[![main](https://github.com/routup/plugins/actions/workflows/main.yml/badge.svg)](https://github.com/routup/plugins/actions/workflows/main.yml)
[![codecov](https://codecov.io/gh/routup/plugins/branch/master/graph/badge.svg)](https://codecov.io/gh/routup/plugins)
[![Known Vulnerabilities](https://snyk.io/test/github/routup/plugins/badge.svg)](https://snyk.io/test/github/routup/plugins)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-%23FE5196?logo=conventionalcommits&logoColor=white)](https://conventionalcommits.org)

This is a plugin for reading and parsing the query string of the request url.

**Table of Contents**

- [Installation](#installation)
- [Documentation](#documentation)
- [Usage](#usage)
- [Helpers](#helpers)
  - [setRequestQuery](#setrequestquery)
  - [useRequestQuery](#userequestquery)
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
import {
    App,
    defineCoreHandler,
    serve,
} from 'routup';
import {
    query,
    useRequestQuery
} from '@routup/query';

const router = new App();

router.use(query());

router.get('/', defineCoreHandler((event) => {
    const q = useRequestQuery(event);
    console.log(q);
    // { key: ..., ... }

    return q;
}));

serve(router, { port: 3000 });
```

## Helpers

### `setRequestQuery`

This function sets the parsed request query parameters for the current request.

```typescript
declare function setRequestQuery(
    event: IAppEvent,
    key: string,
    value: unknown
) : void;

declare function setRequestQuery(
    event: IAppEvent, 
    record: Record<string, any>
) : void;
```

### `useRequestQuery`

This function returns the query parameters of the request.

```typescript
declare function useRequestQuery(
    event: IAppEvent
) : Record<string, any>;

declare function useRequestQuery(
    event: IAppEvent, 
    key: string
) : any;
```

## License

Made with 💚

Published under [MIT License](./LICENSE).
