import { describe, expect, it } from 'vitest';
import { cookie } from '@routup/cookie';
import { App } from 'routup';
import { decorators } from '../../src';
import { CookieController } from '../data/cookie';

function createTestRequest(url: string, options?: RequestInit): Request {
    const fullUrl = url.startsWith('http') ? url : `http://localhost${url}`;
    return new Request(fullUrl, options);
}

describe('data/cookie', () => {
    it('should handle decorator endpoints', async () => {
        const router = new App();

        router.use(cookie());
        router.use(decorators({ controllers: [CookieController] }));

        let response = await router.fetch(createTestRequest('/cookie/many', { headers: { cookie: 'foo=bar' } }));

        expect(response.status).toEqual(200);
        expect(await response.json()).toEqual({ foo: 'bar' });

        response = await router.fetch(createTestRequest('/cookie/single', { headers: { cookie: 'foo=bar' } }));

        expect(response.status).toEqual(200);
        expect(await response.text()).toEqual('bar');
    });
});
