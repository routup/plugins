import { createHandler } from '@routup/cookie';
import { Router } from 'routup';
import supertest from 'supertest';
import { mountController } from '../../src';
import { CookieController } from '../data/cookie';

describe('data/cookie', () => {
    it('should handle decorator endpoints', async () => {
        const router = new Router();

        router.use(createHandler());

        mountController(router, CookieController);

        const server = supertest(router.createListener());

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
