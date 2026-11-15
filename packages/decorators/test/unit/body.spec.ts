import { describe, expect, it } from 'vitest';
import { body, setRequestBody } from '@routup/body';
import { App, defineCoreHandler } from 'routup';
import { decorators } from '../../src';
import { PostController } from '../data/post';

function createTestRequest(url: string, options?: RequestInit): Request {
    const fullUrl = url.startsWith('http') ? url : `http://localhost${url}`;

    return new Request(fullUrl, options);
}

describe('data/body', () => {
    it('should handle decorator endpoints', async () => {
        const router = new App();

        router.use(body());
        router.use(decorators({ controllers: [PostController] }));

        let response = await router.fetch(createTestRequest('/post/many', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ foo: 'bar' }),
        }));

        expect(response.status).toEqual(200);
        expect(await response.json()).toEqual({ foo: 'bar' });

        response = await router.fetch(createTestRequest('/post/single', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ foo: 'bar' }),
        }));

        expect(response.status).toEqual(200);
        expect(await response.text()).toEqual('bar');
    });

    it('should use a body provided with setRequestBody', async () => {
        const router = new App();

        router.use(body());
        router.use(defineCoreHandler((event) => {
            setRequestBody(event, { foo: 'baz' });

            return event.next();
        }));
        router.use(decorators({ controllers: [PostController] }));

        const response = await router.fetch(createTestRequest('/post/many', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ foo: 'bar' }),
        }));

        expect(response.status).toEqual(200);
        expect(await response.json()).toEqual({ foo: 'baz' });
    });

    it('should resolve a keyed @DBody on a null body to undefined', async () => {
        const router = new App();

        router.use(body());
        router.use(defineCoreHandler((event) => {
            setRequestBody(event, null);

            return event.next();
        }));
        router.use(decorators({ controllers: [PostController] }));

        const response = await router.fetch(createTestRequest('/post/optional', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: 'null',
        }));

        expect(response.status).toEqual(200);
        expect(await response.json()).toEqual({ isUndefined: true });
    });
});
