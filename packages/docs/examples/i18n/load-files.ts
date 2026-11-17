import { readFile } from 'node:fs/promises';
import { App, defineCoreHandler } from 'routup';
import { LoaderStore, defineTranslations } from 'ilingo';
import { i18n, useTranslator } from '@routup/i18n';

// locales/<locale>/<namespace>.json, next to this file
const directory = new URL('./locales/', import.meta.url);

const store = new LoaderStore({
    // negotiated against Accept-Language
    locales: ['en', 'de'],
    loader: async (locale, namespace) => {
        try {
            const file = new URL(`${locale}/${namespace}.json`, directory);

            return defineTranslations(JSON.parse(await readFile(file, 'utf8')));
        } catch {
            return undefined;
        }
    },
});

export const app = new App();

app.use(i18n({ store }));

app.get('/', defineCoreHandler(async (event) => {
    const translate = useTranslator(event);

    const text = await translate({ namespace: 'app', key: 'greeting' });

    // a missing key resolves to undefined, which would leave the request unanswered
    return text ?? 'app.greeting';
}));
