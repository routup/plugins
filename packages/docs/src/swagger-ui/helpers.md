---
title: Swagger UI Helpers
description: Functions and types exported by @routup/swagger-ui.
relatedPlugins: [decorators]
---

# Helpers and API

Everything `@routup/swagger-ui` exports. Options are on [Configuration](/swagger-ui/configuration).

## `swaggerUI()`

Creates the plugin. It is also the default export. The plugin reads a file document and checks the options when it is installed with `app.use()`, not when `swaggerUI()` is called.

```typescript
declare function swaggerUI(document: Spec | string, options?: UIOptions): Plugin;
```

## `createUIHandler()`

Creates the handler the plugin installs, for `app.use()` without the plugin wrapper. It reads a file document and checks the options when it is called, so errors throw there.

```typescript
declare function createUIHandler(document: Spec | string, options?: UIOptions): Handler;
```

Mounted with `app.use('/docs', createUIHandler(document))`, it serves the same files under the same paths as the plugin.

## `buildContentSecurityPolicy()`

Returns the recommended policy of [`csp`](/swagger-ui/configuration#csp) as a header value, for a header of your own. The input adds `origins`, `connectSrc` and `imgSrc` sources and sets `frameAncestors` (default `'none'`); it does not derive origins from a document.

```typescript
declare function buildContentSecurityPolicy(input?: ContentSecurityPolicyInput): string;
```

Without input it returns the policy shown under [`csp`](/swagger-ui/configuration#csp). It throws for a source that is empty or contains whitespace, a control character, `;` or `,`.

## `isFileURL()`

Returns `true` when `swaggerUI()` treats a string document as a file path: a string that does not parse as an absolute URL, or a `file:` URL.

```typescript
declare function isFileURL(input: string): boolean;
```

## Types

| Type | Definition |
|------|------------|
| `UIOptions` | `SwaggerConfigs & { oauth?, authAction?, baseURL?, basePath?, oauth2RedirectUrl?, validatorUrl?, csp?, securityHeaders? }` ([Options](/swagger-ui/configuration#options)) |
| `UIOAuthOptions` | The options passed to `ui.initOAuth()` ([`oauth`](/swagger-ui/configuration#oauth)) |
| `ContentSecurityPolicyInput` | `{ origins?: string[]; connectSrc?: string[]; imgSrc?: string[]; frameAncestors?: string[] }` ([`csp`](/swagger-ui/configuration#csp)) |

`Spec` and `SwaggerConfigs` come from `@types/swagger-ui-dist`.
