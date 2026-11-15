import { describe, expect, it } from 'vitest';
import { body } from '@routup/body';
import type { Handler } from 'routup';
import {
    App,
    createError,
    defineCoreHandler,
    defineErrorHandler,
} from 'routup';
import { decorators } from '../../src';
import { StatusController } from '../data/status';

function createTestRequest(url: string, options?: RequestInit): Request {
    const fullUrl = url.startsWith('http') ? url : `http://localhost${url}`;

    return new Request(fullUrl, options);
}

function createApp(...handlers: Handler[]) {
    const router = new App();

    router.use(body());
    router.use(decorators({ controllers: [StatusController] }));

    for (const handler of handlers) {
        router.use(handler);
    }

    return router;
}


function createAppWithErrorHandler() {
    const router = createApp();

    router.use(defineErrorHandler((error) => ({ message: error.message })));

    return router;
}

describe('data/status', () => {
    it('should answer with the declared status for a returned value', async () => {
        const response = await createApp().fetch(createTestRequest('/status/accepted', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ foo: 'bar' }),
        }));

        expect(response.status).toEqual(202);
        expect(await response.json()).toEqual({ foo: 'bar' });
    });

    it('should apply the status regardless of decorator order', async () => {
        const response = await createApp().fetch(createTestRequest('/status/created'));

        expect(response.status).toEqual(201);
        expect(await response.text()).toEqual('created');
    });

    it('should let a status set by the method win', async () => {
        const response = await createApp().fetch(createTestRequest('/status/override'));

        expect(response.status).toEqual(202);
        expect(await response.text()).toEqual('override');
    });

    it('should keep the status of a returned Response', async () => {
        const response = await createApp().fetch(createTestRequest('/status/raw'));

        expect(response.status).toEqual(203);
        expect(await response.text()).toEqual('raw');
    });

    it('should not apply the status to a custom error response', async () => {
        const response = await createAppWithErrorHandler().fetch(createTestRequest('/status/error'));

        expect(response.status).toEqual(200);
        expect(await response.json()).toEqual({ message: 'Not found' });
    });

    it('should answer with the declared status for a returned null', async () => {
        const response = await createApp().fetch(createTestRequest('/status/empty'));

        expect(response.status).toEqual(204);
    });

    for (const url of ['/status/next', '/status/next-returned']) {
        it(`should not hand the status or media type to a later handler (${url})`, async () => {
            const response = await createApp(defineCoreHandler(() => 'downstream'))
                .fetch(createTestRequest(url));

            expect(response.status).toEqual(200);
            expect(response.headers.get('content-type')).toMatch(/^text\/plain/);
            expect(await response.text()).toEqual('downstream');
        });

        it(`should not hand the status or media type to an error of a later handler (${url})`, async () => {
            const router = createApp(
                defineCoreHandler(() => {
                    throw createError({ status: 409, message: 'Downstream' });
                }),
                defineErrorHandler((error) => ({ message: error.message })),
            );

            const response = await router.fetch(createTestRequest(url));

            expect(response.status).toEqual(200);
            expect(response.headers.get('content-type')).toMatch(/^application\/json/);
            expect(await response.json()).toEqual({ message: 'Downstream' });
        });
    }
});
