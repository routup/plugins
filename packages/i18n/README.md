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
    <a href="https://plugins.routup.dev/i18n/"><b>Docs</b></a>
    ·
    <a href="https://plugins.routup.dev/i18n/#options">Options</a>
    ·
    <a href="https://plugins.routup.dev/i18n/#usetranslator">useTranslator()</a>
    ·
    <a href="https://plugins.routup.dev/i18n/#recipes">Recipes</a>
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

## Installation

```bash
npm install @routup/i18n ilingo
```

ESM only, Node.js >=24. Peer dependencies: `routup@^6.3.0` and `ilingo@^6.2.1`.

## Quick Start

```typescript
import { App, defineCoreHandler } from 'routup';
import {
    MemoryStore,
    defineCatalog,
    defineLocale,
    defineNamespace,
    defineTranslations,
} from 'ilingo';
import { i18n, useTranslator } from '@routup/i18n';

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

export const app = new App();

app.use(i18n({ store }));

app.get('/', defineCoreHandler((event) => {
    const translate = useTranslator(event);

    return translate({
        namespace: 'app',
        key: 'greeting',
        data: { name: 'Peter' },
    });
}));
```

The sample exports the app; [serve it](https://routup.dev/guide/quickstart) from your entry file. A client sending `Accept-Language: de-DE` gets `Hallo, mein Name ist Peter`, one sending `en-US` gets `Hello, my name is Peter`.

## Documentation

The full reference lives on [plugins.routup.dev](https://plugins.routup.dev/i18n/):

- [Overview](https://plugins.routup.dev/i18n/): requirements, how the locale is chosen, missing keys, the options, `useTranslator()` and the types
- [Recipes](https://plugins.routup.dev/i18n/#recipes): the locale from the query string, fallback text for missing keys, translations from files

## License

Made with 💚

Published under [MIT License](https://github.com/routup/plugins/blob/master/LICENSE).
