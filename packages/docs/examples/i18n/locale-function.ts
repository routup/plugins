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

app.use(i18n({
    store,
    // ?lang=de wins; without it, Accept-Language decides
    locale: (event) => event.searchParams.get('lang') ?? undefined,
}));

app.get('/', defineCoreHandler(async (event) => {
    const translate = useTranslator(event);

    const text = await translate({ namespace: 'app', key: 'greeting' });

    // a missing key resolves to undefined, which would leave the request unanswered
    return text ?? 'app.greeting';
}));
