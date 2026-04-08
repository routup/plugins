import { describe, expect, it } from 'vitest';
import { cookie, useRequestCookie, useRequestCookies } from '@routup/cookie';
import { Router } from 'routup';
import { decorators } from '../../src';
import { CookieController } from '../data/cookie';

function createTestRequest(url: string, options?: RequestInit): Request {
    const fullUrl = url.startsWith('http') ? url : `http://localhost${url}`;
    return new Request(fullUrl, options);
}

describe('data/cookie', () => {
    it('should handle decorator endpoints', async () => {
        const router = new Router();

        router.use(cookie());
        router.use(decorators({
            controllers: [CookieController],
            parameter: {
                cookie: (context, name) => {
                    if (name) {
                        return useRequestCookie(context.event, name);
                    }

                    return useRequestCookies(context.event);
                },
            },
        }));

        let response = await router.fetch(createTestRequest('/cookie/many', { headers: { cookie: 'foo=bar' } }));

        expect(response.status).toEqual(200);
        expect(await response.json()).toEqual({ foo: 'bar' });

        response = await router.fetch(createTestRequest('/cookie/single', { headers: { cookie: 'foo=bar' } }));

        expect(response.status).toEqual(200);
        expect(await response.text()).toEqual('bar');
    });
});
