import { describe, expect, it } from 'vitest';
import {
    App,
    HeaderName,
    createError,
    defineCoreHandler,
    defineErrorHandler,
} from 'routup';
import { RETRY_AGAIN_MESSAGE, rateLimit } from '../../src';

function createTestRequest(url: string, options?: RequestInit): Request {
    const fullUrl = url.startsWith('http') ? url : `http://localhost${url}`;
    return new Request(fullUrl, options);
}

describe('src/module', () => {
    it('should set rate limit headers', async () => {
        const router = new App();
        router.use(rateLimit());
        router.use(defineCoreHandler(() => 'Hello, World!'));

        let response = await router.fetch(createTestRequest('/'));

        expect(response.status).toEqual(200);
        expect(response.headers.get(HeaderName.RATE_LIMIT_LIMIT)).toEqual('5');
        expect(response.headers.get(HeaderName.RATE_LIMIT_REMAINING)).toEqual('4');
        expect(response.headers.get(HeaderName.RATE_LIMIT_RESET)).toBeDefined();
        expect(response.headers.get(HeaderName.RETRY_AFTER)).toBeNull();

        response = await router.fetch(createTestRequest('/'));

        expect(response.status).toEqual(200);
        expect(response.headers.get(HeaderName.RATE_LIMIT_LIMIT)).toEqual('5');
        expect(response.headers.get(HeaderName.RATE_LIMIT_REMAINING)).toEqual('3');
    });

    it('should not process any additional request', async () => {
        const router = new App();
        router.use(rateLimit({ max: 1 }));
        router.use(defineCoreHandler(() => 'Hello, World!'));

        let response = await router.fetch(createTestRequest('/'));

        expect(response.status).toEqual(200);
        expect(response.headers.get(HeaderName.RATE_LIMIT_LIMIT)).toEqual('1');
        expect(response.headers.get(HeaderName.RATE_LIMIT_REMAINING)).toEqual('0');

        response = await router.fetch(createTestRequest('/'));

        expect(response.status).toEqual(429);
        expect(await response.text()).toEqual(RETRY_AGAIN_MESSAGE);
        expect(response.headers.get(HeaderName.RETRY_AFTER)).toBeDefined();
    });

    it('should be possible to skip successfully responses', async () => {
        const router = new App();
        router.use(rateLimit({ skipSuccessfulRequest: true }));
        router.use(defineCoreHandler(() => 'Hello, World!'));

        let response = await router.fetch(createTestRequest('/'));

        expect(response.headers.get(HeaderName.RATE_LIMIT_REMAINING)).toEqual('5');

        response = await router.fetch(createTestRequest('/'));

        expect(response.headers.get(HeaderName.RATE_LIMIT_REMAINING)).toEqual('5');
    });

    it('should be possible to skip failed responses', async () => {
        const router = new App();
        router.use(rateLimit({ skipFailedRequest: true }));

        let response = await router.fetch(createTestRequest('/'));

        expect(response.headers.get(HeaderName.RATE_LIMIT_REMAINING)).toEqual('5');

        response = await router.fetch(createTestRequest('/'));

        expect(response.headers.get(HeaderName.RATE_LIMIT_REMAINING)).toEqual('5');
    });

    it('should skip request', async () => {
        const router = new App();
        router.use(rateLimit({ skip: () => true }));
        router.use(defineCoreHandler(() => 'Hello, World!'));

        const response = await router.fetch(createTestRequest('/'));

        expect(response.headers.get(HeaderName.RATE_LIMIT_LIMIT)).toBeNull();
        expect(response.headers.get(HeaderName.RATE_LIMIT_REMAINING)).toBeNull();
        expect(response.headers.get(HeaderName.RATE_LIMIT_RESET)).toBeNull();
        expect(response.headers.get(HeaderName.RETRY_AFTER)).toBeNull();
    });

    it('should judge a thrown error by the response of the error handler', async () => {
        const router = new App();
        router.use(rateLimit({
            max: 1,
            skipSuccessfulRequest: true,
            requestWasSuccessful: (_event, response) => response.status !== 401,
        }));
        router.use(defineCoreHandler(() => {
            throw createError({ status: 500 });
        }));
        router.use(defineErrorHandler((error, event) => {
            event.response.status = error.status;
            return error.message;
        }));

        let response = await router.fetch(createTestRequest('/'));
        expect(response.status).toEqual(500);
        expect(response.headers.get(HeaderName.RATE_LIMIT_REMAINING)).toEqual('1');

        response = await router.fetch(createTestRequest('/'));
        expect(response.status).toEqual(500);
    });

    it('should count a thrown error no error handler answered', async () => {
        const router = new App();
        router.use(rateLimit({
            max: 1,
            skipSuccessfulRequest: true,
            requestWasSuccessful: (_event, response) => response.status !== 401,
        }));
        router.use(defineCoreHandler(() => {
            throw createError({ status: 500 });
        }));

        let response = await router.fetch(createTestRequest('/'));
        expect(response.status).toEqual(500);

        response = await router.fetch(createTestRequest('/'));
        expect(response.status).toEqual(429);
    });

    it('should count a thrown error the predicate rejects', async () => {
        const router = new App();
        router.use(rateLimit({
            max: 1,
            skipSuccessfulRequest: true,
            requestWasSuccessful: (_event, response) => response.status !== 401,
        }));
        router.use(defineCoreHandler(() => {
            throw createError({ status: 401 });
        }));
        router.use(defineErrorHandler((error, event) => {
            event.response.status = error.status;
            return error.message;
        }));

        let response = await router.fetch(createTestRequest('/'));
        expect(response.status).toEqual(401);
        expect(response.headers.get(HeaderName.RATE_LIMIT_REMAINING)).toEqual('0');

        response = await router.fetch(createTestRequest('/'));
        expect(response.status).toEqual(429);
    });

    it('should refresh the remaining header on a response with immutable headers', async () => {
        const router = new App();
        router.use(rateLimit({ skipSuccessfulRequest: true }));
        router.use(defineCoreHandler(() => Response.redirect('http://localhost/target', 302)));

        const response = await router.fetch(createTestRequest('/'));

        expect(response.status).toEqual(302);
        expect(response.headers.get('location')).toEqual('http://localhost/target');
        expect(response.headers.get(HeaderName.RATE_LIMIT_REMAINING)).toEqual('5');
    });

    it('should bound concurrent failed requests by max', async () => {
        const router = new App();
        let reached = 0;
        router.use(rateLimit({ max: 2, skipSuccessfulRequest: true }));
        router.use(defineCoreHandler(async () => {
            reached++;
            await new Promise((resolve) => { setTimeout(resolve, 10); });
            throw createError({ status: 401 });
        }));

        const responses = await Promise.all(
            Array.from({ length: 10 }, () => router.fetch(createTestRequest('/'))),
        );

        expect(reached).toEqual(2);
        expect(responses.filter((r) => r.status === 429)).toHaveLength(8);
    });
});
