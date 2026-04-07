import { describe, expect, it } from 'vitest';
import { Router } from 'routup';
import path from 'node:path';
import { assets } from '../../src';

function createTestRequest(url: string, options?: RequestInit): Request {
    const fullUrl = url.startsWith('http') ? url : `http://localhost${url}`;
    return new Request(fullUrl, options);
}

const tick = () => new Promise<void>((resolve) => { setTimeout(resolve, 0); });

const directoryPath = path.join(__dirname, '..', 'data');

describe('src/module', () => {
    it('should serve text file', async () => {
        const router = new Router();

        router.use(assets(directoryPath));

        await tick();

        const response = await router.fetch(createTestRequest('/file.txt'));

        expect(await response.text()).toEqual('foo\n');
        expect(response.headers.get('content-type')).toEqual('text/plain; charset=utf-8');
        expect(response.headers.get('content-length')).toEqual('4');
    });

    it('should serve node modules file', async () => {
        const router = new Router();

        router.use('/docs', assets(path.dirname(require.resolve('swagger-ui-dist')), { scan: false }));

        const response = await router.fetch(createTestRequest('/docs/swagger-ui-bundle.js'));

        expect(response.headers.get('content-type')).toEqual('application/javascript; charset=utf-8');
    });

    it('should serve non preloaded text file', async () => {
        const router = new Router();

        router.use(assets(directoryPath, { scan: false }));

        const response = await router.fetch(createTestRequest('/file.txt'));

        expect(await response.text()).toEqual('foo\n');
        expect(response.headers.get('content-type')).toEqual('text/plain; charset=utf-8');
        expect(response.headers.get('content-length')).toEqual('4');
    });

    it('should serve js file', async () => {
        const router = new Router();

        router.use(assets(directoryPath));

        await tick();

        const response = await router.fetch(createTestRequest('/file.js'));

        expect(await response.text()).toEqual('console.log(\'foo\');\n');
        expect(response.headers.get('content-type')).toEqual('application/javascript; charset=utf-8');
        expect(response.headers.get('content-length')).toEqual('20');
    });

    it('should not serve file', async () => {
        const router = new Router();

        router.use(assets(directoryPath));

        await tick();

        const response = await router.fetch(createTestRequest('/file.bar'));

        expect(response.status).toEqual(404);
    });

    it('should serve directory by index file', async () => {
        const router = new Router();

        router.use(assets(directoryPath, { fallback: true }));

        await tick();

        let response = await router.fetch(createTestRequest('/html'));

        expect(await response.text()).toEqual('foo\n');
        expect(response.headers.get('content-type')).toEqual('text/html; charset=utf-8');
        expect(response.headers.get('content-length')).toEqual('4');

        response = await router.fetch(createTestRequest('/html/'));

        expect(await response.text()).toEqual('foo\n');
        expect(response.headers.get('content-type')).toEqual('text/html; charset=utf-8');
        expect(response.headers.get('content-length')).toEqual('4');
    });
});
