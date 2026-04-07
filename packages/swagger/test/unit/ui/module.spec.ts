import { describe, expect, it } from 'vitest';
import { Router } from 'routup';
import type { UIOptions } from '../../../src';
import { swaggerUI } from '../../../src';

function createTestRequest(url: string, options?: RequestInit): Request {
    const fullUrl = url.startsWith('http') ? url : `http://localhost${url}`;
    return new Request(fullUrl, options);
}

const createRouter = async (options?: UIOptions) => {
    const router = new Router();

    router.use('/docs', swaggerUI('test/data/swagger.json', options));

    return router;
};

describe('src/ui', () => {
    it('should serve template file', async () => {
        const router = await createRouter();

        let response = await router.fetch(createTestRequest('/docs'));

        expect(response.status).toEqual(200);
        expect(response.headers.get('content-type')).toEqual('text/html; charset=utf-8');
        expect((await response.text()).includes('<base href="/docs/" />')).toBeTruthy();

        response = await router.fetch(createTestRequest('/docs/'));

        expect(response.status).toEqual(200);
        expect(response.headers.get('content-type')).toEqual('text/html; charset=utf-8');
        expect((await response.text()).includes('<base href="/docs/" />')).toBeTruthy();

        response = await router.fetch(createTestRequest('/docs/foo'));

        expect(response.status).toEqual(200);
        expect(response.headers.get('content-type')).toEqual('text/html; charset=utf-8');
        expect((await response.text()).includes('<base href="/docs/" />')).toBeTruthy();
    });

    it('should serve template file for nested routers', async () => {
        const router = new Router();
        const child = await createRouter();
        router.use('/sub', child);

        let response = await router.fetch(createTestRequest('/sub/docs'));

        expect(response.status).toEqual(200);
        expect(response.headers.get('content-type')).toEqual('text/html; charset=utf-8');
        expect((await response.text()).includes('<base href="/sub/docs/" />')).toBeTruthy();

        response = await router.fetch(createTestRequest('/sub/docs/'));

        expect(response.status).toEqual(200);
        expect(response.headers.get('content-type')).toEqual('text/html; charset=utf-8');
        expect((await response.text()).includes('<base href="/sub/docs/" />')).toBeTruthy();
    });

    it('should serve swagger ui files on custom base path', async () => {
        const router = await createRouter({ basePath: '/api/' });

        const response = await router.fetch(createTestRequest('/docs'));

        expect(response.status).toEqual(200);
        expect(response.headers.get('content-type')).toEqual('text/html; charset=utf-8');
        expect((await response.text()).includes('<base href="/api/docs/" />')).toBeTruthy();
    });

    it('should serve swagger ui files on custom base url', async () => {
        const router = await createRouter({ baseURL: 'https://example.com/api/' });

        const response = await router.fetch(createTestRequest('/docs'));

        expect(response.status).toEqual(200);
        expect(response.headers.get('content-type')).toEqual('text/html; charset=utf-8');
        expect((await response.text()).includes('<base href="https://example.com/api/docs/" />')).toBeTruthy();
    });

    it('should serve swagger ui asset files', async () => {
        const router = await createRouter();

        const response = await router.fetch(createTestRequest('/docs/swagger-ui-bundle.js'));
        expect(response.status).toEqual(200);
        expect(response.headers.get('content-type')).toEqual('application/javascript; charset=utf-8');
    });

    it('should not serve package.json', async () => {
        const router = await createRouter();

        const response = await router.fetch(createTestRequest('/docs/package.json'));

        expect(response.status).toEqual(404);
    });
});
