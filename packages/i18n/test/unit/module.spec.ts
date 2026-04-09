import { describe, expect, it } from 'vitest';
import { MemoryStore } from 'ilingo';
import {
    Router,
    defineCoreHandler,
} from 'routup';
import { i18n, useTranslator } from '../../src';

function createTestRequest(url: string, options?: RequestInit): Request {
    const fullUrl = url.startsWith('http') ? url : `http://localhost${url}`;
    return new Request(fullUrl, options);
}

describe('src/module', () => {
    it('should translate text', async () => {
        const router = new Router();

        const store = new MemoryStore({
            data: {
                de: { app: { key: 'Hallo Welt!' } },
                en: { app: { key: 'Hello world!' } },
            },
        });
        router.use(i18n({ store }));

        router.get('/', defineCoreHandler(async (event) => {
            const translator = useTranslator(event);
            return translator({ group: 'app', key: 'key' });
        }));

        let response = await router.fetch(createTestRequest('/', { headers: { 'accept-language': 'de-CH,de-DE;q=0.9,de;q=0.8,en-US;q=0.7,en;q=0.6' } }));

        expect(response.status).toEqual(200);
        expect(await response.text()).toEqual('Hallo Welt!');

        response = await router.fetch(createTestRequest('/', { headers: { 'accept-language': 'en-US;q=0.9,en-GB;q=0.8' } }));

        expect(response.status).toEqual(200);
        expect(await response.text()).toEqual('Hello world!');
    });

    it('should translate text with params', async () => {
        const router = new Router();

        const store = new MemoryStore({
            data: {
                de: { app: { key: 'Hallo, mein Name ist {{name}}' } },
                en: { app: { key: 'Hello, my name is {{name}}' } },
            },
        });
        router.use(i18n({ store }));

        router.get('/', defineCoreHandler(async (event) => {
            const translator = useTranslator(event);

            return translator({
                group: 'app',
                key: 'key',
                data: { name: 'Peter' },
            });
        }));

        let response = await router.fetch(createTestRequest('/', { headers: { 'accept-language': 'de-CH,de-DE;q=0.9,de;q=0.8,en-US;q=0.7,en;q=0.6' } }));

        expect(response.status).toEqual(200);
        expect(await response.text()).toEqual('Hallo, mein Name ist Peter');

        response = await router.fetch(createTestRequest('/', { headers: { 'accept-language': 'en-US;q=0.9,en-GB;q=0.8' } }));

        expect(response.status).toEqual(200);
        expect(await response.text()).toEqual('Hello, my name is Peter');
    });

    it('should work with custom locale fn', async () => {
        const router = new Router();

        const store = new MemoryStore({
            data: {
                de: { app: { key: 'Hallo Welt!' } },
                en: { app: { key: 'Hello world!' } },
            },
        });

        router.use(i18n({
            locale: () => 'en',
            store,
        }));

        router.get('/', defineCoreHandler(async (event) => {
            const translator = useTranslator(event);
            return translator({ group: 'app', key: 'key' });
        }));

        const response = await router.fetch(createTestRequest('/', { headers: { 'accept-language': 'de-CH,de-DE;q=0.9,de;q=0.8,en-US;q=0.7,en;q=0.6' } }));

        expect(response.status).toEqual(200);
        expect(await response.text()).toEqual('Hello world!');
    });
});
