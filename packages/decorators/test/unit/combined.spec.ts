import { describe, expect, it } from 'vitest';
import { readRequestBody } from '@routup/body';
import { useRequestCookie, useRequestCookies } from '@routup/cookie';
import { useRequestQuery } from '@routup/query';
import { Router } from 'routup';
import { decorators } from '../../src';
import { CombinedController } from '../data/combined';

function createTestRequest(url: string, options?: RequestInit): Request {
    const fullUrl = url.startsWith('http') ? url : `http://localhost${url}`;
    return new Request(fullUrl, options);
}

describe('data/combined', () => {
    it('should handle decorator endpoints', async () => {
        const router = new Router();

        router.use(decorators({
            controllers: [CombinedController],
            parameter: {
                body: async (context, name) => {
                    if (name) {
                        return readRequestBody(context.event, name);
                    }

                    return readRequestBody(context.event);
                },
                cookie: (context, name) => {
                    if (name) {
                        return useRequestCookie(context.event, name);
                    }

                    return useRequestCookies(context.event);
                },
                query: (context, name) => {
                    if (name) {
                        return useRequestQuery(context.event, name);
                    }

                    return useRequestQuery(context.event);
                },
            },
        }));

        let response = await router.fetch(createTestRequest('/combined'));

        expect(response.status).toEqual(200);
        expect(await response.text()).toEqual('many');

        response = await router.fetch(createTestRequest('/combined/admin'));

        expect(response.status).toEqual(200);
        expect(await response.text()).toEqual('admin');

        response = await router.fetch(createTestRequest('/combined', { method: 'POST' }));

        expect(response.status).toEqual(200);
        expect(await response.text()).toEqual('create');

        response = await router.fetch(createTestRequest('/combined/admin', { method: 'DELETE' }));

        expect(response.status).toEqual(200);
        expect(await response.json()).toEqual({ id: 'admin' });

        response = await router.fetch(createTestRequest('/combined', { method: 'PUT' }));

        expect(response.status).toEqual(200);
        expect(await response.text()).toEqual('put');

        response = await router.fetch(createTestRequest('/combined', { method: 'PATCH' }));

        expect(response.status).toEqual(200);
        expect(await response.text()).toEqual('patch');
    });

    it('should not handle decorator endpoints', async () => {
        const router = new Router();
        router.use(decorators({ controllers: [CombinedController] }));

        const response = await router.fetch(createTestRequest('/combined/a', { method: 'DELETE' }));

        expect(response.status).toEqual(500);
    });
});
