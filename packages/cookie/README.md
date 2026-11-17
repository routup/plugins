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
    <a href="https://plugins.routup.dev/cookie/"><b>Docs</b></a>
    ·
    <a href="https://plugins.routup.dev/cookie/configuration">Configuration</a>
    ·
    <a href="https://plugins.routup.dev/cookie/helpers">Helpers</a>
    ·
    <a href="https://plugins.routup.dev/cookie/recipes">Recipes</a>
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
