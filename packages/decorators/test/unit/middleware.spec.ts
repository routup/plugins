import { describe, expect, it } from 'vitest';
import { App } from 'routup';
import { decorators } from '../../src';
import { MiddlewareController } from '../data/middleware';

function createTestRequest(url: string, options?: RequestInit): Request {
    const fullUrl = url.startsWith('http') ? url : `http://localhost${url}`;
    return new Request(fullUrl, options);
}

describe('header.ts', () => {
    it('should handle extra decorators', async () => {
        const router = new App();

        const controller = new MiddlewareController();

        router.use(decorators({ controllers: [controller] }));

        const response = await router.fetch(createTestRequest('/middleware'));

        expect(response.status).toEqual(200);
        expect(await response.text()).toEqual('value');
    });
});
