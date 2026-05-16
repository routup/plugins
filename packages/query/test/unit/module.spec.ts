import { describe, expect, it } from 'vitest';
import {
    App,
    defineCoreHandler,
} from 'routup';
import { stringify } from 'qs';
import { query, useRequestQuery } from '../../src';

function createTestRequest(url: string, options?: RequestInit): Request {
    const fullUrl = url.startsWith('http') ? url : `http://localhost${url}`;
    return new Request(fullUrl, options);
}

describe('src/module', () => {
    it('should parse request query', async () => {
        const router = new App();

        router.use(query());

        router.get('/', defineCoreHandler((event) => useRequestQuery(event)));

        router.get('/key', defineCoreHandler((event) => {
            useRequestQuery(event, 'sort');

            return useRequestQuery(event, 'sort');
        }));

        router.get('/reuse', defineCoreHandler((event) => {
            useRequestQuery(event);

            return useRequestQuery(event);
        }));

        const qs = { page: { limit: '10', offset: '0' }, sort: '-name' };

        let response = await router.fetch(createTestRequest(`/?${stringify(qs)}`));

        expect(response.status).toEqual(200);
        expect(await response.json()).toEqual(qs);

        response = await router.fetch(createTestRequest('/'));

        expect(response.status).toEqual(200);
        expect(await response.json()).toEqual({});

        response = await router.fetch(createTestRequest(`/key?${stringify(qs)}`));

        expect(response.status).toEqual(200);
        expect(await response.text()).toEqual('-name');

        response = await router.fetch(createTestRequest(`/reuse?${stringify(qs)}`));

        expect(response.status).toEqual(200);
        expect(await response.json()).toEqual(qs);
    });

    it('should strip url fragment from query string', async () => {
        const router = new App();

        router.use(query());

        router.get('/', defineCoreHandler((event) => useRequestQuery(event)));

        const response = await router.fetch(createTestRequest('/?foo=bar&baz=qux#section'));

        expect(response.status).toEqual(200);
        expect(await response.json()).toEqual({ foo: 'bar', baz: 'qux' });
    });

    it('should parse request query with middleware', async () => {
        const router = new App();

        router.use(query());

        router.get('/', defineCoreHandler((event) => useRequestQuery(event)));

        const qs = { page: { limit: '10', offset: '0' }, sort: '-name' };

        const response = await router.fetch(createTestRequest(`/?${stringify(qs)}`));

        expect(response.status).toEqual(200);
        expect(await response.json()).toEqual(qs);
    });
});
