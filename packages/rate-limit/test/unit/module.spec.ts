import { describe, expect, it } from 'vitest';
import {
    App,
    HeaderName,
    defineCoreHandler,
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

        expect(response.headers.get(HeaderName.RATE_LIMIT_REMAINING)).toEqual('4');

        response = await router.fetch(createTestRequest('/'));

        expect(response.headers.get(HeaderName.RATE_LIMIT_REMAINING)).toEqual('4');
    });

    it('should be possible to skip failed responses', async () => {
        const router = new App();
        router.use(rateLimit({ skipFailedRequest: true }));

        let response = await router.fetch(createTestRequest('/'));

        expect(response.headers.get(HeaderName.RATE_LIMIT_REMAINING)).toEqual('4');

        response = await router.fetch(createTestRequest('/'));

        expect(response.headers.get(HeaderName.RATE_LIMIT_REMAINING)).toEqual('4');
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
});
