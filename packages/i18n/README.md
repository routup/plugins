<p align="center">
    <img src="./assets/logo.svg" alt="@routup/i18n logo: one message, two languages" width="128" height="128" />
</p>

<h1 align="center">@routup/i18n</h1>

<p align="center">
    <b>Pick each request's locale and translate messages with ilingo inside routup handlers.</b><br>
    You stop parsing <code>Accept-Language</code> and passing the locale to every lookup: <code>useTranslator(event)</code> is already bound to it.
</p>

<p align="center">
    <a href="https://www.npmjs.com/package/@routup/i18n"><img src="https://img.shields.io/npm/v/@routup/i18n" alt="npm version" /></a>
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
    <a href="https://plugins.routup.dev/i18n/">Docs</a>
</p>

---

## Why @routup/i18n?

A server that answers in the client's language has to read `Accept-Language`, match it against the locales it has translations for, and hand that locale to every translation call. With [ilingo](https://github.com/tada5hi/ilingo) alone you do the matching yourself and pass `locale` into each `ilingo.get()`.

| Concern | Without it | With @routup/i18n |
|---------|-----------|-------------------|
| Locale detection | Parse `Accept-Language`, weigh the `q` values, compare with your locales | The header is negotiated against the locales your ilingo store reports |
| Locale per lookup | `ilingo.get({ locale, namespace, key })` with the locale threaded through | `useTranslator(event)` returns a translator that fills in the request's locale |
| Own locale source | Write the precedence logic (user setting, then header) yourself | `locale: (event) => ...`; returning `undefined` falls back to the header |
| Forgotten setup | A lookup without a locale silently uses ilingo's default | `useTranslator()` throws a `500` error when the plugin is not installed |

```typescript
import { i18n, useTranslator } from '@routup/i18n';
import { MemoryStore } from 'ilingo';
import { App, defineCoreHandler } from 'routup';

declare const store: MemoryStore;

const app = new App();

app.use(i18n({ store }));

app.get('/', defineCoreHandler((event) => {
    const translate = useTranslator(event);

    return translate({ namespace: 'app', key: 'greeting' });
}));
```

## Installation

```bash
npm install @routup/i18n ilingo --save
```

ESM only, Node.js `>=24`, peer dependencies `routup@^6.3.0` and `ilingo@^6.2.1`.

## Usage

### Translating in a handler

```typescript
import { i18n, useTranslator } from '@routup/i18n';
import {
    MemoryStore,
    defineCatalog,
    defineLocale,
    defineNamespace,
    defineTranslations,
} from 'ilingo';
import { App, defineCoreHandler, serve } from 'routup';

const store = new MemoryStore({
    data: defineCatalog([
        defineLocale('en', [
            defineNamespace('app', [
                defineTranslations({ greeting: 'Hello, my name is {{name}}' }),
            ]),
        ]),
        defineLocale('de', [
            defineNamespace('app', [
                defineTranslations({ greeting: 'Hallo, mein Name ist {{name}}' }),
            ]),
        ]),
    ]),
});

const router = new App();

router.use(i18n({ store }));

router.get('/', defineCoreHandler(async (event) => {
    const translate = useTranslator(event);

    // "Hallo, mein Name ist Peter" for Accept-Language: de-DE,de;q=0.9
    // "Hello, my name is Peter" for Accept-Language: en-US
    return translate({
        namespace: 'app',
        key: 'greeting',
        data: { name: 'Peter' },
    });
}));

serve(router, { port: 3000 });
```

- Install the plugin before the routes that translate. It resolves the locale and stores it with the ilingo instance on the event.
- The translator returns a `Promise<string | undefined>`; `undefined` means the key is missing in every locale of the fallback chain.
- `data` fills `{{name}}` placeholders. `count`, plurals, fallback chains and formatters work as in [ilingo](https://github.com/tada5hi/ilingo).

### How the locale is chosen

For each request the plugin picks the locale in this order:

1. The `locale` function, if you passed one and it returns a string.
2. `Accept-Language`, negotiated against the locales your store reports. Without the header, the first locale the store reports wins.
3. Nothing matched (the client asks only for locales you do not have): the request locale stays `undefined` and ilingo uses its own locale, which is the `locale` string option if you set one, otherwise `'en'`.

### Custom locale resolution

```typescript
import { i18n } from '@routup/i18n';
import type { MemoryStore } from 'ilingo';
import { App } from 'routup';

declare const store: MemoryStore;

const router = new App();

router.use(i18n({
    store,
    locale: (event) => new URL(event.request.url).searchParams.get('lang') ?? undefined,
}));
```

The function may be `async`. Return `undefined` to fall back to `Accept-Language`.

### Passing an Ilingo instance

```typescript
import { i18n } from '@routup/i18n';
import { Ilingo } from 'ilingo';
import type { MemoryStore } from 'ilingo';
import { App } from 'routup';

declare const store: MemoryStore;

const ilingo = new Ilingo({
    store,
    locale: 'de',
    fallback: 'en',
    onMissingKey: ({ namespace, key }) => `${namespace}.${key}`,
});

const router = new App();

router.use(i18n(ilingo));
```

`Options` only forwards `store` to ilingo. Pass your own `Ilingo` when you need `fallback`, `onMissingKey`, `formatters` or several stores registered later. A custom `locale` function is not available in this form.

### Overriding the locale per call

```typescript
import { useTranslator } from '@routup/i18n';
import { defineCoreHandler } from 'routup';

export const handler = defineCoreHandler(async (event) => {
    const translate = useTranslator(event);

    return translate({ namespace: 'app', key: 'greeting', locale: 'de' });
});
```

A `locale` in the lookup context wins over the request locale.

## Options

`i18n()`, `i18n(ilingo)` or `i18n(options)`:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `store` | `IStore \| IStore[]` | none | ilingo store(s) holding the translations; passed to `new Ilingo({ store })` |
| `locale` | `string \| (event) => string \| undefined \| Promise<string \| undefined>` | none | A string becomes the Ilingo instance's locale (used when negotiation finds no match). A function picks the locale per request; `undefined` falls back to `Accept-Language` |

Called with no argument, the plugin creates an `Ilingo` without a store, so every lookup misses.

## API

| Export | Kind | Purpose |
|--------|------|---------|
| `i18n(input?)` (also default export) | Plugin factory | Resolves the request locale and attaches the Ilingo instance to the event |
| `useTranslator(event)` | Function | Returns a `Translator` bound to the request's locale |
| `Options` | Type | Plugin options (`store`, `locale`) |
| `LocaleReqFn` | Type | `(event) => string \| undefined \| Promise<string \| undefined>` |
| `Translator` | Type | `(ctx: GetContext) => Promise<string \| undefined>` |

### `useTranslator`

Returns a translator function that looks up a key in the request's locale.

```typescript
import type { IAppEvent } from 'routup';
import type { Translator } from '@routup/i18n';

declare function useTranslator(event: IAppEvent): Translator;
```

The lookup context is ilingo's `GetContext`: `namespace`, `key`, and optional `data`, `count` and `locale`.

See the [i18n docs page](https://plugins.routup.dev/i18n/) for more.

## Notes

- **`useTranslator()` throws without the plugin.** It raises a routup error with status `500` and the message `The i18n plugin is not installed.`
- **A `locale` string is not a forced locale.** It only applies when `Accept-Language` matches none of your locales. A request without the header gets the first locale of the store; use a `locale` function to force one.
- **Locales are read once.** The plugin calls `ilingo.getLocales()` on the first request and caches the result, so locales added to the store later are not negotiated.
- **Translation is async.** `await` the translator, or return its promise from the handler.

## License

Made with 💚

Published under [MIT License](https://github.com/routup/plugins/blob/master/LICENSE).
