import {
    mkdirSync,
    mkdtempSync,
    rmSync,
    statSync,
    writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    afterAll,
    beforeAll,
    describe,
    expect,
    it,
} from 'vitest';
import { App, defineCoreHandler } from 'routup';
import { assets, buildOptions, createHandler } from '@routup/assets';
import type { OptionsInput } from '@routup/assets';
import { app as cacheHeaders } from '../../../examples/assets/cache-headers';
import { app as missingFile } from '../../../examples/assets/missing-file';
import { app as pathPrefix } from '../../../examples/assets/path-prefix';
import { app as quickStart } from '../../../examples/assets/quick-start';
import { app as severalFolders } from '../../../examples/assets/several-folders';
import { app as wrapHandler } from '../../../examples/assets/wrap-handler';

const publicDir = fileURLToPath(new URL('../../../examples/assets/public', import.meta.url));

function request(urlPath: string, init?: RequestInit): Request {
    return new Request(`http://localhost${urlPath}`, init);
}

async function text(app: App, urlPath: string, init?: RequestInit): Promise<string> {
    return (await app.fetch(request(urlPath, init))).text();
}

let dir: string;

function create(options?: OptionsInput, directory = dir): App {
    const app = new App();

    app.use(assets(directory, options));
    app.use(defineCoreHandler(() => 'next'));

    return app;
}

beforeAll(() => {
    dir = mkdtempSync(path.join(tmpdir(), 'routup-assets-'));
    mkdirSync(path.join(dir, '.well-known'));
    mkdirSync(path.join(dir, 'api'));
    writeFileSync(path.join(dir, 'index.html'), 'shell');
    writeFileSync(path.join(dir, 'secret.txt'), 'secret');
    writeFileSync(path.join(dir, 'robots.txt'), 'robots');
    writeFileSync(path.join(dir, '.env'), 'env');
    writeFileSync(path.join(dir, '.well-known', 'security.txt'), 'security');
    writeFileSync(path.join(dir, 'api', 'data.json'), '{}');
});

afterAll(() => {
    rmSync(dir, { recursive: true, force: true });
});

describe('quick-start', () => {
    it('serves a file found with an extension, with its headers', async () => {
        const response = await quickStart.fetch(request('/about'));
        const stats = statSync(path.join(publicDir, 'about.html'));

        expect(response.status).toBe(200);
        expect(await response.text()).toContain('<h1>About</h1>');
        expect(response.headers.get('content-type')).toBe('text/html; charset=utf-8');
        expect(response.headers.get('cache-control')).toBe('public,max-age=0,must-revalidate');
        expect(response.headers.get('etag')).toBe(`W/"${stats.size}-${stats.mtime.getTime()}"`);
        // the size shown on the overview page
        expect(stats.size).toBe(52);
        expect(response.headers.get('last-modified')).toBe(stats.mtime.toUTCString());
        expect(response.headers.get('accept-ranges')).toBe('bytes');
        expect(response.headers.get('content-length')).toBe(`${stats.size}`);
    });

    it('serves index files', async () => {
        expect(await text(quickStart, '/')).toContain('<h1>Home</h1>');
        expect(await text(quickStart, '/docs')).toContain('<h1>Docs</h1>');
        expect(await text(quickStart, '/docs/')).toContain('<h1>Docs</h1>');
    });

    it('passes a missing file on', async () => {
        expect((await quickStart.fetch(request('/missing'))).status).toBe(404);
    });

    it('answers 304 for a matching ETag or an unchanged date', async () => {
        const first = await quickStart.fetch(request('/about'));
        const etag = first.headers.get('etag')!;
        const lastModified = first.headers.get('last-modified')!;

        let response = await quickStart.fetch(request('/about', { headers: { 'if-none-match': etag } }));

        expect(response.status).toBe(304);
        expect(await response.text()).toBe('');

        response = await quickStart.fetch(request('/about', { headers: { 'if-modified-since': lastModified } }));

        expect(response.status).toBe(304);
    });

    it('answers a range request with 206', async () => {
        const response = await quickStart.fetch(request('/robots.txt', { headers: { range: 'bytes=0-9' } }));

        expect(response.status).toBe(206);
        expect(response.headers.get('content-range')).toMatch(/^bytes 0-9\/\d+$/);
        expect(await response.text()).toBe('User-agent');
    });
});

describe('several-folders', () => {
    it('checks the folders in order', async () => {
        expect(await text(severalFolders, '/about')).toContain('<h1>About</h1>');
        expect(await text(severalFolders, '/old-page')).toContain('<h1>Old Page</h1>');
        expect(await text(severalFolders, '/about')).not.toContain('Old About');
    });
});

describe('path-prefix', () => {
    it('serves files under the prefix only', async () => {
        expect(await text(pathPrefix, '/static/about')).toContain('<h1>About</h1>');
        expect(await text(pathPrefix, '/static/docs/')).toContain('<h1>Docs</h1>');
        expect(await text(pathPrefix, '/about')).toBe('{"page":"about"}');
    });
});

describe('cache-headers', () => {
    it('caches hashed files for a year and revalidates the rest', async () => {
        const hashed = await cacheHeaders.fetch(request('/assets/app.3f9a1c.css'));

        expect(hashed.status).toBe(200);
        expect(hashed.headers.get('content-type')).toBe('text/css; charset=utf-8');
        expect(hashed.headers.get('cache-control')).toBe('public,max-age=31536000,immutable');

        const page = await cacheHeaders.fetch(request('/about'));

        expect(page.headers.get('cache-control')).toBe('public,max-age=0,must-revalidate');

        // curl -I sends HEAD
        const head = await cacheHeaders.fetch(request('/assets/app.3f9a1c.css', { method: 'HEAD' }));

        expect(head.status).toBe(200);
        expect(head.headers.get('cache-control')).toBe('public,max-age=31536000,immutable');
    });
});

describe('missing-file', () => {
    it('answers a missing file with the resolve result', async () => {
        const response = await missingFile.fetch(request('/files/nope.txt'));

        expect(response.status).toBe(404);
        expect(await response.json()).toEqual({ message: '/files/nope.txt not found' });
        expect(await text(missingFile, '/files/about')).toContain('<h1>About</h1>');
    });
});

describe('wrap-handler', () => {
    it('adds a header and answers 404 for a missing file', async () => {
        const response = await wrapHandler.fetch(request('/files/about'));

        expect(response.headers.get('x-robots-tag')).toBe('noindex');
        expect(await response.text()).toContain('<h1>About</h1>');

        const missing = await wrapHandler.fetch(request('/files/nope'));

        expect(missing.status).toBe(404);
        expect(await missing.text()).toBe('');
    });
});

describe('behaviour stated on the pages', () => {
    it('scans when the plugin is registered, not when assets() is called', async () => {
        const plugin = assets(dir);

        writeFileSync(path.join(dir, 'registered.txt'), 'registered');

        const app = new App();

        app.use(plugin);
        app.use(defineCoreHandler(() => 'next'));

        expect(await text(app, '/registered.txt')).toBe('registered');

        // the same plugin object registered again scans again
        writeFileSync(path.join(dir, 'again.txt'), 'again');

        const second = new App();

        second.use(plugin);

        expect(await text(app, '/again.txt')).toBe('next');
        expect(await text(second, '/again.txt')).toBe('again');
    });

    it('tries the plain path and its extensions before the index file, with or without a trailing slash', async () => {
        const sub = path.join(dir, 'order');

        mkdirSync(path.join(sub, 'docs'), { recursive: true });
        writeFileSync(path.join(sub, 'docs.html'), 'docs.html');
        writeFileSync(path.join(sub, 'docs', 'index.html'), 'docs/index.html');

        const app = create({}, sub);

        expect(await text(app, '/docs')).toBe('docs.html');
        expect(await text(app, '/docs/')).toBe('docs.html');
    });

    it('limits If-Modified-Since to GET and HEAD and ranges to GET', async () => {
        const first = await quickStart.fetch(request('/robots.txt'));
        const lastModified = first.headers.get('last-modified')!;

        expect((await quickStart.fetch(request('/robots.txt', { method: 'POST', headers: { 'if-modified-since': lastModified } }))).status).toBe(200);
        expect((await quickStart.fetch(request('/robots.txt', { method: 'HEAD', headers: { 'if-modified-since': lastModified } }))).status).toBe(304);
        expect((await quickStart.fetch(request('/robots.txt', { method: 'POST', headers: { range: 'bytes=0-9' } }))).status).toBe(200);
        expect((await quickStart.fetch(request('/robots.txt', { method: 'POST', headers: { 'if-none-match': first.headers.get('etag')! } }))).status).toBe(304);
    });

    it('serves a root file under any prefix', async () => {
        expect(await text(quickStart, '/x/y/robots.txt')).toContain('User-agent');
    });

    it('hides dotfiles except .well-known, unless dotFiles is set', async () => {
        for (const scan of [true, false]) {
            const app = create({ scan });

            expect(await text(app, '/.env'), `scan: ${scan}`).toBe('next');
            expect(await text(app, '/.well-known/security.txt'), `scan: ${scan}`).toBe('security');
            expect(await text(create({ scan, dotFiles: true }), '/.env'), `scan: ${scan}`).toBe('env');
        }
    });

    it('compiles ignores case-insensitively, as an array only', async () => {
        expect(await text(create({ ignores: ['ROBOTS'] }), '/robots.txt')).toBe('next');
        expect(await text(create({ ignores: [/^\/ROBOTS/] }), '/robots.txt')).toBe('next');
        expect(await text(create({ ignores: 'robots' }), '/robots.txt')).toBe('robots');
    });

    it('lets an anchored ignore pass under another prefix', async () => {
        const app = create({ ignores: [/^\/secret/] });

        expect(await text(app, '/secret.txt')).toBe('next');
        expect(await text(app, '/x/secret.txt')).toBe('secret');
    });

    it('serves the fallback file for any unmatched path', async () => {
        expect(await text(create({ fallback: true }), '/client/route')).toBe('shell');
        expect(await text(create({ fallback: 'index.html' }), '/client/route')).toBe('shell');
        expect(await text(create({ fallback: 'index.html' }), '/missing.css')).toBe('shell');
        expect(await text(create({ fallback: 'index.html', extensions: [] }), '/client/route')).toBe('next');
    });

    it('keeps paths out of the fallback once fallbackIgnores is set', async () => {
        const app = create({ fallback: true, fallbackIgnores: [] });

        expect(await text(app, '/missing.css')).toBe('next');
        expect(await text(app, '/.well-known/missing')).toBe('next');
        expect(await text(app, '/client/route')).toBe('shell');
        expect(await text(create({
            fallback: true,
            fallbackIgnores: [],
            dotFiles: true,
        }), '/.app/route')).toBe('next');
        expect(await text(create({ fallback: true, fallbackIgnores: [] }), '/.app/route')).toBe('shell');

        expect(await text(create({ fallback: true, fallbackIgnores: '^/API' }), '/api/missing')).toBe('next');
        expect(await text(create({ fallback: true, fallbackIgnores: [/^\/API/] }), '/api/missing')).toBe('next');
        expect(await text(create({ fallback: true, fallbackIgnores: ['^/API(/|$)'] }), '/apiary')).toBe('shell');
    });

    it('builds Cache-Control from cacheMaxAge and cacheImmutable', async () => {
        const read = async (options: OptionsInput) => (await create(options).fetch(request('/robots.txt'))).headers.get('cache-control');

        expect(await read({ cacheMaxAge: 3600 })).toBe('public,max-age=3600');
        expect(await read({ cacheMaxAge: false })).toBe('public,max-age=0,must-revalidate');
        expect(await read({ cacheImmutable: true })).toBe('public,max-age=0,immutable');
    });

    it('answers an empty 404 with fallthrough: false', async () => {
        const response = await create({ fallthrough: false }).fetch(request('/missing'));

        expect(response.status).toBe(404);
        expect(await response.text()).toBe('');
    });

    it('falls through when resolve returns nothing', async () => {
        expect(await text(create({ resolve: async () => undefined }), '/missing')).toBe('next');
    });

    it('serves a snapshot with scan, the current files without', async () => {
        const scanned = create();
        const unscanned = create({ scan: false });

        await scanned.fetch(request('/robots.txt'));
        writeFileSync(path.join(dir, 'late.txt'), 'late');

        expect(await text(scanned, '/late.txt')).toBe('next');
        expect(await text(unscanned, '/late.txt')).toBe('late');

        writeFileSync(path.join(dir, 'gone.txt'), 'gone');

        const scannedGone = create();

        await scannedGone.fetch(request('/robots.txt'));
        rmSync(path.join(dir, 'gone.txt'));

        const response = await scannedGone.fetch(request('/gone.txt'));

        expect(response.status).toBe(200);
        await expect(response.text()).rejects.toThrow(/ENOENT/);
    });

    it('answers 500 when the scan fails, and passes on without a scan', async () => {
        const missing = path.join(dir, 'does-not-exist');

        expect((await create({}, missing).fetch(request('/robots.txt'))).status).toBe(500);
        expect(await text(create({ scan: false }, missing), '/robots.txt')).toBe('next');
    });

    it('replaces directoryPath with the directory argument', async () => {
        expect(await text(create({ directoryPath: publicDir }), '/secret.txt')).toBe('secret');
    });

    it('resolves a relative directory against the working directory', () => {
        expect(buildOptions({ directoryPath: 'public' }).directoryPath).toBe(path.resolve(process.cwd(), 'public'));
    });

    it('serves files for any method', async () => {
        expect(await text(quickStart, '/robots.txt', { method: 'POST' })).toContain('User-agent');
    });

    it('serves index.html on a method route, after the route path is stripped', async () => {
        const app = new App();

        app.get('/download/:name', createHandler(dir));

        expect(await text(app, '/download/robots.txt')).toBe('shell');
    });
});
