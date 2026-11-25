import { describe, expect, it } from 'vitest';
import { App, defineCoreHandler } from 'routup';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { assets } from '../../src';
import { lookup } from '../../src/utils/lookup';
import { buildOptions } from '../../src/utils/options';

function createTestRequest(url: string, options?: RequestInit): Request {
    const fullUrl = url.startsWith('http') ? url : `http://localhost${url}`;

    return new Request(fullUrl, options);
}

const directoryPath = path.join(__dirname, '..', 'data');

describe('src/module', () => {
    it('should serve text file', async () => {
        const router = new App();

        router.use(assets(directoryPath));

        const response = await router.fetch(createTestRequest('/file.txt'));

        expect(await response.text()).toEqual('foo\n');
        expect(response.headers.get('content-type')).toEqual('text/plain; charset=utf-8');
        expect(response.headers.get('content-length')).toEqual('4');
    });

    it('should serve node modules file', async () => {
        const router = new App();

        router.use('/docs', assets(path.dirname(require.resolve('swagger-ui-dist')), { scan: false }));

        const response = await router.fetch(createTestRequest('/docs/swagger-ui-bundle.js'));

        expect(response.headers.get('content-type')).toEqual('text/javascript; charset=utf-8');
    });

    it('should serve non preloaded text file', async () => {
        const router = new App();

        router.use(assets(directoryPath, { scan: false }));

        const response = await router.fetch(createTestRequest('/file.txt'));

        expect(await response.text()).toEqual('foo\n');
        expect(response.headers.get('content-type')).toEqual('text/plain; charset=utf-8');
        expect(response.headers.get('content-length')).toEqual('4');
    });

    it('should serve js file', async () => {
        const router = new App();

        router.use(assets(directoryPath));

        const response = await router.fetch(createTestRequest('/file.js'));

        expect(await response.text()).toEqual('console.log(\'foo\');\n');
        expect(response.headers.get('content-type')).toEqual('text/javascript; charset=utf-8');
        expect(response.headers.get('content-length')).toEqual('20');
    });

    describe('content type set before the plugin', () => {
        function createApp(headers: Record<string, string>) {
            const router = new App();

            router.use(defineCoreHandler((event) => {
                for (const [key, value] of Object.entries(headers)) {
                    event.response.headers.set(key, value);
                }

                return event.next();
            }));
            router.use(assets(directoryPath));

            return router;
        }

        it('should keep a content type set by earlier middleware', async () => {
            const router = createApp({ 'content-type': 'application/x-custom' });

            const response = await router.fetch(createTestRequest('/file.txt'));

            expect(response.status).toEqual(200);
            expect(await response.text()).toEqual('foo\n');
            expect(response.headers.get('content-type')).toEqual('application/x-custom');
        });

        it('should infer the content type from the file name without one', async () => {
            const router = createApp({ 'x-foo': 'bar' });

            const response = await router.fetch(createTestRequest('/file.js'));

            expect(response.headers.get('x-foo')).toEqual('bar');
            expect(response.headers.get('content-type')).toEqual('text/javascript; charset=utf-8');
        });

        it('should drop content type and disposition of an unsatisfiable range', async () => {
            const router = createApp({
                'content-type': 'application/x-custom',
                'content-disposition': 'attachment; filename="file.txt"',
            });

            const response = await router.fetch(createTestRequest('/file.txt', { headers: { range: 'bytes=10-' } }));

            expect(response.status).toEqual(416);
            expect(response.headers.get('content-range')).toEqual('bytes */4');
            expect(response.headers.get('content-type')).toBeNull();
            expect(response.headers.get('content-disposition')).toBeNull();
        });
    });

    it('should not serve file', async () => {
        const router = new App();

        router.use(assets(directoryPath));

        const response = await router.fetch(createTestRequest('/file.bar'));

        expect(response.status).toEqual(404);
    });

    it('should serve directory by index file', async () => {
        const router = new App();

        router.use(assets(directoryPath, { fallback: true }));

        let response = await router.fetch(createTestRequest('/html'));

        expect(await response.text()).toEqual('foo\n');
        expect(response.headers.get('content-type')).toEqual('text/html; charset=utf-8');
        expect(response.headers.get('content-length')).toEqual('4');

        response = await router.fetch(createTestRequest('/html/'));

        expect(await response.text()).toEqual('foo\n');
        expect(response.headers.get('content-type')).toEqual('text/html; charset=utf-8');
        expect(response.headers.get('content-length')).toEqual('4');
    });

    it('should serve a nested file on the first request', async () => {
        const router = new App();

        router.use(assets(directoryPath));

        const response = await router.fetch(createTestRequest('/html/index.html'));

        expect(response.status).toEqual(200);
    });

    it('should report a failed directory scan to the request', async () => {
        const router = new App();

        router.use(assets(path.join(directoryPath, 'missing')));

        const response = await router.fetch(createTestRequest('/file.txt'));

        expect(response.status).toEqual(500);
    });

    it('should skip entries that cannot be resolved during the scan', async () => {
        const directory = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'routup-assets-'));

        try {
            await fs.promises.writeFile(path.join(directory, 'file.txt'), 'foo');
            await fs.promises.symlink(path.join(directory, 'missing'), path.join(directory, 'dangling'));

            const router = new App();

            router.use(assets(directory));

            const response = await router.fetch(createTestRequest('/file.txt'));

            expect(response.status).toEqual(200);
        } finally {
            await fs.promises.rm(directory, { recursive: true, force: true });
        }
    });

    describe('without a scan', () => {
        const options = buildOptions({ directoryPath: path.join(directoryPath, 'html'), scan: false });

        it('should only serve dotfiles from .well-known unless enabled', async () => {
            const directory = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'routup-assets-'));

            try {
                await fs.promises.mkdir(path.join(directory, '.well-known'));
                await fs.promises.writeFile(path.join(directory, '.env'), 'foo');
                await fs.promises.writeFile(path.join(directory, '.well-known', 'file.txt'), 'foo');

                const hidden = buildOptions({ directoryPath: directory, scan: false });
                const visible = buildOptions({
                    directoryPath: directory, 
                    scan: false, 
                    dotFiles: true, 
                });

                expect(await lookup('/.env', hidden)).toBeUndefined();
                expect(await lookup('/.well-known/file.txt', hidden)).toBeDefined();
                expect(await lookup('/.env', visible)).toBeDefined();
            } finally {
                await fs.promises.rm(directory, { recursive: true, force: true });
            }
        });

        it('should find a file inside the directory', async () => {
            const fileInfo = await lookup('/index.html', options);

            expect(fileInfo?.filePath).toEqual(path.join(directoryPath, 'html', 'index.html'));
        });

        it('should not find a file outside the directory', async () => {
            expect(await lookup('/../file.txt', options)).toBeUndefined();
        });

        it('should not find a sibling directory sharing the directory prefix', async () => {
            const sibling = buildOptions({ directoryPath: path.join(directoryPath, 'ht'), scan: false });

            expect(await lookup('/../html/index.html', sibling)).toBeUndefined();
        });
    });
});
