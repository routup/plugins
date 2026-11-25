import { describe, expect, it } from 'vitest';
import { App, defineErrorHandler } from 'routup';
import { decorators } from '../../src';
import { StreamController } from '../data/stream';

function createTestRequest(url: string, options?: RequestInit): Request {
    return new Request(`http://localhost${url}`, options);
}

function createApp(controller: StreamController = new StreamController()) {
    const router = new App();

    router.use(decorators({ controllers: [controller] }));

    return router;
}

describe('data/stream', () => {
    it('should stream a generator with @DStatus and @DProduces', async () => {
        const response = await createApp().fetch(createTestRequest('/stream/lines', { method: 'POST' }));

        expect(response.status).toEqual(201);
        expect(response.headers.get('content-type')).toEqual('text/csv');
        expect(await response.text()).toEqual('a,b\nc,d\n');
    });

    it('should stream an async generator with @DProduces', async () => {
        const response = await createApp().fetch(createTestRequest('/stream/events'));

        expect(response.status).toEqual(200);
        expect(response.headers.get('content-type')).toEqual('text/event-stream');
        expect(await response.text()).toEqual('data: 1\n\ndata: 2\n\n');
    });

    it('should let the generator change the status and media type before its first value', async () => {
        const response = await createApp().fetch(createTestRequest('/stream/own', { method: 'POST' }));

        expect(response.status).toEqual(202);
        expect(response.headers.get('content-type')).toEqual('text/plain');
        expect(await response.text()).toEqual('a');
    });

    it('should close the generator when the body is cancelled', async () => {
        const controller = new StreamController();
        const response = await createApp(controller).fetch(createTestRequest('/stream/endless'));

        const reader = response.body!.getReader();
        const { value } = await reader.read();

        expect(new TextDecoder().decode(value)).toEqual('0\n');
        expect(controller.closed).toBe(false);

        await reader.cancel();

        expect(controller.closed).toBe(true);
    });

    it('should hand an error before the first chunk on without the status or media type', async () => {
        const router = createApp();

        router.use(defineErrorHandler((error, event) => ({
            message: error.message,
            status: event.response.status,
            contentType: event.response.headers.get('content-type'),
        })));

        const response = await router.fetch(createTestRequest('/stream/error', { method: 'POST' }));

        expect(response.status).toEqual(200);
        expect(response.headers.get('content-type')).toMatch(/^application\/json/);
        expect(await response.json()).toEqual({
            message: 'Before the first chunk',
            status: 200,
            contentType: null,
        });
    });

    it('should answer an error before the first chunk with its own status', async () => {
        const response = await createApp().fetch(createTestRequest('/stream/error', { method: 'POST' }));

        expect(response.status).toEqual(500);
        expect(response.headers.get('content-type')).toMatch(/^application\/json/);
    });
});
