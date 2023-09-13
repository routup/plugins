import { Router, createNodeListener } from 'routup';
import supertest from 'supertest';
import { mountController } from '../../src';
import { MiddlewareController } from '../data/middleware';

describe('header.ts', () => {
    it('should handle extra decorators', async () => {
        const router = new Router();

        const controller = new MiddlewareController();

        mountController(router, controller);

        const server = supertest(createNodeListener(router));

        const response = await server
            .get('/middleware');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('value');
    });
});
