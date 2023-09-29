import { body, setRequestBody, useRequestBody } from '@routup/body';
import { useRequestCookie, useRequestCookies } from '@routup/cookie';
import {
    Router, coreHandler, createNodeDispatcher,
} from 'routup';
import supertest from 'supertest';
import { decorators, mountController } from '../../src';
import { PostController } from '../data/post';

describe('data/body', () => {
    it('should handle decorator endpoints', async () => {
        const router = new Router();

        router.use(body());

        router.use(coreHandler((req, res, next) => {
            setRequestBody(req, 'foo', 'bar');

            next();
        }));

        router.use(decorators({
            controllers: [PostController],
            parameter: {
                body: (context, name) => {
                    if (name) {
                        return useRequestBody(context.request, name);
                    }

                    return useRequestBody(context.request);
                },
            },
        }));

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
