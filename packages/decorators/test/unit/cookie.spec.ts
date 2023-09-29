import { cookie } from '@routup/cookie';
import { Router, createNodeDispatcher } from 'routup';
import supertest from 'supertest';
import { mountController } from '../../src';
import { CookieController } from '../data/cookie';

describe('data/cookie', () => {
    it('should handle decorator endpoints', async () => {
        const router = new Router();

        router.use(cookie());

        mountController(router, CookieController);

        const server = supertest(createNodeDispatcher(router));

        let response = await server
            .get('/cookie/many')
            .set('Cookie', ['foo=bar']);

        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({ foo: 'bar' });

        response = await server
            .get('/cookie/single')
            .set('Cookie', ['foo=bar']);

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('bar');
    });
});
