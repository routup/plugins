import { describe, expect, it } from 'vitest';
import { App, defineErrorHandler } from 'routup';
import { decorators } from '../../src';
import { ProducesController } from '../data/produces';
import { ProducesClassController } from '../data/produces-class';

function createTestRequest(url: string, options?: RequestInit): Request {
    const fullUrl = url.startsWith('http') ? url : `http://localhost${url}`;

    return new Request(fullUrl, options);
}

function createApp() {
    const router = new App();

    router.use(decorators({ controllers: [ProducesController, ProducesClassController] }));

    return router;
}


function createAppWithErrorHandler() {
    const router = createApp();

    router.use(defineErrorHandler((error) => ({ message: error.message })));

    return router;
}

describe('data/produces', () => {
    it('should set the first media type as content-type', async () => {
        const response = await createApp().fetch(createTestRequest('/produces/csv'));

        expect(response.status).toEqual(200);
        expect(response.headers.get('content-type')).toEqual('text/csv');
        expect(await response.text()).toEqual('a,b');
    });

    it('should let a content-type set by the method win', async () => {
        const response = await createApp().fetch(createTestRequest('/produces/own'));

        expect(response.headers.get('content-type')).toEqual('text/plain');
    });

    it('should set the content-type for a returned binary value', async () => {
        const response = await createApp().fetch(createTestRequest('/produces/download'));

        expect(response.headers.get('content-type')).toEqual('application/octet-stream');
        expect(new Uint8Array(await response.arrayBuffer())).toEqual(new Uint8Array([1, 2, 3]));
    });

    it('should not touch the headers of a returned Response', async () => {
        const response = await createApp().fetch(createTestRequest('/produces/raw'));

        expect(response.headers.get('x-raw')).toEqual('true');
        expect(response.headers.get('content-type')).toBeNull();
    });

    it('should combine with @DStatus', async () => {
        const response = await createApp().fetch(createTestRequest('/produces/status-last', { method: 'POST' }));

        expect(response.status).toEqual(201);
        expect(response.headers.get('content-type')).toEqual('image/png');
    });

    it('should fall back to a class-level media type', async () => {
        const response = await createApp().fetch(createTestRequest('/produces-class'));

        expect(response.headers.get('content-type')).toEqual('text/html');
    });

    it('should prefer the method-level over the class-level media type', async () => {
        const response = await createApp().fetch(createTestRequest('/produces-class/method'));

        expect(response.headers.get('content-type')).toEqual('text/plain');
    });

    it('should not apply the content-type to a custom error response', async () => {
        const response = await createAppWithErrorHandler().fetch(createTestRequest('/produces/error'));

        expect(response.headers.get('content-type')).toMatch(/^application\/json/);
        expect(await response.json()).toEqual({ message: 'Not found' });
    });
});
