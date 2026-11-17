---
title: i18n
description: Locale-aware translation for routup, built on top of ilingo.
relatedPlugins: []
plugin:
    package: '@routup/i18n'
    summary: 'Per-request translations.'
    group: 'Operations'
    order: 6
---

# @routup/i18n

Picks a locale for each request and translates messages in that locale with [ilingo](https://github.com/tada5hi/ilingo). The plugin negotiates `Accept-Language` against the locales of your ilingo store, and `useTranslator(event)` returns a translator already bound to the result.

## Requirements

- Node.js 24 or later, ESM only
- `routup` `^6.3.0` (peer dependency)
- `ilingo` `^6.2.1` (peer dependency): the stores, the catalog helpers and the lookup itself

## Installation

```bash
npm install @routup/i18n ilingo
```

## Quick Start

<<< @/../examples/i18n/quick-start.ts

`i18n()` is a plugin: register it with `app.use()` before the routes that translate ([Plugins](https://routup.dev/guide/plugins)). The file exports the app; [serve it](https://routup.dev/guide/quickstart) from your entry file.

```bash
curl -H 'accept-language: de-DE,de;q=0.9' http://localhost:3000/
# Hallo, mein Name ist Peter
curl -H 'accept-language: en-US' http://localhost:3000/
# Hello, my name is Peter
```

## Default Behaviour

For each request the plugin picks the locale in this order:

| Step | Source | Used when |
|------|--------|-----------|
| 1 | The [`locale`](#options) function | It returns a string; the string is used as is, also when the store has no such locale |
| 2 | `Accept-Language`, negotiated against the locales the store reports | The header has a match; `q` weights count and `de-CH` matches `de`. Without the header, the first locale of the store wins. When the store reports no locales, see below |
| 3 | The locale of the ilingo instance | Nothing matched: the [`locale`](#options) string if you set one, otherwise ilingo's default `'en'` |

A store that reports no locales on the first request (no store, or a `LoaderStore` without its `locales` option) turns negotiation off for good: the request locale is then the client's first `Accept-Language` entry as sent, for example `fr` for `fr, de;q=0.5` even when `de` is loaded, or `*` without the header. Steps 2 and 3 do not apply; lookups for a locale the store lacks fall back as described next.

The translator then looks the key up through ilingo's fallback chain: the request locale, its BCP-47 parents (`de-CH`, then `de`) and finally `en`. A key that no locale of the chain has resolves to `undefined`, and ilingo warns about it once per locale, namespace and key unless `NODE_ENV` is `production`.

- **Return a string for a missing key.** A handler that returns `undefined` leaves the request unanswered: routup waits for `event.next()` until a timeout answers `408`, or forever without one. Use `?? fallback` on the result, or `onMissingKey` ([Fallback Text for Missing Keys](#fallback-text-for-missing-keys)).
- **Locales are read once.** The plugin calls `getLocales()` of the ilingo instance on the first request and keeps the result, also an empty one, so a locale added to the store later is not negotiated.
- **Translation is async.** The translator returns a promise; `await` it, as the samples do.

## Options

`i18n()` takes nothing, an options object or an `Ilingo` instance.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `store` | `IStore \| IStore[]` | none | ilingo store or stores with the translations; passed to `new Ilingo({ store })` |
| `locale` | `string \| LocaleReqFn` | none | A string becomes the locale of the ilingo instance, a function picks the locale per request |

Without an argument, the plugin creates an `Ilingo` without a store, so every lookup misses.

The options form forwards only `store` to ilingo. For `fallback`, `onMissingKey`, `formatters` or stores registered later, create the `Ilingo` yourself and pass it: `i18n(ilingo)` ([Fallback Text for Missing Keys](#fallback-text-for-missing-keys)). That form has no `locale` function; the locale of the instance is the one of step 3.

- **A `locale` string is not a forced locale.** It applies only when the request matches none of the locales of the store (step 3). A request without `Accept-Language` gets the first locale of the store. To force a locale, use a function that always returns it.
- **A `locale` function** receives the event, may be `async` and returns a locale or `undefined`; `undefined` falls back to `Accept-Language`. [Locale From the Query String](#locale-from-the-query-string) shows one.

## `i18n()`

Creates the plugin. It is also the default export.

```typescript
declare function i18n(): Plugin;
declare function i18n(ilingo: Ilingo): Plugin;
declare function i18n(options: Options): Plugin;
```

## `useTranslator()`

Returns a translator for the locale the plugin chose for this request.

```typescript
declare function useTranslator(event: IAppEvent): Translator;
```

The translator takes ilingo's `GetContext`: `namespace`, `key` and optional `data` (fills `{{name}}` placeholders), `count` (plural forms) and `locale`. A `locale` in the context wins over the request locale:

<<< @/../examples/i18n/locale-override.ts

```bash
curl -H 'accept-language: de' http://localhost:3000/
# {"request":"Hallo","english":"Hello"}
```

`useTranslator()` throws a routup error with status `500` in two cases:

- the plugin is not installed: `The i18n plugin is not installed.`
- the `locale` function returned something other than a string or `undefined`: `The i18n locale must either be of type string or undefined.`

Plurals, formatters and fallback chains work as described in the [ilingo documentation](https://github.com/tada5hi/ilingo).

## Types

| Type | Definition |
|------|------------|
| `Options` | `{ store?: IStore \| IStore[], locale?: string \| LocaleReqFn }` ([Options](#options)) |
| `LocaleReqFn` | `(event: IAppEvent) => Promise<string \| undefined> \| string \| undefined` |
| `Translator` | `(ctx: GetContext) => Promise<string \| undefined>` |

## Recipes

### Locale From the Query String

A `locale` function reads `?lang=` and returns `undefined` without it, so `Accept-Language` decides then.

<<< @/../examples/i18n/locale-function.ts

```bash
curl -H 'accept-language: en' 'http://localhost:3000/?lang=de'
# Hallo
curl -H 'accept-language: de' http://localhost:3000/
# Hallo
```

### Fallback Text for Missing Keys

A key the request locale lacks falls back to `en`. For a key that no locale has, an `Ilingo` instance with `onMissingKey` returns its name instead of `undefined`.

<<< @/../examples/i18n/missing-keys.ts

```bash
curl -H 'accept-language: de' http://localhost:3000/farewell
# Goodbye
curl -H 'accept-language: de' http://localhost:3000/nope
# app.nope
```

### Translations From Files

A `LoaderStore` loads one JSON file per locale and namespace on first use and caches it. Set its `locales` option: it is the list the plugin negotiates against. Without it, the store reports no locales on the first request, since nothing is loaded yet, and the plugin never negotiates ([Default Behaviour](#default-behaviour)).

<<< @/../examples/i18n/load-files.ts

With `locales/de/app.json` containing `{ "greeting": "Hallo aus einer Datei" }`:

```bash
curl -H 'accept-language: de' http://localhost:3000/
# Hallo aus einer Datei
```

## Next Steps

- [ilingo](https://github.com/tada5hi/ilingo): stores, catalogs, plurals, formatters and fallback chains
- [Plugins](https://routup.dev/guide/plugins): register a plugin, also under a path
