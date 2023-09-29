import {
    HeaderName, Router, coreHandler, createNodeDispatcher,
} from 'routup';
import supertest from 'supertest';
import { RETRY_AGAIN_MESSAGE, rateLimit } from '../../src';

describe('src/module', () => {
    it('should set rate limit headers', async () => {
        const router = new Router();
        router.use(rateLimit());
        router.use(coreHandler(() => 'Hello, World!'));

        const server = supertest(createNodeDispatcher(router));

        let response = await server
            .get('/');

        expect(response.statusCode).toEqual(200);
        expect(response.headers[HeaderName.RATE_LIMIT_LIMIT]).toEqual('5');
        expect(response.headers[HeaderName.RATE_LIMIT_REMAINING]).toEqual('4');
        expect(response.headers[HeaderName.RATE_LIMIT_RESET]).toBeDefined();
        expect(response.headers[HeaderName.RETRY_AFTER]).toBeUndefined();

        response = await server
            .get('/');

        expect(response.statusCode).toEqual(200);
        expect(response.headers[HeaderName.RATE_LIMIT_LIMIT]).toEqual('5');
        expect(response.headers[HeaderName.RATE_LIMIT_REMAINING]).toEqual('3');
    });

    it('should not process any additional request', async () => {
        const router = new Router();
        router.use(rateLimit({
            max: 1,
        }));
        router.use(coreHandler(() => 'Hello, World!'));

        const server = supertest(createNodeDispatcher(router));

        let response = await server
            .get('/');

        expect(response.statusCode).toEqual(200);
        expect(response.headers[HeaderName.RATE_LIMIT_LIMIT]).toEqual('1');
        expect(response.headers[HeaderName.RATE_LIMIT_REMAINING]).toEqual('0');

        response = await server
            .get('/');

        expect(response.statusCode).toEqual(429);
        expect(response.text).toEqual(RETRY_AGAIN_MESSAGE);
        expect(response.headers[HeaderName.RETRY_AFTER]).toBeDefined();
    });

    it('should be possible to skip successfully responses', async () => {
        const router = new Router();
        router.use(rateLimit({
            skipSuccessfulRequest: true,
        }));
        router.use(coreHandler(() => 'Hello, World!'));

        const server = supertest(createNodeDispatcher(router));

        let response = await server
            .get('/');

        expect(response.headers[HeaderName.RATE_LIMIT_REMAINING]).toEqual('4');

        response = await server
            .get('/');

        expect(response.headers[HeaderName.RATE_LIMIT_REMAINING]).toEqual('4');
    });

    it('should be possible to skip failed responses', async () => {
        const router = new Router();
        router.use(rateLimit({
            skipFailedRequest: true,
        }));

        const server = supertest(createNodeDispatcher(router));

        let response = await server
            .get('/');

        expect(response.headers[HeaderName.RATE_LIMIT_REMAINING]).toEqual('4');

        response = await server
            .get('/');

        expect(response.headers[HeaderName.RATE_LIMIT_REMAINING]).toEqual('4');
    });

    it('should skip request', async () => {
        const router = new Router();
        router.use(rateLimit({
            skip: () => true,
        }));
        router.use(coreHandler(() => 'Hello, World!'));

        const server = supertest(createNodeDispatcher(router));

        const response = await server
            .get('/');

        expect(response.headers[HeaderName.RATE_LIMIT_LIMIT]).toBeUndefined();
        expect(response.headers[HeaderName.RATE_LIMIT_REMAINING]).toBeUndefined();
        expect(response.headers[HeaderName.RATE_LIMIT_RESET]).toBeUndefined();
        expect(response.headers[HeaderName.RETRY_AFTER]).toBeUndefined();
    });
});
