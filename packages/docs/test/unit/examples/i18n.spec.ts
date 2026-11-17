import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';
import {
    LoaderStore,
    MemoryStore,
    defineCatalog,
    defineLocale,
    defineNamespace,
    defineTranslations,
} from 'ilingo';
import { App, defineCoreHandler } from 'routup';
import { i18n, useTranslator } from '@routup/i18n';
import type { Options } from '@routup/i18n';
import { app as loadFiles } from '../../../examples/i18n/load-files';
import { app as localeFunction } from '../../../examples/i18n/locale-function';
import { app as localeOverride } from '../../../examples/i18n/locale-override';
import { app as missingKeys } from '../../../examples/i18n/missing-keys';
import { app as quickStart } from '../../../examples/i18n/quick-start';

function request(path: string, language?: string): Request {
    return new Request(`http://localhost${path}`, { headers: language ? { 'accept-language': language } : {} });
}

async function text(app: App, path: string, language?: string): Promise<string> {
    const response = await app.fetch(request(path, language));

    expect(response.status).toBe(200);

    return response.text();
}

function createStore(): MemoryStore {
    return new MemoryStore({
        data: defineCatalog([
            defineLocale('en', [defineNamespace('app', [defineTranslations({ greeting: 'Hello' })])]),
            defineLocale('de', [defineNamespace('app', [defineTranslations({ greeting: 'Hallo' })])]),
            defineLocale('fr', [defineNamespace('app', [defineTranslations({ greeting: 'Bonjour' })])]),
        ]),
    });
}

function create(options?: Options, timeout?: number): App {
    const app = new App(timeout ? { options: { timeout } } : {});

    app.use(options ? i18n(options) : i18n());
    app.get('/', defineCoreHandler(async (event) => {
        const value = await useTranslator(event)({ namespace: 'app', key: 'greeting' });

        return { value: value ?? null };
    }));

    return app;
}

async function greeting(app: App, language?: string): Promise<unknown> {
    const response = await app.fetch(request('/', language));

    return ((await response.json()) as { value: unknown }).value;
}

let warn: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
    warn.mockRestore();
});

describe('quick-start', () => {
    it('answers in the language the client prefers', async () => {
        expect(await text(quickStart, '/', 'de-DE,de;q=0.9')).toBe('Hallo, mein Name ist Peter');
        expect(await text(quickStart, '/', 'en-US')).toBe('Hello, my name is Peter');
    });

    it('uses the first locale of the store without the header', async () => {
        expect(await text(quickStart, '/')).toBe('Hello, my name is Peter');
    });
});

describe('locale-function', () => {
    it('prefers the query parameter over the header', async () => {
        expect(await text(localeFunction, '/?lang=de', 'en')).toBe('Hallo');
    });

    it('falls back to the header when the function returns undefined', async () => {
        expect(await text(localeFunction, '/', 'de')).toBe('Hallo');
    });

    it('uses a returned locale the store does not have, and the lookup falls back to en', async () => {
        expect(await text(localeFunction, '/?lang=xx', 'de')).toBe('Hello');
    });
});

describe('missing-keys', () => {
    it('translates a key the request locale has', async () => {
        expect(await text(missingKeys, '/greeting', 'de')).toBe('Hallo');
    });

    it('falls back to en for a key the request locale lacks', async () => {
        expect(await text(missingKeys, '/farewell', 'de')).toBe('Goodbye');
    });

    it('answers with onMissingKey for a key no locale has', async () => {
        expect(await text(missingKeys, '/nope', 'de')).toBe('app.nope');
    });
});

describe('load-files', () => {
    it('reads the translations from the json files', async () => {
        expect(await text(loadFiles, '/', 'de')).toBe('Hallo aus einer Datei');
        expect(await text(loadFiles, '/', 'en')).toBe('Hello from a file');
    });

    it('negotiates against the locales option', async () => {
        expect(await text(loadFiles, '/')).toBe('Hello from a file');
        expect(await text(loadFiles, '/', 'fr, de;q=0.5')).toBe('Hallo aus einer Datei');
    });
});

describe('locale-override', () => {
    it('lets a locale in the lookup win over the request locale', async () => {
        const response = await localeOverride.fetch(request('/', 'de'));

        expect(await response.json()).toEqual({ request: 'Hallo', english: 'Hello' });
    });
});

describe('behaviour stated on the page', () => {
    it('weighs the q values of Accept-Language', async () => {
        expect(await greeting(create({ store: createStore() }), 'en;q=0.5, fr;q=0.9')).toBe('Bonjour');
    });

    it('matches a regional tag to its language', async () => {
        expect(await greeting(create({ store: createStore() }), 'de-CH')).toBe('Hallo');
    });

    it('uses the locale string when the header matches no locale, else ilingo en', async () => {
        expect(await greeting(create({ store: createStore() }), 'es')).toBe('Hello');
        expect(await greeting(create({ store: createStore(), locale: 'fr' }), 'es')).toBe('Bonjour');
    });

    it('does not force the locale string', async () => {
        const app = create({ store: createStore(), locale: 'fr' });

        expect(await greeting(app)).toBe('Hello');
        expect(await greeting(app, 'de')).toBe('Hallo');
    });

    it('awaits an async locale function', async () => {
        expect(await greeting(create({ store: createStore(), locale: async () => 'fr' }), 'de')).toBe('Bonjour');
    });

    it('reads the locales of the store once, on the first request', async () => {
        const store = createStore();
        const app = create({ store });

        expect(await greeting(app, 'de')).toBe('Hallo');

        await store.set({
            locale: 'it',
            namespace: 'app',
            key: 'greeting',
            value: 'Ciao',
        });

        expect(await greeting(app, 'it')).toBe('Hello');
        expect(await greeting(create({ store }), 'it')).toBe('Ciao');
    });

    it('does not negotiate when the store reports no locales, and keeps that from the first request', async () => {
        const texts: Record<string, string> = { en: 'Hello', de: 'Hallo' };
        const store = new LoaderStore({
            // no locales option: getLocales() reports only what is loaded
            loader: (locale) => (texts[locale] ? defineTranslations({ greeting: texts[locale]! }) : undefined),
        });
        const app = new App();

        app.use(i18n({ store }));
        app.get('/', defineCoreHandler(async (event) => ({
            locale: event.store[Symbol.for('@routup/i18n:ReqI18nLocale')],
            text: (await useTranslator(event)({ namespace: 'app', key: 'greeting' })) ?? null,
        })));

        const read = async (language?: string) => (await app.fetch(request('/', language))).json();

        // first request: the store reports [], which the plugin keeps
        expect(await read('de')).toEqual({ locale: 'de', text: 'Hallo' });
        expect(await store.getLocales()).toEqual(['de']);

        // the first Accept-Language entry as sent, not negotiated against de
        expect(await read('fr, de;q=0.5')).toEqual({ locale: 'fr', text: 'Hello' });
        // the most preferred entry, not reduced to a loaded locale
        expect(await read('fr;q=0.2, it')).toEqual({ locale: 'it', text: 'Hello' });
        expect(await read('de-CH')).toEqual({ locale: 'de-CH', text: 'Hallo' });
        // * without the header
        expect(await read()).toEqual({ locale: '*', text: 'Hello' });
        // no locale for a header of q=0 entries: the instance locale applies
        expect(await read('fr;q=0')).toEqual({ text: 'Hello' });
    });

    it('misses every key without a store', async () => {
        expect(await greeting(create(), 'en')).toBeNull();
    });

    it('resolves a missing key to undefined and warns outside production', async () => {
        expect(await greeting(create({ store: createStore() }), 'de')).toBe('Hallo');

        const app = new App();

        app.use(i18n({ store: createStore() }));
        app.get('/', defineCoreHandler(async (event) => ({ value: (await useTranslator(event)({ namespace: 'app', key: 'nope' })) ?? null })));

        expect(await (await app.fetch(request('/', 'de'))).json()).toEqual({ value: null });
        expect(warn).toHaveBeenCalledWith('[ilingo] missing translation for "app.nope" (locale=de)');
    });

    it('leaves the request unanswered when a handler returns the undefined of a missing key', async () => {
        const app = new App({ options: { timeout: 50 } });

        app.use(i18n({ store: createStore() }));
        app.get('/', defineCoreHandler((event) => useTranslator(event)({ namespace: 'app', key: 'nope' })));

        const response = await app.fetch(request('/'));

        expect(response.status).toBe(408);
    });

    it('throws a 500 error from useTranslator without the plugin', async () => {
        const app = new App();

        app.get('/', defineCoreHandler((event) => useTranslator(event)({ namespace: 'app', key: 'greeting' })));

        const response = await app.fetch(new Request('http://localhost/', { headers: { accept: 'application/json' } }));

        expect(response.status).toBe(500);
        expect(await response.json()).toMatchObject({ message: 'The i18n plugin is not installed.' });
    });

    it('throws a 500 error from useTranslator for a locale that is not a string', async () => {
        const app = new App();

        app.use(i18n({ store: createStore(), locale: () => 1 as unknown as string }));
        app.get('/', defineCoreHandler((event) => useTranslator(event)({ namespace: 'app', key: 'greeting' })));

        const response = await app.fetch(new Request('http://localhost/', { headers: { accept: 'application/json' } }));

        expect(response.status).toBe(500);
        expect(await response.json()).toMatchObject({ message: 'The i18n locale must either be of type string or undefined.' });
    });
});
