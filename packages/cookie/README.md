# @routup/cookie

[![npm version](https://badge.fury.io/js/@routup%2Fcookie.svg)](https://badge.fury.io/js/@routup%2Fcookie)
[![main](https://github.com/routup/plugins/actions/workflows/main.yml/badge.svg)](https://github.com/routup/plugins/actions/workflows/main.yml)
[![codecov](https://codecov.io/gh/routup/plugins/branch/master/graph/badge.svg)](https://codecov.io/gh/routup/plugins)
[![Known Vulnerabilities](https://snyk.io/test/github/routup/plugins/badge.svg)](https://snyk.io/test/github/routup/plugins)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-%23FE5196?logo=conventionalcommits&logoColor=white)](https://conventionalcommits.org)

This is a plugin for reading and parsing request cookies, as well serializing cookies for the
response.

**Table of Contents**

- [Installation](#installation)
- [Documentation](#documentation)
- [Usage](#usage)
- [Options](#options)
- [Helpers](#helpers)
  - [setRequestCookies](#setrequestcookies)
  - [useRequestCookies](#userequestcookies)
  - [useRequestCookie](#userequestcookie)
  - [setResponseCookie](#setresponsecookie)
  - [unsetResponseCookie](#unsetresponsecookie)
- [License](#license)

## Installation

```bash
npm install @routup/cookie --save
```

## Documentation

To read the docs, visit [https://routup.net](https://routup.net)

## Usage

It is important to invoke the request middleware,
to parse the cookies of the request header.

```typescript
import {
    App,
    defineCoreHandler,
    serve,
} from 'routup';
import {
    cookie,
    useRequestCookie,
    useRequestCookies,
} from '@routup/cookie';

const router = new App();

router.use(cookie());

router.get('/', defineCoreHandler((event) => {
    const cookies = useRequestCookies(event);
    console.log(cookies);
    // { key: value, ... }
    
    const value = useRequestCookie(event, 'key');
    // value

    return value;
}));

serve(router, { port: 3000 });
```

## Options

### `parse`

Customize the parse behaviour.

- Type: [ParseOptions](#parseoptions)
- Default: `undefined`

## Types

#### `ParseOptions`

```typescript
export type ParseOptions = {
    decode?(value: string): string;
}
```

## Helpers

### `setRequestCookies`

This function sets the parsed request cookies for the current request.

```typescript
declare function setRequestCookies(
    event: IAppEvent,
    key: string,
    value: unknown
) : void;

declare function setRequestCookies(
    event: IAppEvent,
    record: Record<string, any>
) : void;
```

### `useRequestCookies`

This function returns the parsed request cookies.

```typescript
declare function useRequestCookies(
    event: IAppEvent,
) : Record<string, string>;
```

### `useRequestCookie`

This function returns a **single** parsed request cookie.

```typescript
declare function useRequestCookie(
    event: IAppEvent,
    name: string
) : string | undefined;
```

### `setResponseCookie`

This function sets a cookie on the response.

```typescript
declare function setResponseCookie(
    event: IAppEvent,
    name: string,
    value: string,
    options?: SerializeOptions
) : void;
```

### `unsetResponseCookie`

This function removes a cookie by setting its `maxAge` to `0`.

```typescript
declare function unsetResponseCookie(
    event: IAppEvent,
    name: string,
    options?: SerializeOptions
) : void;
```

## License

Made with 💚

Published under [MIT License](./LICENSE).
