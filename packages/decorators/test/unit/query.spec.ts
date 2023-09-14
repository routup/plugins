import { createHandler, stringify } from '@routup/query';
import { Router, createNodeDispatcher } from 'routup';
import supertest from 'supertest';
import { mountController } from '../../src';
import { QueryController } from '../data/query';

describe('src/decorator', () => {
    it('should handle query decorator', async () => {
        const router = new Router();

        router.use(createHandler());

        mountController(router, QueryController);

        const server = supertest(createNodeDispatcher(router));

        const query = {
            foo: 'bar',
        };

        let response = await server
            .get(`/query/many?${stringify(query)}`);

        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({ foo: 'bar' });

        response = await server
            .get(`/query/single?${stringify(query)}`);

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('bar');
    });
});
