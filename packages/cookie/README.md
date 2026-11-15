<p align="center">
    <img src="./assets/logo.svg" alt="@routup/cookie logo: a cookie with a bite taken out of it" width="128" height="128" />
</p>

<h1 align="center">@routup/cookie</h1>

<p align="center">
    <b>Read request cookies and write Set-Cookie headers in a routup app.</b><br>
    The <code>Cookie</code> header is parsed once per request; you set and clear cookies with typed attributes instead of hand-built header strings.
</p>

<p align="center">
    <a href="https://www.npmjs.com/package/@routup/cookie"><img src="https://img.shields.io/npm/v/@routup/cookie" alt="npm version" /></a>
    <a href="https://github.com/routup/plugins/actions/workflows/main.yml"><img src="https://github.com/routup/plugins/actions/workflows/main.yml/badge.svg" alt="CI" /></a>
    <a href="https://codecov.io/gh/routup/plugins"><img src="https://codecov.io/gh/routup/plugins/branch/master/graph/badge.svg" alt="Coverage" /></a>
    <a href="https://snyk.io/test/github/routup/plugins"><img src="https://snyk.io/test/github/routup/plugins/badge.svg" alt="Known Vulnerabilities" /></a>
</p>

<p align="center">
    <a href="#installation"><b>Installation</b></a>
    ·
    <a href="#usage">Usage</a>
    ·
    <a href="#options">Options</a>
    ·
    <a href="#api">API</a>
    ·
    <a href="https://plugins.routup.dev/cookie/">Docs</a>
</p>

---

## Why @routup/cookie?

Reading `event.headers.get('cookie')` gives you one string of `name=value` pairs, and a response cookie is a `Set-Cookie` header whose attributes you have to spell and encode correctly. Doing that by hand in every handler is where encoding bugs and forgotten `Path` attributes come from.

| Concern | Without it | With @routup/cookie |
|---------|------------|---------------------|
| Reading | Split the `Cookie` header on `;` and `=`, decode each value | `useRequestCookie(event, 'session')`; parsed once by the middleware with [cookie-es](https://github.com/unjs/cookie-es) |
| Writing | Build `name=value; Path=/; HttpOnly; ...` and append it without overwriting other cookies | `setResponseCookie(event, name, value, { httpOnly: true })` appends one `Set-Cookie` header per call |
| Encoding | Call `encodeURIComponent` and `decodeURIComponent` yourself | Values are URI-encoded when written and decoded when read; both are replaceable |
| Clearing | Write an expired cookie with the same `Path` and `Domain` | `unsetResponseCookie(event, name)` sends `Max-Age=0` |
| Overrides | Pass a modified cookie map through your own code | `setRequestCookies(event, ...)` replaces what later handlers read |

```typescript
import { App, defineCoreHandler, serve } from 'routup';
import { cookie, setResponseCookie, useRequestCookie } from '@routup/cookie';

const app = new App();

app.use(cookie());

app.get('/', defineCoreHandler((event) => {
    const visits = Number(useRequestCookie(event, 'visits') ?? 0) + 1;

    setResponseCookie(event, 'visits', String(visits), { httpOnly: true, sameSite: 'lax' });

    return { visits };
}));

serve(app, { port: 3000 });
```

**Table of Contents**

- [Installation](#installation)
- [Usage](#usage)
  - [Read request cookies](#read-request-cookies)
  - [Set and clear response cookies](#set-and-clear-response-cookies)
  - [Override request cookies](#override-request-cookies)
- [Options](#options)
- [API](#api)
  - [useRequestCookies](#userequestcookies)
  - [useRequestCookie](#userequestcookie)
  - [setRequestCookies](#setrequestcookies)
  - [hasRequestCookies](#hasrequestcookies)
  - [setResponseCookie](#setresponsecookie)
  - [unsetResponseCookie](#unsetresponsecookie)
  - [parseRequestCookies](#parserequestcookies)
- [Notes](#notes)
- [License](#license)

## Installation

```bash
npm install @routup/cookie
```

The package is ESM only, requires Node.js >= 24 and has `routup@^6.3.0` as a peer dependency.

## Usage

### Read request cookies

```typescript
import { App, defineCoreHandler, serve } from 'routup';
import { cookie, useRequestCookie, useRequestCookies } from '@routup/cookie';

const app = new App();

app.use(cookie());

app.get('/', defineCoreHandler((event) => {
    const cookies = useRequestCookies(event);
    // { key: value, ... }

    const value = useRequestCookie(event, 'key');
    // value

    return { cookies, value };
}));

serve(app, { port: 3000 });
```

- Register `cookie()` before the handlers that read cookies. The middleware parses the `Cookie` header and stores the result on `event.store`; the helpers only read that store.
- Without the middleware, `useRequestCookies` returns `{}` and `useRequestCookie` returns `undefined`.
- If cookies were already stored for the request (by an earlier `cookie()` or `setRequestCookies`), the middleware does not parse again.

### Set and clear response cookies

```typescript
import { App, defineCoreHandler } from 'routup';
import { setResponseCookie, unsetResponseCookie } from '@routup/cookie';

declare const token: string;

const app = new App();

app.post('/login', defineCoreHandler((event) => {
    setResponseCookie(event, 'session', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
    });

    return { ok: true };
}));

app.post('/logout', defineCoreHandler((event) => {
    unsetResponseCookie(event, 'session');

    return { ok: true };
}));
```

- The response helpers do not need the plugin.
- `path` defaults to `/`. Pass the same `path` and `domain` to `unsetResponseCookie` that you used when setting the cookie; browsers only delete a cookie whose scope matches.
- Each call appends a separate `Set-Cookie` header, so several cookies per response work.

### Override request cookies

```typescript
import { App, defineCoreHandler } from 'routup';
import { cookie, setRequestCookies, useRequestCookie } from '@routup/cookie';

const app = new App();

app.use(cookie());

app.use(defineCoreHandler((event) => {
    if (!useRequestCookie(event, 'locale')) {
        setRequestCookies(event, 'locale', 'en');
    }

    return event.next();
}));
```

- `setRequestCookies(event, key, value)` merges one entry into the stored cookies; `setRequestCookies(event, record)` replaces them all.
- This only changes what later handlers read. It does not send anything to the client.

## Options

`cookie(options?)`:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `parse` | `ParseOptions` | `undefined` | Passed to cookie-es `parse` when the `Cookie` header is read |
| `serialize` | `SerializeOptions` | `undefined` | Accepted by the type, but not used by the plugin; pass serialize options to `setResponseCookie` instead |

**`ParseOptions`** (cookie-es `CookieParseOptions`)

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `decode` | `(value: string) => string \| undefined` | `decodeURIComponent` (original value on error) | Decodes each cookie value |
| `filter` | `(key: string) => boolean` | none | Only parse cookies whose name passes |
| `allowMultiple` | `boolean` | `false` | Return an array for a name that occurs more than once, instead of the first value |

```typescript
import { App } from 'routup';
import { cookie } from '@routup/cookie';

const app = new App();

app.use(cookie({
    parse: { decode: (value) => decodeURIComponent(value) },
}));
```

**`SerializeOptions`** (cookie-es `CookieSerializeOptions`, the fourth argument of `setResponseCookie`): `path` (default `/`), `domain`, `maxAge`, `expires`, `httpOnly`, `secure`, `sameSite` (`true`, `'lax'`, `'strict'`, `'none'`), `priority` (`'low'`, `'medium'`, `'high'`), `partitioned`, and `encode` (default `encodeURIComponent`).

## API

| Export | Kind | Purpose |
|--------|------|---------|
| `cookie` (also the default export) | function | Create the plugin |
| `useRequestCookies` | function | All parsed request cookies |
| `useRequestCookie` | function | One parsed request cookie |
| `setRequestCookies` | function | Set or replace the stored request cookies |
| `hasRequestCookies` | function | Whether cookies are stored for the request |
| `setResponseCookie` | function | Append a `Set-Cookie` header |
| `unsetResponseCookie` | function | Append a `Set-Cookie` header with `Max-Age=0` |
| `parseRequestCookies` | function | Parse the `Cookie` header without storing the result |
| `isObject` | function | Internal type guard, exported by the barrel |
| `Options`, `ParseOptions`, `SerializeOptions` | type | Option shapes |

The [helpers page](https://plugins.routup.dev/cookie/helpers) of the docs covers the same reference.

### `useRequestCookies`

Returns the parsed request cookies.

```typescript
declare function useRequestCookies(
    event: IAppEvent,
): Record<string, string>;
```

### `useRequestCookie`

Returns a **single** parsed request cookie, or `undefined` if it is absent.

```typescript
declare function useRequestCookie(
    event: IAppEvent,
    name: string,
): string | undefined;
```

### `setRequestCookies`

Sets the parsed request cookies for the current request: one key, or the whole record.

```typescript
declare function setRequestCookies(
    event: IAppEvent,
    key: string,
    value: unknown,
): void;

declare function setRequestCookies(
    event: IAppEvent,
    record: Record<string, any>,
): void;
```

### `hasRequestCookies`

Returns `true` once cookies are stored for the request.

```typescript
declare function hasRequestCookies(
    event: IAppEvent,
): boolean;
```

### `setResponseCookie`

Sets a cookie on the response by appending a `Set-Cookie` header.

```typescript
declare function setResponseCookie(
    event: IAppEvent,
    name: string,
    value: string,
    options?: SerializeOptions,
): void;
```

### `unsetResponseCookie`

Removes a cookie by setting it to an empty value with `maxAge: 0`. Any `maxAge` you pass is overridden.

```typescript
declare function unsetResponseCookie(
    event: IAppEvent,
    name: string,
    options?: SerializeOptions,
): void;
```

### `parseRequestCookies`

Parses the request's `Cookie` header with cookie-es and returns the result without storing it. The middleware uses it internally.

```typescript
declare function parseRequestCookies(
    event: IAppEvent,
    options?: ParseOptions,
): Record<string, string | undefined>;
```

## Notes

- **Order matters.** Handlers registered before `cookie()` see no cookies.
- **Cookies are parsed once per request.** Changing the `Cookie` header after the middleware ran has no effect; use `setRequestCookies`.
- **`serialize` in the plugin options is ignored.** Pass attributes to every `setResponseCookie` call, or wrap it in your own helper.
- **`allowMultiple` changes the value type.** With it, a value can be a `string[]`, while `useRequestCookies` is still typed as `Record<string, string>`.
- **`setResponseCookie` throws on invalid input.** cookie-es throws a `TypeError` for an invalid name or encoded value, a non-integer `maxAge`, `partitioned` or `sameSite: 'none'` without `secure`, a `__Secure-` or `__Host-` name without `secure`, and a `__Host-` cookie with a `domain` or a `path` other than `/`. Inside a handler this becomes a 500.
- **Cookies are not signed or encrypted.** Treat every request cookie as client input.

## License

Made with 💚

Published under [MIT License](https://github.com/routup/plugins/blob/master/LICENSE).
