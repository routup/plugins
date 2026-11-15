<p align="center">
    <img src="https://cdn.jsdelivr.net/npm/@routup/basic@3/assets/logo.svg" alt="@routup/basic logo: three cards fanned out, one per bundled plugin" width="128" height="128" />
</p>

<h1 align="center">@routup/basic</h1>

<p align="center">
    <b>Install body, cookie and query parsing in a routup app with one plugin and one dependency.</b><br>
    One <code>app.use(basic())</code> registers @routup/body, @routup/cookie and @routup/query; their helpers are re-exported under subpaths.
</p>

<p align="center">
    <a href="https://www.npmjs.com/package/@routup/basic"><img src="https://img.shields.io/npm/v/@routup/basic" alt="npm version" /></a>
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
    <a href="https://plugins.routup.dev/basic/">Docs</a>
</p>

---

## Why @routup/basic?

Most APIs need the request body, cookies and the query string. Installing and registering three plugins separately means three dependencies to keep in sync and three `app.use()` lines in every app.

| Concern | Without it | With @routup/basic |
|---------|------------|--------------------|
| Dependencies | `@routup/body`, `@routup/cookie` and `@routup/query` in `package.json` | `@routup/basic`, which depends on all three |
| Registration | `app.use(body())`, `app.use(cookie())`, `app.use(query())` | `app.use(basic())` registers them in that order |
| Configuration | Options per plugin call | One object: `basic({ body: {...}, cookie: {...}, query: {...} })` |
| Imports | Helpers from three packages | Helpers from `@routup/basic/body`, `/cookie` and `/query` |
| Control | Full control over order and placement | Fixed order (body, cookie, query) at one point in the stack; install the plugins individually when you need more |

```typescript
import { App } from 'routup';
import { basic } from '@routup/basic';

const app = new App();

// the same as app.use(body()); app.use(cookie()); app.use(query());
app.use(basic());
```

## Installation

```bash
npm install @routup/basic
```

The package is ESM only, requires Node.js >= 22 and has `routup@^6.1.0` as a peer dependency. `@routup/body`, `@routup/cookie` and `@routup/query` are installed as dependencies.

## Usage

### Register the bundle

The modules **body**, **cookie** and **query** have an individual export path, as shown in the following snippet.

```typescript
import { App, defineCoreHandler, serve } from 'routup';
import { basic } from '@routup/basic';
import { readRequestBody } from '@routup/basic/body';
import { useRequestCookie, useRequestCookies } from '@routup/basic/cookie';
import { useRequestQuery } from '@routup/basic/query';

const app = new App();

app.use(basic());

app.post('/', defineCoreHandler(async (event) => {
    const body = await readRequestBody(event);
    // { key: value, ... }

    const cookies = useRequestCookies(event);
    // { key: value, ... }

    const cookie = useRequestCookie(event, 'key');
    // value

    const query = useRequestQuery(event);
    // { key: ..., ... }

    return { body, cookies, cookie, query };
}));

serve(app, { port: 3000 });
```

- `@routup/basic/body`, `@routup/basic/cookie` and `@routup/basic/query` re-export everything from `@routup/body`, `@routup/cookie` and `@routup/query`, so you need no second install. Importing from the original packages works as well; both resolve to the same store keys.
- The helpers behave exactly as in the bundled packages; see their READMEs for the full reference: [@routup/body](https://github.com/routup/plugins/tree/master/packages/body#readme), [@routup/cookie](https://github.com/routup/plugins/tree/master/packages/cookie#readme), [@routup/query](https://github.com/routup/plugins/tree/master/packages/query#readme).

### Configure or skip a plugin

```typescript
import { App } from 'routup';
import { basic } from '@routup/basic';

const app = new App();

app.use(basic({
    body: { json: { limit: '1mb' }, urlEncoded: true },
    cookie: true,
    query: false, // skip query parsing entirely
}));
```

- Each key takes the options of that plugin, `true` (default options) or `false` (not registered).
- With no key at all, all three plugins are registered. Once you pass one key, only the keys set to an object or `true` are registered: `basic({ body: true })` registers body alone.
- The `body` options follow the same rule one level down: `body: { json: { limit: '512kb' } }` enables JSON only, without URL-encoded parsing.

## Options

`basic(options?)`:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `body` | [`BodyOptions`](https://github.com/routup/plugins/tree/master/packages/body#options) `\| boolean` | `true` | Options for `body()`; `false` skips it |
| `cookie` | [`CookieOptions`](https://github.com/routup/plugins/tree/master/packages/cookie#options) `\| boolean` | `true` | Options for `cookie()`; `false` skips it |
| `query` | [`QueryOptions`](https://github.com/routup/plugins/tree/master/packages/query#options) `\| boolean` | `true` | Options for `query()`; `false` skips it |

The defaults apply only when you pass none of the three keys; see [Configure or skip a plugin](#configure-or-skip-a-plugin). The [configuration page](https://plugins.routup.dev/basic/configuration) of the docs has more examples.

## API

| Export | Kind | Purpose |
|--------|------|---------|
| `basic` (also the default export) | function | Create the bundle plugin |
| `Options` | type | Option shape of `basic()` |
| `boolToObject` | function | Internal helper (`true`/`false` to `{}`), exported by the barrel |
| `@routup/basic/body` | subpath | Everything from [`@routup/body`](https://plugins.routup.dev/body/): `body`, `readRequestBody`, `readRequestBodyText`, `readRequestBodyStream`, ... |
| `@routup/basic/cookie` | subpath | Everything from [`@routup/cookie`](https://plugins.routup.dev/cookie/): `cookie`, `useRequestCookie`, `setResponseCookie`, ... |
| `@routup/basic/query` | subpath | Everything from [`@routup/query`](https://plugins.routup.dev/query/): `query`, `useRequestQuery`, `setRequestQuery`, ... |

## Notes

- **Partial options turn the rest off.** `basic({ query: false })` registers nothing, because `body` and `cookie` are then undefined. List every plugin you want.
- **The order is fixed.** body, cookie, then query, all at the position of the `basic()` call. Handlers registered before it see no body options, cookies or query.
- **Registering a plugin twice is harmless for cookie and query**, which skip parsing when a result is already stored. A second `body()` replaces the body options for later handlers.
- **The options object is modified.** `basic()` writes the defaults into the object you pass when it has no keys; do not share one object between apps if that matters.

## License

Made with 💚

Published under [MIT License](https://github.com/routup/plugins/blob/master/LICENSE).
