import { App, defineCoreHandler } from 'routup';
import {
    Ilingo,
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
                defineTranslations({ greeting: 'Hello', farewell: 'Goodbye' }),
            ]),
        ]),
        // German has no farewell yet
        defineLocale('de', [
            defineNamespace('app', [
                defineTranslations({ greeting: 'Hallo' }),
            ]),
        ]),
    ]),
});

const ilingo = new Ilingo({
    store,
    // a key no locale of the chain has: answer with its name
    onMissingKey: ({ namespace, key }) => `${namespace}.${key}`,
});

export const app = new App();

app.use(i18n(ilingo));

app.get('/:key', defineCoreHandler((event) => {
    const translate = useTranslator(event);

    return translate({ namespace: 'app', key: event.params.key! });
}));
