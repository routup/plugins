import {
    HeaderName, Router, coreHandler, createNodeDispatcher,
} from 'routup';
import supertest from 'supertest';
import { i18n, useTranslator } from '../../src';

describe('src/module', () => {
    it('should translate text', async () => {
        const router = new Router();

        router.use(i18n({
            data: {
                de: {
                    app: {
                        key: 'Hallo Welt!',
                    },
                },
                en: {
                    app: {
                        key: 'Hello world!',
                    },
                },
            },
        }));

        router.get('/', coreHandler(async (req, res) => {
            const translator = useTranslator(req);
            return translator('app.key');
        }));

        const server = supertest(createNodeDispatcher(router));

        let response = await server
            .get('/')
            .set(HeaderName.ACCEPT_LANGUAGE, 'de-CH,de-DE;q=0.9,de;q=0.8,en-US;q=0.7,en;q=0.6');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('Hallo Welt!');

        response = await server
            .get('/')
            .set(HeaderName.ACCEPT_LANGUAGE, 'en-US;q=0.9,en-GB;q=0.8');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('Hello world!');
    });

    it('should translate text with params', async () => {
        const router = new Router();

        router.use(i18n({
            data: {
                de: {
                    app: {
                        key: 'Hallo, mein Name ist {{name}}',
                    },
                },
                en: {
                    app: {
                        key: 'Hello, my name is {{name}}',
                    },
                },
            },
        }));

        router.get('/', coreHandler(async (req, res) => {
            const translator = useTranslator(req);
            return translator('app.key', { name: 'Peter' });
        }));

        const server = supertest(createNodeDispatcher(router));

        let response = await server
            .get('/')
            .set(HeaderName.ACCEPT_LANGUAGE, 'de-CH,de-DE;q=0.9,de;q=0.8,en-US;q=0.7,en;q=0.6');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('Hallo, mein Name ist Peter');

        response = await server
            .get('/')
            .set(HeaderName.ACCEPT_LANGUAGE, 'en-US;q=0.9,en-GB;q=0.8');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('Hello, my name is Peter');
    });

    it('should work with custom locale fn', async () => {
        const router = new Router();

        router.use(i18n({
            locale: () => 'en',
            data: {
                de: {
                    app: {
                        key: 'Hallo Welt!',
                    },
                },
                en: {
                    app: {
                        key: 'Hello world!',
                    },
                },
            },
        }));

        router.get('/', coreHandler(async (req, res) => {
            const translator = useTranslator(req);
            return translator('app.key');
        }));

        const server = supertest(createNodeDispatcher(router));

        const response = await server
            .get('/')
            .set(HeaderName.ACCEPT_LANGUAGE, 'de-CH,de-DE;q=0.9,de;q=0.8,en-US;q=0.7,en;q=0.6');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('Hello world!');
    });
});
