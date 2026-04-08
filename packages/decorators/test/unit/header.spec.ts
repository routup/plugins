import { describe, expect, it } from 'vitest';
import { Router } from 'routup';
import { decorators } from '../../src';
import { HeaderController } from '../data/header';

function createTestRequest(url: string, options?: RequestInit): Request {
    const fullUrl = url.startsWith('http') ? url : `http://localhost${url}`;
    return new Request(fullUrl, options);
}

describe('header.ts', () => {
    it('should handle extra decorators', async () => {
        const router = new Router();

        const controller = new HeaderController();

        router.use(decorators({ controllers: [controller] }));

        let response = await router.fetch(createTestRequest('/header/many'));

        expect(response.status).toEqual(200);
        const body = await response.json();
        expect(body).toBeDefined();

        response = await router.fetch(createTestRequest('/header/single', { headers: { connection: 'keep-alive' } }));

        expect(response.status).toEqual(200);
        expect(await response.text()).toEqual('keep-alive');
    });
});
