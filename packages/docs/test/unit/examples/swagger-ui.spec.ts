import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';
import { App, defineCoreHandler } from 'routup';
import {
    buildContentSecurityPolicy,
    createUIHandler,
    isFileURL,
    swaggerUI,
} from '@routup/swagger-ui';
import { app as framePolicy } from '../../../examples/swagger-ui/frame-policy';
import { app as oauth } from '../../../examples/swagger-ui/oauth';
import { app as objectDocument } from '../../../examples/swagger-ui/object-document';
import { app as quickStart } from '../../../examples/swagger-ui/quick-start';
import { app as reverseProxy } from '../../../examples/swagger-ui/reverse-proxy';
import { app as urlDocument } from '../../../examples/swagger-ui/url-document';

const DOCUMENT = fileURLToPath(new URL('../../../examples/swagger-ui/openapi.json', import.meta.url));

const RECOMMENDED = "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; " +
    "media-src 'self' blob:; font-src 'self'; connect-src 'self'; worker-src 'none'; base-uri 'self'; " +
    "form-action 'self'; frame-ancestors 'none'";

function request(urlPath: string, init?: RequestInit): Request {
    return new Request(`http://localhost${urlPath}`, init);
}

async function baseHref(app: App, urlPath: string): Promise<string | undefined> {
    const response = await app.fetch(request(urlPath));

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('text/html; charset=utf-8');

    return /<base href="([^"]*)" \/>/.exec(await response.text())?.[1];
}

async function initializer(app: App, urlPath: string): Promise<string> {
    const response = await app.fetch(request(urlPath));

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('text/javascript; charset=utf-8');

    return response.text();
}

describe('quick-start', () => {
    it('answers the HTML shell under the mount path, with and without a trailing slash', async () => {
        expect(await baseHref(quickStart, '/docs')).toBe('/docs/');
        expect(await baseHref(quickStart, '/docs/')).toBe('/docs/');
        expect(await baseHref(quickStart, '/docs/index.html')).toBe('/docs/');
    });

    it('embeds the document passed in', async () => {
        const source = await initializer(quickStart, '/docs/swagger-initializer.js');

        expect(source).toContain('"title": "Todo API"');
        expect(source).toContain('"/todos"');
        expect(source).not.toContain('"url"');
    });

    it('serves the generated stylesheet and the swagger-ui-dist files', async () => {
        const files = [
            '/docs/index.css',
            '/docs/swagger-ui.css',
            '/docs/swagger-ui-bundle.js',
            '/docs/swagger-ui-standalone-preset.js',
            '/docs/favicon-16x16.png',
            '/docs/favicon-32x32.png',
        ];

        for (const file of files) {
            expect((await quickStart.fetch(request(file))).status, file).toBe(200);
        }
    });

    it('passes other files and methods on', async () => {
        for (const file of ['/docs/package.json', '/docs/README.md', '/docs/oauth2-redirect.html', '/docs/index.js']) {
            expect((await quickStart.fetch(request(file))).status, file).toBe(404);
        }

        expect((await quickStart.fetch(request('/docs/', { method: 'POST' }))).status).toBe(404);
        expect((await quickStart.fetch(request('/docs/', { method: 'HEAD' }))).status).toBe(200);

        const options = await quickStart.fetch(request('/docs/', { method: 'OPTIONS' }));

        expect(options.status).toBe(200);
        expect(options.headers.get('allow')).toBe('');
    });

    it('sends no security headers by default', async () => {
        const response = await quickStart.fetch(request('/docs/'));

        expect(response.headers.get('content-security-policy')).toBeNull();
        expect(response.headers.get('x-frame-options')).toBeNull();
    });
});

describe('object-document', () => {
    it('embeds the object and adds its server origin to connect-src', async () => {
        expect(await initializer(objectDocument, '/docs/swagger-initializer.js')).toContain('"url": "https://api.example.com"');

        const response = await objectDocument.fetch(request('/docs/', { method: 'HEAD' }));

        expect(response.headers.get('content-security-policy')).toBe(RECOMMENDED.replace("connect-src 'self'", "connect-src 'self' https://api.example.com"));
    });
});

describe('url-document', () => {
    it('passes the URL to Swagger UI instead of a spec', async () => {
        const source = await initializer(urlDocument, '/docs/swagger-initializer.js');

        expect(source).toContain('"url": "https://petstore3.swagger.io/api/v3/openapi.json"');
        expect(source).not.toContain('"spec"');
    });
});

describe('reverse-proxy', () => {
    it('prefixes the base href of a nested mount with basePath', async () => {
        expect(await baseHref(reverseProxy, '/api/docs')).toBe('/backend/api/docs/');
        expect((await reverseProxy.fetch(request('/docs'))).status).toBe(404);
    });
});

describe('oauth', () => {
    it('passes the oauth options and serves the redirect page', async () => {
        const source = await initializer(oauth, '/docs/swagger-initializer.js');

        expect(source).toContain('"clientId": "swagger-ui"');
        expect(source).toContain('"persistAuthorization": true');
        expect((await oauth.fetch(request('/docs/oauth2-redirect.html'))).status).toBe(200);
        expect((await oauth.fetch(request('/docs/oauth2-redirect.js'))).status).toBe(200);
    });
});

describe('frame-policy', () => {
    it('adds the sources and sends the security headers without x-frame-options', async () => {
        const response = await framePolicy.fetch(request('/docs/', { method: 'HEAD' }));
        const policy = response.headers.get('content-security-policy');

        expect(policy).toContain("connect-src 'self' https://extra.example.com;");
        expect(policy).toMatch(/; frame-ancestors 'self' https:\/\/portal\.example\.com$/);
        expect(response.headers.get('x-content-type-options')).toBe('nosniff');
        expect(response.headers.get('referrer-policy')).toBe('no-referrer');
        expect(response.headers.get('x-frame-options')).toBeNull();
    });
});

describe('behaviour stated on the pages', () => {
    it('serves at the root without a mount path', async () => {
        const app = new App();

        app.use(swaggerUI(DOCUMENT));

        expect(await baseHref(app, '/')).toBe('/');
    });

    it('lets later routes under the mount path answer', async () => {
        const app = new App();

        app.use('/docs', swaggerUI(DOCUMENT));
        app.get('/docs/extra', defineCoreHandler(() => 'extra'));

        expect(await (await app.fetch(request('/docs/extra'))).text()).toBe('extra');
    });

    it('reads the file and validates the options at app.use(), not when swaggerUI() is called', () => {
        const missing = swaggerUI('missing.json');
        const invalid = swaggerUI(DOCUMENT, { baseURL: 'not a url' });

        expect(() => new App().use(missing)).toThrow(/ENOENT/);
        expect(() => new App().use(invalid)).toThrow(/baseURL/);
        expect(() => createUIHandler('missing.json')).toThrow(/ENOENT/);
    });

    it('serves the same paths with createUIHandler() under a path', async () => {
        const app = new App();

        app.use('/docs', createUIHandler(DOCUMENT));

        expect(await baseHref(app, '/docs')).toBe('/docs/');
        expect((await app.fetch(request('/docs/swagger-ui-bundle.js'))).status).toBe(200);
    });

    it('resolves a relative file path against the working directory', async () => {
        const app = new App();

        app.use('/docs', swaggerUI(path.relative(process.cwd(), DOCUMENT)));

        expect(await initializer(app, '/docs/swagger-initializer.js')).toContain('"title": "Todo API"');
    });

    it('fails for a file:// URL string', () => {
        expect(() => new App().use(swaggerUI(pathToFileURL(DOCUMENT).href))).toThrow(/ENOENT/);
    });

    it('treats a string without protocol or with file: as a file path', () => {
        expect(isFileURL('./openapi.json')).toBe(true);
        expect(isFileURL('file:///srv/openapi.json')).toBe(true);
        expect(isFileURL('https://example.com/openapi.json')).toBe(false);
    });

    it('uses baseURL for the base href and prefers it over basePath', async () => {
        const app = new App();

        app.use('/docs', swaggerUI(DOCUMENT, { baseURL: 'https://example.com/api', basePath: '/ignored/' }));

        expect(await baseHref(app, '/docs')).toBe('https://example.com/api/docs/');
    });

    it('serves the redirect page for a document with an oauth2 scheme', async () => {
        const app = new App();

        app.use('/docs', swaggerUI({
            openapi: '3.1.0',
            info: { title: 'T', version: '1' },
            paths: {},
            components: { securitySchemes: { auth: { type: 'oauth2', flows: {} } } },
        }));

        expect((await app.fetch(request('/docs/oauth2-redirect.html'))).status).toBe(200);
    });

    it('sends a string policy as is', async () => {
        const app = new App();

        app.use('/docs', swaggerUI(DOCUMENT, { csp: "default-src 'self'", securityHeaders: true }));

        const response = await app.fetch(request('/docs/'));

        expect(response.headers.get('content-security-policy')).toBe("default-src 'self'");
        expect(response.headers.get('x-frame-options')).toBe('DENY');
    });

    it('sends SAMEORIGIN for frameAncestors of only self', async () => {
        const app = new App();

        app.use('/docs', swaggerUI(DOCUMENT, { csp: { frameAncestors: ["'self'"] }, securityHeaders: true }));

        expect((await app.fetch(request('/docs/'))).headers.get('x-frame-options')).toBe('SAMEORIGIN');
    });

    it('keeps the policy on a 304', async () => {
        const app = new App();

        app.use('/docs', swaggerUI(DOCUMENT, { csp: true }));

        const first = await app.fetch(request('/docs/swagger-ui.css'));
        const second = await app.fetch(request('/docs/swagger-ui.css', { headers: { 'if-none-match': first.headers.get('etag')! } }));

        expect(second.status).toBe(304);
        expect(second.headers.get('content-security-policy')).toBe(RECOMMENDED);
    });

    it('builds the recommended policy', () => {
        expect(buildContentSecurityPolicy()).toBe(RECOMMENDED);
        expect(buildContentSecurityPolicy({ frameAncestors: ["'self'"] })).toMatch(/; frame-ancestors 'self'$/);
        expect(() => buildContentSecurityPolicy({ connectSrc: ['a; b'] })).toThrow(/connectSrc/);
    });
});
