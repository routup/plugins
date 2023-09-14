import supertest from 'supertest';
import { Router, createNodeDispatcher } from 'routup';
import { mountController, mountControllers } from '../../src';
import { HeaderController } from '../data/header';
import { CombinedController } from '../data/combined';

describe('data/combined', () => {
    it('should handle decorator endpoints', async () => {
        const router = new Router();

        mountControllers(router, [CombinedController]);

        const server = supertest(createNodeDispatcher(router));

        let response = await server
            .get('/combined');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('many');

        response = await server
            .get('/combined/admin');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('admin');

        response = await server
            .post('/combined');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('create');

        response = await server
            .delete('/combined/admin');

        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({ id: 'admin' });

        response = await server
            .put('/combined');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('put');

        response = await server
            .patch('/combined');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('patch');
    });

    it('should not handle decorator endpoints', async () => {
        const router = new Router();

        mountControllers(router, [CombinedController]);

        const server = supertest(createNodeDispatcher(router));

        const response = await server
            .delete('/combined/a');

        expect(response.statusCode).toEqual(500);
    });
});
