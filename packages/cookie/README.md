<div align="center">

<img src="./assets/logo.svg" alt="@routup/cookie logo: a cookie with a bite taken out of it" width="128" height="128" />

<h1>@routup/cookie</h1>

</div>

[![npm version](https://img.shields.io/npm/v/@routup/cookie)](https://www.npmjs.com/package/@routup/cookie)
[![CI](https://github.com/routup/plugins/actions/workflows/main.yml/badge.svg)](https://github.com/routup/plugins/actions/workflows/main.yml)
[![Coverage](https://codecov.io/gh/routup/plugins/branch/master/graph/badge.svg)](https://codecov.io/gh/routup/plugins)
[![Known Vulnerabilities](https://snyk.io/test/github/routup/plugins/badge.svg)](https://snyk.io/test/github/routup/plugins)

**Read request cookies and write Set-Cookie headers in a routup app.**

The `Cookie` header is parsed once per request; you set and clear cookies with typed attributes instead of hand-built header strings.

[Docs](https://plugins.routup.dev/cookie/) · [Configuration](https://plugins.routup.dev/cookie/configuration) · [Helpers](https://plugins.routup.dev/cookie/helpers) · [Recipes](https://plugins.routup.dev/cookie/recipes)

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

## Installation

```bash
npm install @routup/cookie
```

ESM only, Node.js >=24. Peer dependency: `routup@^6.3.0`.

## Quick Start

```typescript
import { App, defineCoreHandler } from 'routup';
import { cookie, setResponseCookie, useRequestCookie } from '@routup/cookie';

export const app = new App();

app.use(cookie());

app.get('/', defineCoreHandler((event) => {
    const visits = Number(useRequestCookie(event, 'visits') ?? 0) + 1;

    setResponseCookie(event, 'visits', String(visits), { httpOnly: true, sameSite: 'lax' });

    return { visits };
}));
```

The sample exports the app; [serve it](https://routup.dev/guide/quickstart) from your entry file. `cookie()` parses the `Cookie` header once per request; `setResponseCookie()` appends a `Set-Cookie` header and works without the plugin.

## Documentation

The full reference lives on [plugins.routup.dev](https://plugins.routup.dev/cookie/):

- [Overview](https://plugins.routup.dev/cookie/): requirements and default behaviour
- [Configuration](https://plugins.routup.dev/cookie/configuration): the parse options
- [Helpers](https://plugins.routup.dev/cookie/helpers): reading, overriding, setting and clearing cookies, with every `Set-Cookie` attribute
- [Recipes](https://plugins.routup.dev/cookie/recipes): a session cookie, a JSON value, a default for a missing cookie

## License

Made with 💚

Published under [MIT License](https://github.com/routup/plugins/blob/master/LICENSE).
