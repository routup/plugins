import vm from 'node:vm';
import { describe, expect, it } from 'vitest';
import { App, defineCoreHandler } from 'routup';
import type { Spec } from 'swagger-ui-dist';
import type { UIOptions } from '../../../src';
import { buildContentSecurityPolicy, createUIHandler, swaggerUI } from '../../../src';
import { serializeOptions } from '../../../src/serialize';

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
function runInitializer(source: string, baseURI = 'http://localhost/docs/') : Captured {
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
        document: { baseURI },
        URL,
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

        it('should add path and operation server origins', async () => {
            const router = createRouter({
                openapi: '3.0.0',
                info: { title: 'x', version: '1' },
                servers: [{ url: 'https://api.example.com' }],
                paths: {
                    '/upload': {
                        post: {
                            servers: [{ url: 'https://uploads.example.com' }],
                            responses: {},
                        },
                    },
                    '/files': {
                        servers: [{ url: 'https://{region}.files.example.com', variables: { region: { default: 'eu' } } }],
                        get: { responses: {} },
                    },
                    '/broken': null,
                    '/other': {
                        get: null,
                        parameters: [],
                        'x-ext': { servers: [{ url: 'https://ignored.example.com' }] },
                    },
                },
            }, { csp: true });

            const response = await router.fetch(createTestRequest('/docs/'));
            const policy = response.headers.get('content-security-policy')!;

            expect(policy).toMatch(/connect-src 'self' [^;]*https:\/\/api\.example\.com/);
            expect(policy).toMatch(/connect-src 'self' [^;]*https:\/\/uploads\.example\.com/);
            expect(policy).toMatch(/connect-src 'self' [^;]*https:\/\/eu\.files\.example\.com/);
            expect(policy).not.toContain('ignored.example.com');
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

    describe('csp sources', () => {
        const fetchPolicy = async (spec: Record<string, any>, options: UIOptions = {}) => {
            const router = createRouter({
                openapi: '3.0.0',
                info: { title: 'x', version: '1' },
                ...spec,
            }, { csp: true, ...options });

            const response = await router.fetch(createTestRequest('/docs/'));

            return response.headers.get('content-security-policy')!;
        };

        const directives = (policy: string) => policy.split('; ').map((directive) => directive.split(' ')[0]);

        it('should drop server origins that are not plain host sources', async () => {
            const policy = await fetchPolicy({
                servers: [
                    { url: 'https://api.example;sandbox' },
                    { url: 'https://api.example,default-src' },
                    { url: 'https://api.example sandbox' },
                    { url: 'https://ok.example.com:8443/v1' },
                    { url: 'http://[::1]:3000/api' },
                ],
            });

            expect(directives(policy)).toEqual([
                'default-src',
                'script-src',
                'style-src',
                'img-src',
                'media-src',
                'font-src',
                'connect-src',
                'object-src',
                'base-uri',
                'form-action',
            ]);
            expect(policy).not.toContain('sandbox');
            expect(policy).not.toContain(',');
            expect(policy).not.toContain('api.example');
            expect(policy).toMatch(/connect-src 'self' [^;]*https:\/\/ok\.example\.com:8443/);
            expect(policy).toMatch(/connect-src 'self' [^;]*http:\/\/\[::1\]:3000/);
        });

        it('should reject consumer sources that would inject directives', () => {
            expect(() => buildContentSecurityPolicy({ connectSrc: ['https://a.example;sandbox'] })).toThrow(/connectSrc/);
            expect(() => buildContentSecurityPolicy({ imgSrc: ['https://a.example,script-src *'] })).toThrow(/imgSrc/);
            expect(() => buildContentSecurityPolicy({ origins: ['https://a.example sandbox'] })).toThrow(/origins/);
            expect(() => buildContentSecurityPolicy({ connectSrc: ['https://a.example\n'] })).toThrow();
        });

        it('should keep legitimate consumer source expressions', () => {
            const policy = buildContentSecurityPolicy({
                connectSrc: ['https://a.example.com', '*.example.com', 'https:', "'self'"],
                imgSrc: ['data:', 'blob:'],
                origins: ['https://ui.example.com'],
            });

            expect(policy).toContain("connect-src 'self' https://ui.example.com https://a.example.com *.example.com https:");
            expect(policy).toContain("img-src 'self' https://ui.example.com data: blob:;");
        });

        it('should allow every enum value of server variables', async () => {
            const policy = await fetchPolicy({
                servers: [
                    {
                        url: 'https://{env}.example.com:{port}',
                        variables: {
                            env: { default: 'prod', enum: ['prod', 'stage'] },
                            port: { default: '443', enum: ['443', '8443'] },
                        },
                    },
                ],
            });

            expect(policy).toMatch(/connect-src [^;]*https:\/\/prod\.example\.com[ ;]/);
            expect(policy).toMatch(/connect-src [^;]*https:\/\/stage\.example\.com[ ;]/);
            expect(policy).toMatch(/connect-src [^;]*https:\/\/prod\.example\.com:8443/);
            expect(policy).toMatch(/connect-src [^;]*https:\/\/stage\.example\.com:8443/);
        });

        it('should keep only the defaults of a server with too many variable combinations', async () => {
            const values = Array.from({ length: 9 }, (_, i) => `v${i}`);
            const policy = await fetchPolicy({
                servers: [
                    {
                        url: 'https://{a}.{b}.huge.example.com',
                        variables: { a: { default: 'v0', enum: values }, b: { default: 'v0', enum: values } },
                    },
                    { url: 'https://small.example.com' },
                ],
            });

            expect(policy).toContain('https://v0.v0.huge.example.com');
            expect(policy).not.toContain('v1.v0.huge.example.com');
            expect(policy).toContain('https://small.example.com');
        });

        it('should count a repeated variable once', async () => {
            const values = Array.from({ length: 9 }, (_, i) => `r${i}`);
            const policy = await fetchPolicy({
                servers: [{
                    url: 'https://{region}.api.example.com/{region}',
                    variables: { region: { default: 'r0', enum: values } },
                }],
            });

            for (const value of values) {
                expect(policy).toContain(`https://${value}.api.example.com`);
            }
        });

        it('should fall back to the defaults beyond the limit', async () => {
            const values = Array.from({ length: 9 }, (_, i) => `v${i}`);
            const policy = await fetchPolicy({
                servers: [{
                    url: 'https://{a}.{b}.fallback.example.com',
                    variables: { a: { default: 'v1', enum: values }, b: { default: 'v2', enum: values } },
                }],
            });

            expect(policy).toMatch(/connect-src [^;]*https:\/\/v1\.v2\.fallback\.example\.com/);
            expect(policy.match(/fallback\.example\.com/g)).toHaveLength(1);
        });

        it('should add both schemes for protocol-relative server urls', async () => {
            const policy = await fetchPolicy({ servers: [{ url: '//rel.example.com:8080/api' }] });

            expect(policy).toMatch(/connect-src [^;]*https:\/\/rel\.example\.com:8080/);
            expect(policy).toMatch(/connect-src [^;]*http:\/\/rel\.example\.com:8080/);
        });

        it('should add the origins of urls[]', async () => {
            const policy = await fetchPolicy({}, {
                layout: 'StandaloneLayout',
                urls: [
                    { url: 'https://other.example.com/openapi.json', name: 'other' },
                    { url: '/local.json', name: 'local' },
                ],
            });

            expect(policy).toMatch(/connect-src [^;]*https:\/\/other\.example\.com/);
        });
    });

    describe('oauth2 redirect url', () => {
        it('should default to the redirect page next to the shell', async () => {
            const router = createRouter();

            const response = await router.fetch(createTestRequest('/docs/swagger-initializer.js'));
            const source = await response.text();

            // At /api/docs (no trailing slash) location.pathname is outside the
            // mount, document.baseURI (from <base href>) is not.
            const { config } = runInitializer(source, 'https://example.com/api/docs/');

            expect(config.oauth2RedirectUrl).toEqual('https://example.com/api/docs/oauth2-redirect.html');
        });

        it('should keep a configured redirect url', async () => {
            const router = createRouter('test/data/swagger.json', { oauth2RedirectUrl: 'https://example.com/cb' });

            const response = await router.fetch(createTestRequest('/docs/swagger-initializer.js'));
            const { config } = runInitializer(await response.text());

            expect(config.oauth2RedirectUrl).toEqual('https://example.com/cb');
        });
    });

    describe('baseURL', () => {
        it('should throw at setup for an invalid baseURL', () => {
            expect(() => createUIHandler('test/data/swagger.json', { baseURL: 'not a url' })).toThrow(/baseURL/);
            expect(() => createUIHandler('test/data/swagger.json', { baseURL: 'ftp://example.com/' })).toThrow(/baseURL/);
        });

        it('should keep the path prefix without a trailing slash', async () => {
            const router = createRouter('test/data/swagger.json', { baseURL: 'https://example.com/prefix' });

            const response = await router.fetch(createTestRequest('/docs'));

            expect(await response.text()).toContain('<base href="https://example.com/prefix/docs/" />');
        });

        it('should keep the path prefix for a root mount', async () => {
            const router = new App();

            router.use(swaggerUI('test/data/swagger.json', { baseURL: 'https://example.com/prefix/' }));

            const response = await router.fetch(createTestRequest('/'));

            expect(await response.text()).toContain('<base href="https://example.com/prefix/" />');
        });
    });

    describe('function options', () => {
        it('should throw at setup for bound or native functions', () => {
            const fn = function interceptor(req: any) {
                return req;
            };

            expect(() => createUIHandler('test/data/swagger.json', { requestInterceptor: fn.bind(null) })).toThrow(/requestInterceptor/);
            expect(() => createUIHandler('test/data/swagger.json', { responseInterceptor: Math.max as any })).toThrow(/responseInterceptor/);
        });
    });

    describe('serialize', () => {
        const roundTrip = (input: Record<string, any>) => vm.runInNewContext(`(${serializeOptions(input)})`);

        it('should serialize method forms to valid expressions', async () => {
            const sources : Record<string, any>[] = [
                {
                    plain(req: any) {
                        return { req, form: 'plain' }; 
                    }, 
                },
                {
                    async plain(req: any) {
                        return { req, form: 'async' }; 
                    }, 
                },
                {
                    * plain(req: any) {
                        yield { req, form: 'generator' }; 
                    }, 
                },
                {
                    async* plain(req: any) {
                        yield { req, form: 'async generator' }; 
                    }, 
                },
                {
                    [['pla', 'in'].join('')](req: any) {
                        return { req, form: 'computed' };
                    },
                },
                {
                    // eslint-disable-next-line no-useless-computed-key
                    ['plain'](req: any) {
                        return { req, form: 'computed literal' };
                    },
                },
                {
                    'plain'(req: any) {
                        return { req, form: 'quoted' }; 
                    }, 
                },
                {
                    'with space'(req: any) {
                        return { req, form: 'quoted space' }; 
                    }, 
                },
            ];

            for (const source of sources) {
                const fn = Object.values(source)[0];
                const output = roundTrip({ requestInterceptor: fn });
                let result = output.requestInterceptor(1);

                if (typeof result?.next === 'function') {
                    result = result.next();
                }

                result = await result;

                expect(result.value ?? result).toEqual(await (async () => {
                    let expected = fn(1);

                    if (typeof expected?.next === 'function') {
                        expected = expected.next();
                    }

                    expected = await expected;

                    return expected.value ?? expected;
                })());
            }
        });

        it('should keep function and arrow expressions', () => {
            const output = roundTrip({
                a: function named(x: number) {
                    return x + 1;
                },
                b: (x: number) => x + 2,
                c: async (x: number) => x + 3,
            });

            expect(output.a(1)).toEqual(2);
            expect(output.b(1)).toEqual(3);
        });

        it('should keep __proto__ keys as own properties', () => {
            const spec = JSON.parse('{"info":{"__proto__":{"x":"</script>&\u2028"}},"__proto__":[1]}');
            const source = serializeOptions({ spec });

            expect(source).not.toContain('<');
            expect(source).not.toContain('\u2028');

            const output = roundTrip({ spec });

            expect(Object.hasOwn(output.spec, '__proto__')).toBe(true);
            expect(Object.hasOwn(output.spec.info, '__proto__')).toBe(true);
            expect(Object.getPrototypeOf(output.spec.info)).toBe(Object.getPrototypeOf(output.spec));
            expect(JSON.stringify(output.spec)).toEqual(JSON.stringify(spec));
        });
    });
});
