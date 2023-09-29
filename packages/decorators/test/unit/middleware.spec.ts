import { Router, createNodeDispatcher } from 'routup';
import supertest from 'supertest';
import { decorators } from '../../src';
import { MiddlewareController } from '../data/middleware';

describe('header.ts', () => {
    it('should handle extra decorators', async () => {
        const router = new Router();

        const controller = new MiddlewareController();

        router.use(decorators({
            controllers: [controller],
        }));

        const server = supertest(createNodeDispatcher(router));

        const response = await server
            .get('/middleware');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('value');
    });
});
