---
title: Cookie Configuration
description: Options of the cookie plugin and the cookie-es parse options.
relatedPlugins: [basic]
---

# Configuration

`cookie(options?)` takes one object, the `Options` type; every option is optional.

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `parse` | `ParseOptions` | none | Passed to cookie-es `parse` when the middleware reads the `Cookie` header |
| `serialize` | `SerializeOptions` | none | Accepted by the type, but not used by the plugin |

### `parse`

The cookie-es `CookieParseOptions`:

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `decode` | `(value: string) => string \| undefined` | `decodeURIComponent`, keeping the original value when it fails | Decodes each cookie value |
| `filter` | `(name: string) => boolean` | none | Only parse cookies whose name passes |
| `allowMultiple` | `boolean` | `false` | For a name sent more than once, return an array of all values instead of the first one |

<<< @/../examples/cookie/parse-options.ts

```bash
curl http://localhost:3000/ -H 'cookie: app_tab=a; other=x; app_tab=b; app_id=1'
# {"app_tab":["a","b"],"app_id":"1"}
```

With `allowMultiple`, a value can be a `string[]`, while `useRequestCookies()` is still typed `Record<string, string>`.

### `serialize`

Has no effect: the plugin does not pass it to `setResponseCookie()`. Pass the [attributes](/cookie/helpers#setresponsecookie) to each `setResponseCookie()` call, or wrap it in a helper of your own.
