import supertest from 'supertest';
import {
    Router, coreHandler, createNodeDispatcher, send,
} from 'routup';
import { query, stringify, useRequestQuery } from '../../src';

describe('src/module', () => {
    it('should parse request query', async () => {
        const router = new Router();

        router.use(query());

        router.get('/', coreHandler((req, res) => {
            send(res, useRequestQuery(req));
        }));

        router.get('/key', coreHandler((req, res) => {
            useRequestQuery(req, 'sort');

            send(res, useRequestQuery(req, 'sort'));
        }));

        router.get('/reuse', coreHandler((req, res) => {
            useRequestQuery(req);

            send(res, useRequestQuery(req));
        }));

        const server = supertest(createNodeDispatcher(router));

        const qs = { page: { limit: '10', offset: '0' }, sort: '-name' };

        let response = await server
            .get(`/?${stringify(qs)}`);

        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual(qs);

        response = await server
            .get('/');

        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({});

        response = await server
            .get(`/key?${stringify(qs)}`);

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('-name');

        response = await server
            .get(`/reuse?${stringify(qs)}`);

        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual(qs);
    });

    it('should parse request query with middleware', async () => {
        const router = new Router();

        router.use(query());

        router.get('/', coreHandler((req, res) => {
            send(res, useRequestQuery(req));
        }));

        const server = supertest(createNodeDispatcher(router));

        const qs = { page: { limit: '10', offset: '0' }, sort: '-name' };

        const response = await server
            .get(`/?${stringify(qs)}`);

        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual(qs);
    });
});
