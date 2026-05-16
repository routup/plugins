import { 
    describe, 
    expect, 
    it, 
    vi, 
} from 'vitest';
import {
    App,
    defineCoreHandler,
} from 'routup';
import {
    appendCorsHeaders,
    appendCorsPreflightHeaders,
    cors,
    handleCors,
    isCorsOriginAllowed,
    isPreflightRequest,
} from '../../src';

function createTestRequest(url: string, options?: RequestInit): Request {
    const fullUrl = url.startsWith('http') ? url : `http://localhost${url}`;
    return new Request(fullUrl, options);
}

describe('src/module', () => {
    it('should add wildcard origin headers on a simple request', async () => {
        const router = new App();
        router.use(cors());
        router.get('/', defineCoreHandler(() => 'ok'));

        const response = await router.fetch(createTestRequest('/', { headers: { origin: 'http://example.com' } }));

        expect(response.status).toEqual(200);
        expect(response.headers.get('access-control-allow-origin')).toEqual('*');
    });

    it('should answer preflight with default 204 + headers', async () => {
        const router = new App();
        router.use(cors());
        router.post('/', defineCoreHandler(() => 'ok'));

        const response = await router.fetch(createTestRequest('/', {
            method: 'OPTIONS',
            headers: {
                origin: 'http://example.com',
                'access-control-request-method': 'POST',
                'access-control-request-headers': 'content-type',
            },
        }));

        expect(response.status).toEqual(204);
        expect(response.headers.get('access-control-allow-origin')).toEqual('*');
        expect(response.headers.get('access-control-allow-methods')).toEqual('*');
        expect(response.headers.get('access-control-allow-headers')).toEqual('content-type');
    });

    it('should override preflight status', async () => {
        const router = new App();
        router.use(cors({ preflight: { status: 200 } }));
        router.post('/', defineCoreHandler(() => 'ok'));

        const response = await router.fetch(createTestRequest('/', {
            method: 'OPTIONS',
            headers: {
                origin: 'http://example.com',
                'access-control-request-method': 'POST',
            },
        }));

        expect(response.status).toEqual(200);
    });

    it('should allow origin from string array', async () => {
        const router = new App();
        router.use(cors({ origin: ['http://allowed.test'] }));
        router.get('/', defineCoreHandler(() => 'ok'));

        const allowed = await router.fetch(createTestRequest('/', { headers: { origin: 'http://allowed.test' } }));
        expect(allowed.headers.get('access-control-allow-origin')).toEqual('http://allowed.test');
        expect(allowed.headers.get('vary')).toContain('origin');

        const denied = await router.fetch(createTestRequest('/', { headers: { origin: 'http://denied.test' } }));
        expect(denied.headers.get('access-control-allow-origin')).toBeNull();
    });

    it('should allow origin from RegExp entry', async () => {
        const router = new App();
        router.use(cors({ origin: [/\.allowed\.test$/] }));
        router.get('/', defineCoreHandler(() => 'ok'));

        const response = await router.fetch(createTestRequest('/', { headers: { origin: 'http://api.allowed.test' } }));

        expect(response.headers.get('access-control-allow-origin'))
            .toEqual('http://api.allowed.test');
    });

    it('should allow origin from custom function', async () => {
        const router = new App();
        router.use(cors({ origin: (origin) => origin.endsWith('.example.com') }));
        router.get('/', defineCoreHandler(() => 'ok'));

        const response = await router.fetch(createTestRequest('/', { headers: { origin: 'http://api.example.com' } }));

        expect(response.headers.get('access-control-allow-origin'))
            .toEqual('http://api.example.com');
    });

    it('should emit "null" origin when configured', async () => {
        const router = new App();
        router.use(cors({ origin: 'null' }));
        router.get('/', defineCoreHandler(() => 'ok'));

        const response = await router.fetch(createTestRequest('/', { headers: { origin: 'null' } }));

        expect(response.headers.get('access-control-allow-origin')).toEqual('null');
        expect(response.headers.get('vary')).toContain('origin');
    });

    it('should emit credentials header and warn on wildcard origin', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

        try {
            const router = new App();
            router.use(cors({ credentials: true }));
            router.get('/', defineCoreHandler(() => 'ok'));

            const response = await router.fetch(createTestRequest('/', { headers: { origin: 'http://example.com' } }));

            expect(response.headers.get('access-control-allow-credentials')).toEqual('true');
            expect(warn).toHaveBeenCalled();
        } finally {
            warn.mockRestore();
        }
    });

    it('should not warn for credentials with all wildcard fields tightened', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

        try {
            const router = new App();
            router.use(cors({
                credentials: true,
                origin: ['http://example.com'],
                methods: ['GET'],
                allowHeaders: ['content-type'],
                exposeHeaders: ['etag'],
            }));

            expect(warn).not.toHaveBeenCalled();
        } finally {
            warn.mockRestore();
        }
    });

    it('should warn only about exposeHeaders when other wildcards are auto-handled under credentials', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

        try {
            const router = new App();
            router.use(cors({
                credentials: true,
                origin: ['http://example.com'],
            }));

            expect(warn).toHaveBeenCalledOnce();

            const exposeMessage = warn.mock.calls[0]?.[0] as string;
            expect(exposeMessage).toContain('exposeHeaders');
            expect(exposeMessage).toContain('not be exposed to JavaScript');
            expect(exposeMessage).not.toContain('methods');
            expect(exposeMessage).not.toContain('allowHeaders');
            expect(exposeMessage).not.toContain('origin');
        } finally {
            warn.mockRestore();
        }
    });

    it('should auto-expand methods wildcard to the fetchable HTTP verb list under credentials', async () => {
        const router = new App();
        router.use(cors({
            credentials: true,
            origin: ['http://example.com'],
            exposeHeaders: ['etag'],
        }));
        router.options('/', defineCoreHandler(() => 'ok'));

        const response = await router.fetch(createTestRequest('/', {
            method: 'OPTIONS',
            headers: {
                origin: 'http://example.com',
                'access-control-request-method': 'PATCH',
            },
        }));

        const allowed = response.headers.get('access-control-allow-methods');
        expect(allowed).toEqual('GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS');
    });

    it('should treat single-element wildcard arrays the same as the bare wildcard', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

        try {
            const router = new App();
            router.use(cors({
                credentials: true,
                origin: ['http://example.com'],
                methods: ['*'],
                allowHeaders: ['*'],
                exposeHeaders: ['*'],
            }));
            router.options('/', defineCoreHandler(() => 'ok'));

            const response = await router.fetch(createTestRequest('/', {
                method: 'OPTIONS',
                headers: {
                    origin: 'http://example.com',
                    'access-control-request-method': 'PATCH',
                    'access-control-request-headers': 'x-foo',
                },
            }));

            expect(response.headers.get('access-control-allow-methods'))
                .toEqual('GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS');
            expect(response.headers.get('access-control-allow-headers')).toEqual('x-foo');

            expect(warn).toHaveBeenCalledOnce();
            expect(warn.mock.calls[0]?.[0]).toContain('exposeHeaders');
        } finally {
            warn.mockRestore();
        }
    });

    it('should keep emitting wildcard methods on the wire when credentials is disabled', async () => {
        const router = new App();
        router.use(cors({ origin: ['http://example.com'] }));
        router.options('/', defineCoreHandler(() => 'ok'));

        const response = await router.fetch(createTestRequest('/', {
            method: 'OPTIONS',
            headers: {
                origin: 'http://example.com',
                'access-control-request-method': 'PATCH',
            },
        }));

        expect(response.headers.get('access-control-allow-methods')).toEqual('*');
    });

    it('should not warn about allowHeaders wildcard with credentials (mirrored from request)', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

        try {
            const router = new App();
            router.use(cors({
                credentials: true,
                origin: ['http://example.com'],
                methods: ['GET'],
                allowHeaders: '*',
                exposeHeaders: ['etag'],
            }));

            expect(warn).not.toHaveBeenCalled();
        } finally {
            warn.mockRestore();
        }
    });

    it('should not warn about origin when caller passed an explicit non-wildcard origin', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

        try {
            const router = new App();
            router.use(cors({
                credentials: true,
                origin: ['http://example.com'],
                methods: ['GET'],
                allowHeaders: ['content-type'],
                exposeHeaders: ['etag'],
            }));

            expect(warn).not.toHaveBeenCalled();
        } finally {
            warn.mockRestore();
        }
    });

    it('should match origins against a global-flagged RegExp deterministically', async () => {
        const router = new App();
        const pattern = /\.allowed\.test$/g;
        router.use(cors({ origin: [pattern] }));
        router.get('/', defineCoreHandler(() => 'ok'));

        const first = await router.fetch(createTestRequest('/', { headers: { origin: 'http://api.allowed.test' } }));
        const second = await router.fetch(createTestRequest('/', { headers: { origin: 'http://api.allowed.test' } }));

        expect(first.headers.get('access-control-allow-origin')).toEqual('http://api.allowed.test');
        expect(second.headers.get('access-control-allow-origin')).toEqual('http://api.allowed.test');
    });

    it('should join methods array', async () => {
        const router = new App();
        router.use(cors({ methods: ['GET', 'POST'] }));
        router.post('/', defineCoreHandler(() => 'ok'));

        const response = await router.fetch(createTestRequest('/', {
            method: 'OPTIONS',
            headers: {
                origin: 'http://example.com',
                'access-control-request-method': 'POST',
            },
        }));

        expect(response.headers.get('access-control-allow-methods')).toEqual('GET,POST');
    });

    it('should expose listed response headers', async () => {
        const router = new App();
        router.use(cors({ exposeHeaders: ['x-total-count', 'etag'] }));
        router.get('/', defineCoreHandler(() => 'ok'));

        const response = await router.fetch(createTestRequest('/', { headers: { origin: 'http://example.com' } }));

        expect(response.headers.get('access-control-expose-headers'))
            .toEqual('x-total-count,etag');
    });

    it('should set max-age on preflight', async () => {
        const router = new App();
        router.use(cors({ maxAge: '600' }));
        router.post('/', defineCoreHandler(() => 'ok'));

        const response = await router.fetch(createTestRequest('/', {
            method: 'OPTIONS',
            headers: {
                origin: 'http://example.com',
                'access-control-request-method': 'POST',
            },
        }));

        expect(response.headers.get('access-control-max-age')).toEqual('600');
    });

    it('should preserve both vary values when origin and allowHeaders are concrete', async () => {
        const router = new App();
        router.use(cors({
            origin: ['http://example.com'],
            allowHeaders: ['content-type'],
        }));
        router.post('/', defineCoreHandler(() => 'ok'));

        const response = await router.fetch(createTestRequest('/', {
            method: 'OPTIONS',
            headers: {
                origin: 'http://example.com',
                'access-control-request-method': 'POST',
            },
        }));

        const vary = response.headers.get('vary') ?? '';
        expect(vary).toContain('origin');
        expect(vary).toContain('access-control-request-headers');
    });

    it('should not produce a preflight response on a non-OPTIONS request', async () => {
        const router = new App();
        router.use(cors());
        router.post('/', defineCoreHandler(() => 'ok'));

        const response = await router.fetch(createTestRequest('/', {
            method: 'POST',
            headers: {
                origin: 'http://example.com',
                'access-control-request-method': 'POST',
            },
        }));

        expect(response.status).toEqual(200);
        expect(await response.text()).toEqual('ok');
    });

    it('should set Content-Length: 0 on preflight (Safari compat)', async () => {
        const router = new App();
        router.use(cors());
        router.post('/', defineCoreHandler(() => 'ok'));

        const response = await router.fetch(createTestRequest('/', {
            method: 'OPTIONS',
            headers: {
                origin: 'http://example.com',
                'access-control-request-method': 'POST',
            },
        }));

        expect(response.status).toEqual(204);
        expect(response.headers.get('content-length')).toEqual('0');
    });

    it('should accept maxAge as number', async () => {
        const router = new App();
        router.use(cors({ maxAge: 600 }));
        router.post('/', defineCoreHandler(() => 'ok'));

        const response = await router.fetch(createTestRequest('/', {
            method: 'OPTIONS',
            headers: {
                origin: 'http://example.com',
                'access-control-request-method': 'POST',
            },
        }));

        expect(response.headers.get('access-control-max-age')).toEqual('600');
    });
});

describe('origin option shapes', () => {
    it('should emit fixed string origin verbatim', async () => {
        const router = new App();
        router.use(cors({ origin: 'https://app.example.com' }));
        router.get('/', defineCoreHandler(() => 'ok'));

        const response = await router.fetch(createTestRequest('/', { headers: { origin: 'http://other.test' } }));

        expect(response.headers.get('access-control-allow-origin'))
            .toEqual('https://app.example.com');
        expect(response.headers.get('vary')).toContain('origin');
    });

    it('should reflect origin matched by a single RegExp', async () => {
        const router = new App();
        router.use(cors({ origin: /\.example\.com$/ }));
        router.get('/', defineCoreHandler(() => 'ok'));

        const allowed = await router.fetch(createTestRequest('/', { headers: { origin: 'http://api.example.com' } }));
        expect(allowed.headers.get('access-control-allow-origin'))
            .toEqual('http://api.example.com');

        const denied = await router.fetch(createTestRequest('/', { headers: { origin: 'http://denied.test' } }));
        expect(denied.headers.get('access-control-allow-origin')).toBeNull();
    });

    it('should reflect any request origin when origin=true', async () => {
        const router = new App();
        router.use(cors({ origin: true }));
        router.get('/', defineCoreHandler(() => 'ok'));

        const response = await router.fetch(createTestRequest('/', { headers: { origin: 'http://anything.test' } }));

        expect(response.headers.get('access-control-allow-origin'))
            .toEqual('http://anything.test');
        expect(response.headers.get('vary')).toContain('origin');
    });

    it('should bypass CORS entirely when origin=false', async () => {
        const router = new App();
        router.use(cors({ origin: false }));
        router.post('/', defineCoreHandler(() => 'ok'));

        const simple = await router.fetch(createTestRequest('/', {
            method: 'POST',
            headers: { origin: 'http://example.com' },
        }));
        expect(simple.headers.get('access-control-allow-origin')).toBeNull();

        const preflight = await router.fetch(createTestRequest('/', {
            method: 'OPTIONS',
            headers: {
                origin: 'http://example.com',
                'access-control-request-method': 'POST',
            },
        }));
        expect(preflight.headers.get('access-control-allow-origin')).toBeNull();
    });
});

describe('preflight.continue', () => {
    it('should call next() instead of sending 204 when set', async () => {
        const router = new App();
        router.use(cors({ preflight: { continue: true } }));
        router.options('/', defineCoreHandler((event) => new Response('custom-options', {
            status: 200,
            headers: event.response.headers,
        })));

        const response = await router.fetch(createTestRequest('/', {
            method: 'OPTIONS',
            headers: {
                origin: 'http://example.com',
                'access-control-request-method': 'POST',
            },
        }));

        expect(response.status).toEqual(200);
        expect(await response.text()).toEqual('custom-options');
        expect(response.headers.get('access-control-allow-origin')).toEqual('*');
    });
});

describe('helpers', () => {
    it('isCorsOriginAllowed returns true for wildcard', () => {
        expect(isCorsOriginAllowed('http://x.test', { origin: '*' })).toBe(true);
    });

    it('isCorsOriginAllowed returns false for missing origin', () => {
        expect(isCorsOriginAllowed(null, { origin: ['http://x.test'] })).toBe(false);
        expect(isCorsOriginAllowed(undefined, { origin: ['http://x.test'] })).toBe(false);
    });

    it('isCorsOriginAllowed string equality', () => {
        expect(isCorsOriginAllowed('http://x.test', { origin: ['http://x.test'] })).toBe(true);
        expect(isCorsOriginAllowed('http://y.test', { origin: ['http://x.test'] })).toBe(false);
    });

    it('isPreflightRequest returns false without origin or ACRM', async () => {
        const router = new App();
        router.use(defineCoreHandler((event) => {
            if (isPreflightRequest(event)) {
                return 'pre';
            }

            return 'plain';
        }));

        const response = await router.fetch(createTestRequest('/', {
            method: 'OPTIONS',
            headers: { origin: 'http://example.com' },
        }));

        expect(await response.text()).toEqual('plain');
    });

    it('handleCors returns a response on preflight, undefined otherwise', async () => {
        const router = new App();
        router.use(defineCoreHandler((event) => {
            const corsResponse = handleCors(event, { origin: '*' });
            if (corsResponse) {
                return corsResponse;
            }

            return 'ok';
        }));

        const preflight = await router.fetch(createTestRequest('/', {
            method: 'OPTIONS',
            headers: {
                origin: 'http://example.com',
                'access-control-request-method': 'POST',
            },
        }));
        expect(preflight.status).toEqual(204);

        const plain = await router.fetch(createTestRequest('/', { headers: { origin: 'http://example.com' } }));
        expect(await plain.text()).toEqual('ok');
        expect(plain.headers.get('access-control-allow-origin')).toEqual('*');
    });

    it('appendCorsHeaders / appendCorsPreflightHeaders can be used standalone', async () => {
        const router = new App();
        router.get('/', defineCoreHandler((event) => {
            appendCorsHeaders(event, { origin: '*', exposeHeaders: ['x-foo'] });
            return 'ok';
        }));
        router.options('/', defineCoreHandler((event) => {
            appendCorsPreflightHeaders(event, { origin: '*', maxAge: '60' });
            return new Response(null, {
                status: 204,
                headers: event.response.headers,
            });
        }));

        const get = await router.fetch(createTestRequest('/', { headers: { origin: 'http://example.com' } }));
        expect(get.headers.get('access-control-expose-headers')).toEqual('x-foo');

        const opt = await router.fetch(createTestRequest('/', {
            method: 'OPTIONS',
            headers: { origin: 'http://example.com' },
        }));
        expect(opt.headers.get('access-control-max-age')).toEqual('60');
    });
});
