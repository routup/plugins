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
