import { createHandler } from '@routup/body';
import { Router, createNodeDispatcher, setRequestBody } from 'routup';
import supertest from 'supertest';
import { mountController } from '../../src';
import { PostController } from '../data/post';

describe('data/body', () => {
    it('should handle decorator endpoints', async () => {
        const router = new Router();

        router.use(createHandler());

        router.use((req, res, next) => {
            setRequestBody(req, 'foo', 'bar');

            next();
        });

        mountController(router, PostController);

        const server = supertest(createNodeDispatcher(router));

        let response = await server
            .post('/post/many');

        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({ foo: 'bar' });

        response = await server
            .post('/post/single');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('bar');
    });
});
