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
        defineLocale('en', [defineNamespace('app', [defineTranslations({ greeting: 'Hello' })])]),
        defineLocale('de', [defineNamespace('app', [defineTranslations({ greeting: 'Hallo' })])]),
    ]),
});

export const app = new App();

app.use(i18n({ store }));

app.get('/', defineCoreHandler(async (event) => {
    const translate = useTranslator(event);

    return {
        request: await translate({ namespace: 'app', key: 'greeting' }),
        english: await translate({
            namespace: 'app',
            key: 'greeting',
            locale: 'en',
        }),
    };
}));
