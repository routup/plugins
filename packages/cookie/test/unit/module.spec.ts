import supertest from 'supertest';
import {
    HeaderName, Router, coreHandler, createNodeDispatcher, send,
} from 'routup';
import {
    cookie,
    setResponseCookie,
    unsetResponseCookie,
    useRequestCookie,
    useRequestCookies,
} from '../../src';

describe('src/module', () => {
    it('should parse cookie', async () => {
        const router = new Router();

        router.use(cookie());

        router.get('/', coreHandler((req, res) => {
            useRequestCookies(req);

            const foo = useRequestCookie(req, 'foo');
            send(res, foo);
        }));

        const server = supertest(createNodeDispatcher(router));

        const response = await server
            .get('/')
            .set('Cookie', ['foo=bar']);

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('bar');
    });

    it('should parse cookie with middleware', async () => {
        const router = new Router();

        router.use(cookie());

        router.get('/', coreHandler((req, res) => {
            useRequestCookies(req);

            const foo = useRequestCookie(req, 'bar');
            send(res, foo);
        }));

        const server = supertest(createNodeDispatcher(router));

        const response = await server
            .get('/')
            .set('Cookie', ['bar=baz']);

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('baz');
    });

    it('should set (multiple) cookie', async () => {
        const router = new Router();

        router.get('/', coreHandler((req, res) => {
            setResponseCookie(res, 'bar', 'baz');

            send(res);
        }));

        router.get('/multiple', coreHandler((req, res) => {
            setResponseCookie(res, 'foo', 'bar');
            setResponseCookie(res, 'bar', 'baz');

            send(res);
        }));

        const server = supertest(createNodeDispatcher(router));

        let response = await server
            .get('/')
            .set('Cookie', ['foo=bar']);

        expect(response.statusCode).toEqual(200);
        expect(response.headers[HeaderName.SET_COOKIE]).toEqual(['bar=baz; Path=/']);

        response = await server
            .get('/multiple');

        expect(response.statusCode).toEqual(200);
        expect(response.headers[HeaderName.SET_COOKIE]).toEqual([
            'foo=bar; Path=/',
            'bar=baz; Path=/',
        ]);
    });

    it('should unset cookie', async () => {
        const router = new Router();

        router.get('/', coreHandler((req, res) => {
            unsetResponseCookie(res, 'foo');

            send(res);
        }));

        const server = supertest(createNodeDispatcher(router));

        const response = await server
            .get('/')
            .set('Cookie', ['foo=bar']);

        expect(response.statusCode).toEqual(200);
        expect(response.headers[HeaderName.SET_COOKIE]).toEqual(['foo=; Max-Age=0; Path=/']);
    });
});
