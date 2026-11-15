import { describe, expect, it } from 'vitest';
import { body } from '@routup/body';
import { App } from 'routup';
import { decorators } from '../../src';
import { StatusController } from '../data/status';

function createTestRequest(url: string, options?: RequestInit): Request {
    const fullUrl = url.startsWith('http') ? url : `http://localhost${url}`;

    return new Request(fullUrl, options);
}

function createApp() {
    const router = new App();

    router.use(body());
    router.use(decorators({ controllers: [StatusController] }));

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

        expect(response.status).toEqual(200);
        expect(await response.text()).toEqual('override');
    });

    it('should keep the status of a returned Response', async () => {
        const response = await createApp().fetch(createTestRequest('/status/raw'));

        expect(response.status).toEqual(203);
        expect(await response.text()).toEqual('raw');
    });
});
