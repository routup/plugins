import vm from 'node:vm';
import { describe, expect, it } from 'vitest';
import { App, defineCoreHandler } from 'routup';
import type { Spec } from 'swagger-ui-dist';
import type { UIOptions } from '../../../src';
import { buildContentSecurityPolicy, swaggerUI } from '../../../src';

function createTestRequest(url: string, options?: RequestInit): Request {
    const fullUrl = url.startsWith('http') ? url : `http://localhost${url}`;

    return new Request(fullUrl, options);
}

const createRouter = (document: Spec | string = 'test/data/swagger.json', options?: UIOptions) => {
    const router = new App();

    router.use('/docs', swaggerUI(document, options));

    return router;
};

type Captured = { config: Record<string, any>, oauth?: unknown };

/**
 * Execute the generated initializer in a sandbox with a stub
 * SwaggerUIBundle and return the configuration it was called with.
 */
function runInitializer(source: string) : Captured {
    const captured : Captured = { config: {} };
    const ui = {
        initOAuth: (input: unknown) => {
            captured.oauth = input; 
        },
        authActions: { authorize: () => {} },
    };
    const SwaggerUIBundle = Object.assign((config: Record<string, any>) => {
        captured.config = config;

        return ui;
    }, { presets: { apis: {} }, plugins: { DownloadUrl: {} } });

    const window : Record<string, any> = {};

    vm.runInNewContext(source, {
        window,
        SwaggerUIBundle,
        SwaggerUIStandalonePreset: {},
    });

    window.onload();

    return captured;
}

const PAYLOAD = '</script><script>alert(1)</script><!-- & \u2028\u2029 $& $\' $`';

describe('src/ui hardening', () => {
    describe('layout', () => {
        it('should default to BaseLayout (no top bar to explore other documents)', async () => {
            const router = createRouter();

            const response = await router.fetch(createTestRequest('/docs/swagger-initializer.js'));
            const { config } = runInitializer(await response.text());

            expect(config.layout).toEqual('BaseLayout');
        });

        it('should let a consumer opt into StandaloneLayout', async () => {
            const router = createRouter('test/data/swagger.json', { layout: 'StandaloneLayout' });

            const response = await router.fetch(createTestRequest('/docs/swagger-initializer.js'));
            const { config } = runInitializer(await response.text());

            expect(config.layout).toEqual('StandaloneLayout');
        });
    });

    describe('escaping', () => {
        it('should not let spec content break out of the bootstrap', async () => {
            const spec = {
                openapi: '3.0.0',
                info: {
                    title: 'x', 
                    version: '1', 
                    description: PAYLOAD, 
                }, 
            };
            const router = createRouter(spec);

            const response = await router.fetch(createTestRequest('/docs/swagger-initializer.js'));

            expect(response.status).toEqual(200);
            expect(response.headers.get('content-type')).toEqual('text/javascript; charset=utf-8');

            const source = await response.text();

            expect(source).not.toContain('</script>');
            expect(source).not.toContain('<!--');
            expect(source).not.toContain('<');
            expect(source).not.toContain('\u2028');
            expect(source).not.toContain('\u2029');

            const { config } = runInitializer(source);

            expect(config.spec.info.description).toEqual(PAYLOAD);
            expect(config.url).toBeUndefined();
        });

        it('should keep function valued options working', async () => {
            const router = createRouter('test/data/swagger.json', { requestInterceptor: (req: any) => ({ ...req, marked: true }) });

            const response = await router.fetch(createTestRequest('/docs/swagger-initializer.js'));
            const { config } = runInitializer(await response.text());

            expect(typeof config.requestInterceptor).toEqual('function');
            expect(config.requestInterceptor({ a: 1 })).toEqual({ a: 1, marked: true });
            expect(config.spec.openapi ?? config.spec.swagger).toBeDefined();
        });

        it('should keep method shorthand options working', async () => {
            const options = {
                responseInterceptor(res: any) {
                    return { ...res, short: true }; 
                },
                async requestInterceptor(req: any) {
                    return req; 
                },
            };
            const router = createRouter('test/data/swagger.json', options);

            const response = await router.fetch(createTestRequest('/docs/swagger-initializer.js'));
            const { config } = runInitializer(await response.text());

            expect(config.responseInterceptor({ a: 1 })).toEqual({ a: 1, short: true });
            expect(typeof config.requestInterceptor).toEqual('function');
        });

        it('should pass a url document and oauth options', async () => {
            const router = createRouter('https://example.com/openapi.json', { oauth: { clientId: 'foo', scopes: [] } });

            const response = await router.fetch(createTestRequest('/docs/swagger-initializer.js'));
            const captured = runInitializer(await response.text());

            expect(captured.config.url).toEqual('https://example.com/openapi.json');
            expect(captured.config.oauth).toBeUndefined();
            expect(captured.oauth).toEqual({ clientId: 'foo', scopes: [] });
        });

        it('should not serialize plugin-only options', async () => {
            const router = createRouter('test/data/swagger.json', { basePath: '/api', csp: true });

            const response = await router.fetch(createTestRequest('/docs/swagger-initializer.js'));
            const { config } = runInitializer(await response.text());

            expect(config.basePath).toBeUndefined();
            expect(config.csp).toBeUndefined();
        });

        it('should escape the base href', async () => {
            const router = createRouter('test/data/swagger.json', { basePath: '/a"><script>' });

            const response = await router.fetch(createTestRequest('/docs'));
            const html = await response.text();

            expect(html).not.toContain('<script>');
            expect(html).toContain('<base href="/a&quot;&gt;&lt;script&gt;/docs/" />');
        });
    });

    describe('served files', () => {
        it.each([
            'swagger-ui.css',
            'swagger-ui-bundle.js',
            'swagger-ui-standalone-preset.js',
            'favicon-16x16.png',
            'favicon-32x32.png',
            'swagger-initializer.js',
            'index.css',
        ])('should serve %s', async (file) => {
            const router = createRouter();

            const response = await router.fetch(createTestRequest(`/docs/${file}`));

            expect(response.status).toEqual(200);
        });

        it.each([
            'README.md',
            'LICENSE',
            'NOTICE',
            'swagger-ui-bundle.js.map',
            'swagger-ui.css.map',
            'index.js',
            'absolute-path.js',
            'swagger-ui.js',
            'swagger-ui-es-bundle.js',
            'swagger-ui-es-bundle-core.js',
            'swagger-ui-bundle.js.LICENSE.txt',
            'log.bundle-sizes.swagger-ui.txt',
            'package.json',
            'oauth2-redirect.html',
            'oauth2-redirect.js',
            'foo',
            'foo/swagger-ui.css',
        ])('should not serve %s', async (file) => {
            // inline document without an oauth2 scheme
            const router = createRouter({
                openapi: '3.0.0', 
                info: { title: 'x', version: '1' }, 
                paths: {}, 
            });

            const response = await router.fetch(createTestRequest(`/docs/${file}`));

            expect(response.status).toEqual(404);
        });

        it('should not serve the petstore initializer', async () => {
            const router = createRouter();

            const response = await router.fetch(createTestRequest('/docs/swagger-initializer.js'));
            const source = await response.text();

            expect(source).not.toContain('petstore');
        });

        it('should answer index.html with the shell', async () => {
            const router = createRouter();

            const response = await router.fetch(createTestRequest('/docs/index.html'));
            const html = await response.text();

            expect(response.status).toEqual(200);
            expect(html).toContain('<base href="/docs/" />');
            expect(html).toContain('./swagger-initializer.js');
        });

        it('should serve the oauth redirect page when oauth is configured', async () => {
            for (const options of [
                { oauth: { clientId: 'foo', scopes: [] } },
                { oauth2RedirectUrl: 'http://localhost/docs/oauth2-redirect.html' },
            ] satisfies UIOptions[]) {
                const router = createRouter({
                    openapi: '3.0.0', 
                    info: { title: 'x', version: '1' }, 
                    paths: {}, 
                }, options);

                let response = await router.fetch(createTestRequest('/docs/oauth2-redirect.html'));

                expect(response.status).toEqual(200);
                expect(response.headers.get('content-type')).toContain('text/html');

                response = await router.fetch(createTestRequest('/docs/oauth2-redirect.js'));
                expect(response.status).toEqual(200);
            }
        });

        it('should serve the oauth redirect page when the spec declares an oauth2 scheme', async () => {
            const router = createRouter({
                openapi: '3.0.0',
                info: { title: 'x', version: '1' },
                components: { securitySchemes: { auth: { type: 'oauth2', flows: { password: { tokenUrl: 'https://auth.example.com/token', scopes: {} } } } } },
            });

            const response = await router.fetch(createTestRequest('/docs/oauth2-redirect.html'));

            expect(response.status).toEqual(200);
        });

        it('should fall through to later handlers for unknown paths', async () => {
            const router = new App();

            router.use(swaggerUI('test/data/swagger.json'));
            router.get('/health', defineCoreHandler(() => 'ok'));

            const response = await router.fetch(createTestRequest('/health'));

            expect(response.status).toEqual(200);
            expect(await response.text()).toEqual('ok');
        });
    });

    describe('methods', () => {
        it.each(['POST', 'PUT', 'PATCH', 'DELETE'])('should not answer %s with the shell', async (method) => {
            const router = createRouter();

            for (const path of ['/docs', '/docs/', '/docs/swagger-ui.css']) {
                const response = await router.fetch(createTestRequest(path, { method }));

                expect(response.status).toEqual(404);
                expect(await response.text()).not.toContain('<base href');
            }
        });

        it('should answer HEAD', async () => {
            const router = createRouter();

            let response = await router.fetch(createTestRequest('/docs/', { method: 'HEAD' }));

            expect(response.status).toEqual(200);

            response = await router.fetch(createTestRequest('/docs/swagger-ui.css', { method: 'HEAD' }));
            expect(response.status).toEqual(200);
        });
    });

    describe('base href', () => {
        it('should compute the base href per request', async () => {
            const router = createRouter();

            let response = await router.fetch(createTestRequest('/DoCs'));

            expect(response.status).toEqual(200);
            expect(await response.text()).toContain('<base href="/DoCs/" />');

            response = await router.fetch(createTestRequest('/docs'));
            expect(await response.text()).toContain('<base href="/docs/" />');
        });
    });

    describe('inline bootstrap', () => {
        it('should not contain inline scripts or styles', async () => {
            const router = createRouter();

            const response = await router.fetch(createTestRequest('/docs/'));
            const html = await response.text();

            expect(html).not.toMatch(/<style/);
            expect(html).not.toMatch(/<script>/);
            expect(html).not.toMatch(/<script(?![^>]*\bsrc=)[^>]*>/);
            expect(html).toContain('<script src="./swagger-initializer.js"></script>');
            expect(html).toContain('<link rel="stylesheet" type="text/css" href="./index.css" />');
        });
    });

    describe('csp', () => {
        it('should not set a policy by default', async () => {
            const router = createRouter();

            const response = await router.fetch(createTestRequest('/docs/'));

            expect(response.headers.get('content-security-policy')).toBeNull();
        });

        it('should set the recommended policy', async () => {
            const router = createRouter('test/data/swagger.json', { csp: true });

            const response = await router.fetch(createTestRequest('/docs/'));
            const policy = response.headers.get('content-security-policy');

            expect(policy).toContain("script-src 'self'");
            expect(policy).toContain("style-src 'self'");
            // binary "Try it out" responses render from blob: urls
            expect(policy).toContain("img-src 'self' data: blob:");
            expect(policy).toContain("media-src 'self' blob:");
            expect(policy).not.toContain('unsafe-inline');
            expect(policy).not.toContain('unsafe-eval');
        });

        it('should add remote origins of the document', async () => {
            const router = createRouter({
                openapi: '3.0.0',
                info: { title: 'x', version: '1' },
                servers: [{ url: 'https://api.example.com/v1' }, { url: '/relative' }],
                components: { securitySchemes: { auth: { type: 'oauth2', flows: { password: { tokenUrl: 'https://auth.example.com/token', scopes: {} } } } } },
            }, { csp: true });

            const response = await router.fetch(createTestRequest('/docs/'));
            const policy = response.headers.get('content-security-policy')!;

            expect(policy).toMatch(/connect-src 'self' [^;]*https:\/\/api\.example\.com/);
            expect(policy).toMatch(/connect-src 'self' [^;]*https:\/\/auth\.example\.com/);
        });

        it('should expand templated server urls', async () => {
            const router = createRouter({
                openapi: '3.0.0',
                info: { title: 'x', version: '1' },
                servers: [
                    { url: 'https://{env}.example.com/{base}', variables: { env: { default: 'prod' }, base: { default: 'v1' } } },
                    { url: 'https://{tenant}.example.org' },
                ],
            }, { csp: true });

            const response = await router.fetch(createTestRequest('/docs/'));
            const policy = response.headers.get('content-security-policy')!;

            expect(policy).toMatch(/connect-src 'self' [^;]*https:\/\/prod\.example\.com/);
            expect(policy).not.toContain('example.org');
            expect(policy).not.toContain('{');
        });

        it('should add the spec url origin without validator for the base layout', async () => {
            const router = createRouter('https://specs.example.com/openapi.json', { csp: true });

            const response = await router.fetch(createTestRequest('/docs/'));
            const policy = response.headers.get('content-security-policy')!;

            expect(policy).toMatch(/connect-src 'self' [^;]*https:\/\/specs\.example\.com/);
            expect(policy).not.toContain('validator.swagger.io');
        });

        it('should add the validator origin for the standalone layout', async () => {
            const router = createRouter('https://specs.example.com/openapi.json', { csp: true, layout: 'StandaloneLayout' });

            const response = await router.fetch(createTestRequest('/docs/'));
            const policy = response.headers.get('content-security-policy')!;

            expect(policy).toMatch(/img-src 'self' data: blob: [^;]*https:\/\/validator\.swagger\.io/);
        });

        it('should set a custom policy', async () => {
            const router = createRouter('test/data/swagger.json', { csp: "default-src 'none'" });

            const response = await router.fetch(createTestRequest('/docs/'));

            expect(response.headers.get('content-security-policy')).toEqual("default-src 'none'");
        });

        it('should keep the policy on 304 responses', async () => {
            const router = createRouter('test/data/swagger.json', { csp: true });

            for (const path of ['/docs/', '/docs/swagger-initializer.js', '/docs/swagger-ui.css']) {
                const first = await router.fetch(createTestRequest(path));
                const etag = first.headers.get('etag');

                expect(etag).toBeTruthy();
                expect(first.headers.get('content-security-policy')).toBeTruthy();

                const second = await router.fetch(createTestRequest(path, { headers: { 'if-none-match': etag! } }));

                expect(second.status).toEqual(304);
                expect(second.headers.get('content-security-policy')).toEqual(first.headers.get('content-security-policy'));
            }
        });

        it('should build a policy with extra sources', () => {
            const policy = buildContentSecurityPolicy({ connectSrc: ['https://a.example.com'], imgSrc: ['https://b.example.com'] });

            expect(policy).toContain("connect-src 'self' https://a.example.com");
            expect(policy).toContain("img-src 'self' data: blob: https://b.example.com");
            expect(policy).toContain("media-src 'self' blob:");
            expect(policy).toContain("object-src 'none'");
        });
    });
});
