import { describe, expect, it } from 'vitest';
import {
    Router,
    defineCoreHandler,
} from 'routup';
import {
    body,
    readRequestBody,
    readRequestBodyBytes,
    readRequestBodyText,
} from '../../src';

function createTestRequest(url: string, options?: RequestInit): Request {
    const fullUrl = url.startsWith('http') ? url : `http://localhost${url}`;
    return new Request(fullUrl, options);
}

describe('src/**', () => {
    it('should handle application/json', async () => {
        const router = new Router();

        router.use(body({ json: true }));

        router.post('/', defineCoreHandler(async (event) => await readRequestBody(event)));

        const response = await router.fetch(createTestRequest('/', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ foo: 'bar' }),
        }));

        expect(response.status).toEqual(200);
        expect(await response.json()).toEqual({ foo: 'bar' });
    });

    it('should handle application/x-www-form-urlencoded', async () => {
        const router = new Router();

        router.use(body({ urlEncoded: true }));

        router.post('/', defineCoreHandler(async (event) => await readRequestBody(event)));

        const response = await router.fetch(createTestRequest('/', {
            method: 'POST',
            headers: { 'content-type': 'application/x-www-form-urlencoded' },
            body: 'foo=bar',
        }));

        expect(response.status).toEqual(200);
        expect(await response.json()).toEqual({ foo: 'bar' });
    });

    it('should handle raw to bytes', async () => {
        const router = new Router();

        router.use(body({ raw: true }));

        router.post('/', defineCoreHandler(async (event) => {
            const bytes = await readRequestBodyBytes(event);
            return bytes instanceof Uint8Array;
        }));

        const response = await router.fetch(createTestRequest('/', {
            method: 'POST',
            headers: { 'content-type': 'application/octet-stream' },
            body: 'foo',
        }));

        expect(response.status).toEqual(200);
        expect(await response.json()).toEqual(true);
    });

    it('should handle text/html to text', async () => {
        const router = new Router();

        router.use(body({ text: { type: 'text/html' } }));

        router.post('/', defineCoreHandler(async (event) => await readRequestBodyText(event)));

        const response = await router.fetch(createTestRequest('/', {
            method: 'POST',
            headers: { 'content-type': 'text/html' },
            body: '<div>foo</div>',
        }));

        expect(response.status).toEqual(200);
        expect(await response.text()).toEqual('<div>foo</div>');
    });

    it('should parse application/json & application/x-www-form-urlencoded', async () => {
        const router = new Router();

        router.use(body({
            json: true,
            urlEncoded: true,
        }));

        router.post('/multiple', defineCoreHandler(async (event) => await readRequestBody(event)));

        let response = await router.fetch(createTestRequest('/multiple', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ foo: 'bar' }),
        }));

        expect(response.status).toEqual(200);
        expect(await response.json()).toEqual({ foo: 'bar' });

        response = await router.fetch(createTestRequest('/multiple', {
            method: 'POST',
            headers: { 'content-type': 'application/x-www-form-urlencoded' },
            body: 'foo=bar',
        }));

        expect(response.status).toEqual(200);
        expect(await response.json()).toEqual({ foo: 'bar' });
    });

    it('should use default options (json + urlEncoded)', async () => {
        const router = new Router();

        router.use(body());

        router.post('/', defineCoreHandler(async (event) => await readRequestBody(event)));

        const response = await router.fetch(createTestRequest('/', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ baz: 'qux' }),
        }));

        expect(response.status).toEqual(200);
        expect(await response.json()).toEqual({ baz: 'qux' });
    });

    it('should work without plugin (accessor-only)', async () => {
        const router = new Router();

        router.post('/', defineCoreHandler(async (event) => await readRequestBody(event)));

        const response = await router.fetch(createTestRequest('/', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ foo: 'bar' }),
        }));

        expect(response.status).toEqual(200);
        // Without plugin, no options are set, so readRequestBody returns {}
        expect(await response.json()).toEqual({});
    });

    it('should cache parsed body', async () => {
        const router = new Router();

        router.use(body({ json: true }));

        router.post('/', defineCoreHandler(async (event) => {
            const first = await readRequestBody(event);
            const second = await readRequestBody(event);
            return { same: first === second, body: first };
        }));

        const response = await router.fetch(createTestRequest('/', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ foo: 'bar' }),
        }));

        expect(response.status).toEqual(200);
        expect(await response.json()).toEqual({ same: true, body: { foo: 'bar' } });
    });
});
