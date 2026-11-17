---
title: Swagger UI Configuration
description: All options of the swagger-ui plugin, the OAuth options and the content security policy.
relatedPlugins: [decorators]
---

# Configuration

`swaggerUI(document, options?)` takes the options as its second argument; every option is optional. The options are the `UIOptions` type: the Swagger UI configuration (`SwaggerConfigs` from `@types/swagger-ui-dist`) plus the fields of this plugin. Options are checked when the plugin is installed with `app.use()`, and an invalid one throws there.

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `basePath` | `string` | none | Path prefix the app is reachable under behind a proxy; put in front of the mount path in `<base href>` |
| `baseURL` | `string` | none | Absolute `http:` or `https:` URL the app is reachable under; the mount path is resolved against it for `<base href>`. Wins over `basePath` |
| `oauth` | `UIOAuthOptions` | none | Passed to `ui.initOAuth()`; also serves the OAuth redirect page |
| `authAction` | `Record<string, any>` | none | Passed to `ui.authActions.authorize()` to authorize security schemes up front |
| `oauth2RedirectUrl` | `string` | `oauth2-redirect.html` next to `<base href>` | OAuth redirect URL passed to Swagger UI; setting it also serves the OAuth redirect page |
| `validatorUrl` | `string \| null` | Swagger UI's, `https://validator.swagger.io/validator` | Validator of the badge that `StandaloneLayout` shows for a document loaded by URL; `null` or `'none'` turns it off |
| `csp` | `boolean \| string \| ContentSecurityPolicyInput` | `false` | Sends a `content-security-policy` header with every response |
| `securityHeaders` | `boolean` | `false` | Sends `x-content-type-options`, `referrer-policy` and `x-frame-options` with every response |
| `spec` | `Spec` | set from `document` | Replaced by the `document` argument when it is an object or a file |
| `url` | `string` | set from `document` | Replaced by the `document` argument when it is a URL |
| `urls` | `Url[]` | none | Several documents (`{ url, name }`) to pick from in the top bar of `StandaloneLayout` |
| `configUrl` | `string` | none | URL of an external Swagger UI configuration document |
| `layout` | `string` | `'BaseLayout'` | Top-level layout component of Swagger UI |
| `dom_id` | `string \| null` | `'#swagger-ui'` | Element the UI renders into; the shell has `<div id="swagger-ui">` |
| `domNode` | `string \| HTMLElement \| null` | none | Swagger UI option; overrides `dom_id` |
| `deepLinking` | `boolean` | `true` | Deep links for tags and operations |
| `presets` | `any[]` | `[SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset]` | Swagger UI presets |
| `plugins` | `any` | `[SwaggerUIBundle.plugins.DownloadUrl]` | Swagger UI plugins |
| `docExpansion` | `'list' \| 'full' \| 'none'` | Swagger UI's, `'list'` | How far tags and operations are expanded |
| `maxDisplayedTags` | `number` | all tags | Shows at most this many tagged operations |
| `operationsSorter` | `(() => void) \| 'alpha' \| 'method'` | the order of the document | Sorts the operations of each tag |
| `requestInterceptor` | `(request: SwaggerRequest) => SwaggerRequest \| Promise<SwaggerRequest>` | none | Changes requests of "Try it out", OAuth and the document fetch in the browser |
| `responseInterceptor` | `(response: SwaggerResponse) => SwaggerResponse \| Promise<SwaggerResponse>` | none | Changes the matching responses in the browser |

`SwaggerConfigs` has an index signature, so any other key of the [Swagger UI configuration](https://swagger.io/docs/open-source-tools/swagger-ui/usage/configuration/), such as `persistAuthorization` or `tryItOutEnabled`, is passed on as well.

The options, except `basePath`, `baseURL`, `csp` and `securityHeaders`, are written into the generated `swagger-initializer.js`, which merges them over the defaults in the table and passes the result to `SwaggerUIBundle()`. `oauth` and `authAction` are taken out first and applied to the created UI. The options object you pass is not modified.

- **Values are escaped.** `<`, `>`, `&`, U+2028 and U+2029 in the document and the options are escaped, so a description containing `</script>` or `<!--` cannot break out of the script.
- **Functions are passed as source.** A function value, such as `requestInterceptor`, is inserted by its source text and runs in the browser, so it cannot use variables of your server code. A bound or native function (`fn.bind(...)`, `Math.max`) has no source to pass and throws at `app.use()`.

### `basePath`

For an app behind a reverse proxy that forwards a path prefix: `basePath: '/backend/'` with a mount at `/docs` gives `<base href="/backend/docs/">`. [Behind a Reverse Proxy](/swagger-ui/recipes#behind-a-reverse-proxy) shows it with a nested app.

### `baseURL`

The public URL of the app, for a shell served under another origin or prefix: `baseURL: 'https://example.com/api/'` with a mount at `/v2/docs` gives `<base href="https://example.com/api/v2/docs/">`. Its path is treated as a directory, so `https://example.com/api` behaves like `https://example.com/api/`; a query or fragment is dropped. With `csp`, its origin is added to the directives that load the files of the UI.

Anything other than an absolute `http:` or `https:` URL throws at `app.use()`. When both are set, `baseURL` wins over `basePath`.

### `oauth`

| Key | Type | Description |
|-----|------|-------------|
| `scopes` | `string[] \| string` | Required. Scopes selected by default |
| `clientId` | `string` | OAuth client id |
| `clientSecret` | `string` | OAuth client secret; it is sent to every visitor of the UI |
| `realm` | `string` | Realm query parameter, for OAuth 1 |
| `appName` | `string` | Application name shown in the authorization popup |
| `scopeOperator` | `string` | Separator of the scopes in the authorization request |
| `additionalQueryStringParams` | `Record<string, any>` | Extra query parameters of the authorization and token request |
| `useBasicAuthenticationWithAccessCodeGrant` | `boolean` | Sends the client credentials as basic authentication in the access code flow |
| `usePkceWithAuthorizationCodeGrant` | `boolean` | Uses PKCE in the authorization code flow |

The object is passed to `ui.initOAuth()` as is ([Swagger UI OAuth2 configuration](https://swagger.io/docs/open-source-tools/swagger-ui/usage/oauth2/)). Setting it also serves `oauth2-redirect.html` and `oauth2-redirect.js` ([Served Files](/swagger-ui/#served-files)). [OAuth Login](/swagger-ui/recipes#oauth-login) shows it.

### `authAction`

Passed to `ui.authActions.authorize()` after the UI is created, for example to fill in an API key: `{ apiKey: { name: 'apiKey', schema: { type: 'apiKey', in: 'header', name: 'x-api-key' }, value: '...' } }`. Like every option, it is sent to the browser.

### `oauth2RedirectUrl`

Without it, the bootstrap sets the redirect URL to `oauth2-redirect.html` resolved against `<base href>`, so OAuth works for `/docs` and `/docs/` alike. Setting it, like `oauth`, also serves the redirect page. For a document loaded by URL, which the plugin cannot inspect for OAuth schemes, set one of the two to serve the page.

### `csp`

| Key | Type | Description |
|-----|------|-------------|
| `origins` | `string[]` | More origins the UI is served from; added to every fetch directive and `base-uri`, not to `form-action` |
| `connectSrc` | `string[]` | More `connect-src` sources: the document URL, API servers, token endpoints |
| `imgSrc` | `string[]` | More `img-src` sources |
| `frameAncestors` | `string[]` | `frame-ancestors` sources; absent or empty: `'none'` |

The table is `ContentSecurityPolicyInput`. `csp` takes one of:

| Value | `content-security-policy` |
|-------|---------------------------|
| `false` (default) | none |
| `true` | The recommended policy, with the origins derived from the options and the document |
| `ContentSecurityPolicyInput` | The recommended policy with these sources added; `{}` behaves like `true` |
| `string` | This string as is |

The shell loads only same-origin files and has no inline script or style, so it runs under `script-src 'self'; style-src 'self'`. Every response of the plugin carries the header, `304` responses included. The recommended policy without any derived origin:

```text
default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:;
media-src 'self' blob:; font-src 'self'; connect-src 'self'; worker-src 'none';
base-uri 'self'; form-action 'self'; frame-ancestors 'none'
```

- `default-src 'none'` closes the fetch directives without a named fallback (objects, frames, manifests). `script-src-elem`, `script-src-attr`, `style-src-elem` and `style-src-attr` follow `script-src` and `style-src`.
- `worker-src 'none'` forbids workers, which would otherwise fall back to `script-src 'self'`, not to `default-src`.
- `frame-ancestors 'none'` forbids framing the UI on any site.
- `data:` images are used by `swagger-ui.css`; `blob:` lets "Try it out" show binary responses (images, audio, video).

Origins derived from the options and the document go to `connect-src`: the document URL, `configUrl`, the `urls[]` entries, the `servers` of an object or file document at root, path and operation level (or the Swagger 2 `host`), and its OAuth token, refresh and OpenID Connect URLs.

- Templated server URLs are expanded with the `default` and every `enum` value of their variables, each variable once for all its occurrences. Above 64 combinations per server, only the defaults are used. A variable without a value leaves the server out.
- A protocol-relative server (`//api.example.com`) adds its `https:` and its `http:` origin.
- Only origins of the form `scheme://host[:port]` (letters, digits, `.`, `-` or a bracketed IPv6 address) are added; any other server value is dropped.
- The `baseURL` origin is added to `script-src`, `style-src`, `img-src`, `media-src`, `font-src`, `connect-src` and `base-uri`; `default-src` stays `'none'` and `form-action` stays `'self'`.
- With `layout: 'StandaloneLayout'` and a document loaded by URL, the origin of the validator badge (`validatorUrl`, unless it is `null` or `'none'`) is added to `img-src`.

Some origins cannot be known in advance; add them with the object or use a string policy: the servers of a document loaded by URL, a server variable without a value or one a visitor types freely (no `enum`), and an OpenID Connect `token_endpoint` found through discovery on another origin than the `openIdConnectUrl`.

A source in the object that contains whitespace, a control character, `;` or `,` throws at `app.use()`, since it would add a directive or a second policy. Source expressions such as `'self'`, `data:`, `https:` or `*.example.com` are accepted. [Embed in a Portal](/swagger-ui/recipes#embed-in-a-portal) shows the object; [`buildContentSecurityPolicy()`](/swagger-ui/helpers#buildcontentsecuritypolicy) builds the same policy for a header of your own.

### `securityHeaders`

With `true`, every response of the plugin, `304` responses included, carries:

| Header | Value |
|--------|-------|
| `x-content-type-options` | `nosniff` |
| `referrer-policy` | `no-referrer` |
| `x-frame-options` | `DENY`; `SAMEORIGIN` when `csp` is an object whose `frameAncestors` is exactly `["'self'"]`; none when `frameAncestors` names any other source, which the header cannot express |

It works with or without `csp`. With a string `csp`, `x-frame-options` is `DENY`; a browser that reads `frame-ancestors` from your policy ignores `x-frame-options`.

### `layout`

The default `BaseLayout` has no top bar: the page shows the configured document only, with no field to load another document by URL. `layout: 'StandaloneLayout'` brings the top bar back, including that field; its logo then needs an inline style, which `style-src 'self'` blocks, and the UI still works.
