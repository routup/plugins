import {
    Router,
    coreHandler,
    createNodeDispatcher,
    useRequestParam,
} from 'routup';
import supertest from 'supertest';
import { basic } from '../../src';
import { useRequestBody } from '../../body';
import { useRequestCookie, useRequestCookies } from '../../cookie';
import { useRequestQuery } from '../../query';

describe('src/**', () => {
    it('should use body plugin', async () => {
        const router = new Router();

        router.use(basic({
            body: true,
        }));

        router.post('/:id', coreHandler((req, res) => useRequestBody(req, useRequestParam(req, 'id'))));
        router.post('/', coreHandler((req, res) => useRequestBody(req)));

        const server = supertest(createNodeDispatcher(router));

        let response = await server
            .post('/foo')
            .send({
                foo: 'bar',
            });

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('bar');

        response = await server
            .post('/')
            .send({
                foo: 'bar',
            });

        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({ foo: 'bar' });
    });

    it('should use cookie plugin', async () => {
        const router = new Router();

        router.use(basic({
            cookie: true,
        }));

        router.get('/:id', coreHandler((req, res) => useRequestCookie(req, useRequestParam(req, 'id'))));
        router.get('/', coreHandler((req, res) => useRequestCookies(req)));

        const server = supertest(createNodeDispatcher(router));

        let response = await server
            .get('/foo')
            .set('Cookie', ['foo=bar']);

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('bar');

        response = await server
            .get('/')
            .set('Cookie', ['foo=bar']);

        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({ foo: 'bar' });
    });

    it('should use query plugin', async () => {
        const router = new Router();

        router.use(basic({
            query: true,
        }));

        router.get('/:id', coreHandler((req) => useRequestQuery(req, useRequestParam(req, 'id'))));
        router.get('/', coreHandler((req, res) => useRequestQuery(req)));

        const server = supertest(createNodeDispatcher(router));
        let response = await server
            .get('/sort?page[limit]=10&sort=-name');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('-name');

        response = await server
            .get('/?page[limit]=10&sort=-name');

        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({
            page: {
                limit: '10',
            },
            sort: '-name',
        });
    });
});
