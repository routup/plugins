import { Router, createNodeDispatcher } from 'routup';
import supertest from 'supertest';
import { decorators } from '../../src';
import { HeaderController } from '../data/header';

describe('header.ts', () => {
    it('should handle extra decorators', async () => {
        const router = new Router();

        const controller = new HeaderController();

        router.use(decorators({
            controllers: [controller],
        }));

        const server = supertest(createNodeDispatcher(router));

        let response = await server
            .get('/header/many');

        expect(response.statusCode).toEqual(200);
        expect(response.body).toBeDefined();

        response = await server
            .get('/header/single');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('close');
    });
});
