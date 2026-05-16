import { describe, expect, it } from 'vitest';
import { body } from '@routup/body';
import { App } from 'routup';
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
});
