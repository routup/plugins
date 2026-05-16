import { describe, expect, it } from 'vitest';
import {
    App,
    defineCoreHandler,
} from 'routup';
import { basic } from '../../src';
import { readRequestBody } from '@routup/body';
import { useRequestCookie, useRequestCookies } from '@routup/cookie';
import { useRequestQuery } from '@routup/query';

function createTestRequest(url: string, options?: RequestInit): Request {
    const fullUrl = url.startsWith('http') ? url : `http://localhost${url}`;
    return new Request(fullUrl, options);
}

describe('src/**', () => {
    it('should use body plugin', async () => {
        const router = new App();

        router.use(basic({ body: true }));

        router.post('/:id', defineCoreHandler(async (event) => {
            const body = await readRequestBody(event, event.params.id!);
            return body;
        }));
        router.post('/', defineCoreHandler(async (event) => await readRequestBody(event)));

        let response = await router.fetch(createTestRequest('/foo', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ foo: 'bar' }),
        }));

        expect(response.status).toEqual(200);
        expect(await response.text()).toEqual('bar');

        response = await router.fetch(createTestRequest('/', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ foo: 'bar' }),
        }));

        expect(response.status).toEqual(200);
        expect(await response.json()).toEqual({ foo: 'bar' });
    });

    it('should use cookie plugin', async () => {
        const router = new App();

        router.use(basic({ cookie: true }));

        router.get('/:id', defineCoreHandler((event) => useRequestCookie(event, event.params.id!)));
        router.get('/', defineCoreHandler((event) => useRequestCookies(event)));

        let response = await router.fetch(createTestRequest('/foo', { headers: { 'cookie': 'foo=bar' } }));

        expect(response.status).toEqual(200);
        expect(await response.text()).toEqual('bar');

        response = await router.fetch(createTestRequest('/', { headers: { 'cookie': 'foo=bar' } }));

        expect(response.status).toEqual(200);
        expect(await response.json()).toEqual({ foo: 'bar' });
    });

    it('should use query plugin', async () => {
        const router = new App();

        router.use(basic({ query: true }));

        router.get('/:id', defineCoreHandler((event) => useRequestQuery(event, event.params.id!)));
        router.get('/', defineCoreHandler((event) => useRequestQuery(event)));

        let response = await router.fetch(createTestRequest('/sort?page[limit]=10&sort=-name'));

        expect(response.status).toEqual(200);
        expect(await response.text()).toEqual('-name');

        response = await router.fetch(createTestRequest('/?page[limit]=10&sort=-name'));

        expect(response.status).toEqual(200);
        expect(await response.json()).toEqual({
            page: { limit: '10' },
            sort: '-name',
        });
    });
});
