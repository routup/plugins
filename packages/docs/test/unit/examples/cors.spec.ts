import {
    afterEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';
import { App, defineCoreHandler, defineErrorHandler } from 'routup';
import {
    appendCorsHeaders,
    appendCorsPreflightHeaders,
    cors,
    createHandler,
    handleCors,
    isCorsOriginAllowed,
    resolveOptions,
} from '@routup/cors';
import type { Options } from '@routup/cors';
import { app as allowList } from '../../../examples/cors/allow-list';
import { app as credentials } from '../../../examples/cors/credentials';
import { app as environments } from '../../../examples/cors/environments';
import { app as manualHeaders } from '../../../examples/cors/manual-headers';
import { app as oneOrigin } from '../../../examples/cors/one-origin';
import { app as ownPreflight } from '../../../examples/cors/own-preflight';
import { app as preflightCache } from '../../../examples/cors/preflight-cache';
import { app as quickStart } from '../../../examples/cors/quick-start';
import { app as singleRoute } from '../../../examples/cors/single-route';

const APP_ORIGIN = 'https://app.example.com';

function get(app: App, path: string, headers: Record<string, string> = {}): Promise<Response> {
    return app.fetch(new Request(`http://localhost${path}`, { headers }));
}

function preflight(
    app: App,
    path: string,
    origin: string,
    method = 'POST',
    requestHeaders?: string,
): Promise<Response> {
    const headers: Record<string, string> = {
        origin,
        'access-control-request-method': method,
    };

    if (requestHeaders) {
        headers['access-control-request-headers'] = requestHeaders;
    }

    return app.fetch(new Request(`http://localhost${path}`, { method: 'OPTIONS', headers }));
}

function corsHeaders(response: Response): Record<string, string> {
    const output: Record<string, string> = {};

    response.headers.forEach((value, key) => {
        if (key.startsWith('access-control-') || key === 'vary' || key === 'content-length') {
            output[key] = value;
        }
    });

    return output;
}

function create(options?: Options, setup?: (app: App) => void): App {
    const app = new App();

    setup?.(app);
    app.use(cors(options));
    app.get('/', defineCoreHandler(() => 'ok'));

    return app;
}

afterEach(() => {
    vi.restoreAllMocks();
});

describe('quick-start', () => {
    it('reflects the listed origin and exposes x-request-id', async () => {
        const response = await get(quickStart, '/', { origin: APP_ORIGIN });

        expect(await response.text()).toBe('Hello, World!');
        expect(corsHeaders(response)).toEqual({
            'access-control-allow-origin': APP_ORIGIN,
            'access-control-expose-headers': 'x-request-id',
            vary: 'origin',
        });
    });

    it('answers a preflight with 204 and the allowed headers', async () => {
        const response = await preflight(quickStart, '/', APP_ORIGIN, 'POST', 'content-type');

        expect(response.status).toBe(204);
        expect(await response.text()).toBe('');
        expect(corsHeaders(response)).toEqual({
            'access-control-allow-origin': APP_ORIGIN,
            'access-control-allow-methods': '*',
            'access-control-allow-headers': 'content-type,authorization',
            'content-length': '0',
            vary: 'origin, access-control-request-headers',
        });
    });

    it('sends no Access-Control-Allow-Origin to another origin', async () => {
        const response = await get(quickStart, '/', { origin: 'https://evil.example' });

        expect(response.status).toBe(200);
        expect(response.headers.get('access-control-allow-origin')).toBeNull();
    });
});

describe('one-origin', () => {
    it('allows the origin and sends no allow-origin to others', async () => {
        const allowed = await get(oneOrigin, '/todos', { origin: APP_ORIGIN });
        const other = await get(oneOrigin, '/todos', { origin: 'https://other.example' });

        expect(corsHeaders(allowed)).toEqual({
            'access-control-allow-origin': APP_ORIGIN,
            'access-control-expose-headers': '*',
            vary: 'origin',
        });
        expect(corsHeaders(other)).toEqual({ 'access-control-expose-headers': '*' });
    });
});

describe('allow-list', () => {
    it('reflects listed and preview origins only', async () => {
        const listed = await get(allowList, '/todos', { origin: 'https://admin.example.com' });
        const previewed = await get(allowList, '/todos', { origin: 'https://pr-42.preview.example.com' });
        const other = await get(allowList, '/todos', { origin: 'https://pr-42.preview.example.com.evil.example' });

        expect(listed.headers.get('access-control-allow-origin')).toBe('https://admin.example.com');
        expect(corsHeaders(previewed)).toEqual({
            'access-control-allow-origin': 'https://pr-42.preview.example.com',
            'access-control-expose-headers': '*',
            vary: 'origin',
        });
        expect(other.headers.get('access-control-allow-origin')).toBeNull();
    });

    it('answers a preflight from an unlisted origin with 204 but no allow-origin', async () => {
        const response = await preflight(allowList, '/todos', 'https://other.example');

        expect(response.status).toBe(204);
        expect(response.headers.get('access-control-allow-origin')).toBeNull();
    });
});

describe('environments', () => {
    it('matches strings by equality and RegExp entries with test()', async () => {
        const staging = await get(environments, '/', { origin: 'https://web.staging.example.com' });
        const prefix = await get(environments, '/', { origin: 'https://app.example.com.evil.example' });

        expect(staging.headers.get('access-control-allow-origin')).toBe('https://web.staging.example.com');
        expect(staging.headers.get('vary')).toBe('origin');
        expect(prefix.headers.get('access-control-allow-origin')).toBeNull();
    });
});

describe('credentials', () => {
    it('sends allow-credentials and the reflected origin', async () => {
        const response = await get(credentials, '/me', { origin: APP_ORIGIN });

        expect(corsHeaders(response)).toEqual({
            'access-control-allow-origin': APP_ORIGIN,
            'access-control-allow-credentials': 'true',
            'access-control-expose-headers': 'x-request-id',
            vary: 'origin',
        });
        expect(response.headers.get('x-request-id')).toMatch(/^[0-9a-f-]{36}$/);
    });

    it('expands methods to the fetchable list on a preflight', async () => {
        const response = await preflight(credentials, '/me', APP_ORIGIN, 'GET', 'authorization');

        expect(corsHeaders(response)).toEqual({
            'access-control-allow-origin': APP_ORIGIN,
            'access-control-allow-credentials': 'true',
            'access-control-allow-methods': 'GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS',
            'access-control-allow-headers': 'authorization',
            'content-length': '0',
            vary: 'origin, access-control-request-headers',
        });
    });
});

describe('preflight-cache', () => {
    it('sends max-age and the listed methods and headers', async () => {
        const response = await preflight(preflightCache, '/todos', APP_ORIGIN, 'POST', 'content-type');

        expect(response.status).toBe(204);
        expect(corsHeaders(response)).toEqual({
            'access-control-allow-origin': APP_ORIGIN,
            'access-control-allow-methods': 'GET,POST,DELETE',
            'access-control-allow-headers': 'content-type,authorization',
            'access-control-max-age': '600',
            'content-length': '0',
            vary: 'origin, access-control-request-headers',
        });
    });

    it('sends no preflight headers on the actual request', async () => {
        const response = await preflightCache.fetch(new Request('http://localhost/todos', {
            method: 'POST',
            headers: { origin: APP_ORIGIN },
        }));

        expect(await response.json()).toEqual({ id: 2 });
        expect(corsHeaders(response)).toEqual({
            'access-control-allow-origin': APP_ORIGIN,
            'access-control-expose-headers': '*',
            vary: 'origin',
        });
    });
});

describe('own-preflight', () => {
    it('lets the OPTIONS route answer with the preflight headers', async () => {
        const response = await preflight(ownPreflight, '/upload', APP_ORIGIN, 'PUT');

        expect(response.status).toBe(204);
        expect(response.headers.get('x-upload-limit')).toBe('10mb');
        expect(corsHeaders(response)).toEqual({
            'access-control-allow-origin': '*',
            'access-control-allow-methods': '*',
        });
    });

    it('leaves a preflight without an OPTIONS route to routup', async () => {
        const response = await preflight(ownPreflight, '/other', APP_ORIGIN);

        expect(response.status).toBe(200);
        expect(response.headers.has('allow')).toBe(true);
        expect(response.headers.get('access-control-allow-origin')).toBe('*');
    });
});

describe('single-route', () => {
    it('answers the preflight and decorates the response of one path', async () => {
        const answered = await preflight(singleRoute, '/public', APP_ORIGIN);
        const response = await get(singleRoute, '/public', { origin: APP_ORIGIN });
        const other = await get(singleRoute, '/private', { origin: APP_ORIGIN });

        expect(answered.status).toBe(204);
        expect(answered.headers.get('access-control-allow-origin')).toBe('*');
        expect(await response.text()).toBe('Hello, World!');
        expect(response.headers.get('access-control-allow-origin')).toBe('*');
        expect(other.headers.get('access-control-allow-origin')).toBeNull();
    });
});

describe('manual-headers', () => {
    it('sends the preflight set on a preflight and the response set otherwise', async () => {
        const answered = await preflight(manualHeaders, '/', 'https://other.example');
        const response = await get(manualHeaders, '/', { origin: APP_ORIGIN });

        expect(answered.status).toBe(204);
        expect(corsHeaders(answered)).toEqual({
            'access-control-allow-origin': APP_ORIGIN,
            'access-control-allow-methods': '*',
            'access-control-max-age': '600',
            vary: 'origin',
        });
        expect(corsHeaders(response)).toEqual({
            'access-control-allow-origin': APP_ORIGIN,
            'access-control-expose-headers': '*',
            vary: 'origin',
        });
    });
});

describe('behaviour stated on the pages', () => {
    it('allows every origin by default, also without an Origin header', async () => {
        const app = create();

        expect(corsHeaders(await get(app, '/'))).toEqual({
            'access-control-allow-origin': '*',
            'access-control-expose-headers': '*',
        });
    });

    it('answers a default preflight with 204, methods * and the mirrored request headers', async () => {
        const app = create();
        const response = await preflight(app, '/', APP_ORIGIN, 'PUT', 'content-type,x-trace');

        expect(response.status).toBe(204);
        expect(corsHeaders(response)).toEqual({
            'access-control-allow-origin': '*',
            'access-control-allow-methods': '*',
            'access-control-allow-headers': 'content-type,x-trace',
            'content-length': '0',
            vary: 'access-control-request-headers',
        });
    });

    it('sends no allow-headers on a preflight without request headers', async () => {
        const response = await preflight(create(), '/', APP_ORIGIN);

        expect(response.headers.has('access-control-allow-headers')).toBe(false);
        expect(response.headers.has('vary')).toBe(false);
    });

    it('answers a preflight for a path without a route', async () => {
        const response = await preflight(create(), '/no-route', APP_ORIGIN);

        expect(response.status).toBe(204);
    });

    it('treats an OPTIONS request without Access-Control-Request-Method as an ordinary request', async () => {
        const app = create();
        const response = await app.fetch(new Request('http://localhost/', {
            method: 'OPTIONS',
            headers: { origin: APP_ORIGIN },
        }));

        expect(response.status).toBe(200);
        expect(response.headers.get('allow')).toBe('GET,HEAD');
        expect(response.headers.get('access-control-expose-headers')).toBe('*');
    });

    it('sends no CORS headers when the route returns its own Response', async () => {
        const app = create();

        app.get('/raw', defineCoreHandler(() => new Response('raw')));

        const response = await get(app, '/raw', { origin: APP_ORIGIN });

        expect(await response.text()).toBe('raw');
        expect(corsHeaders(response)).toEqual({});
    });

    it('sends the headers on a Response built with event.response.headers', async () => {
        const app = create();

        app.get('/raw', defineCoreHandler((event) => new Response('raw', { headers: event.response.headers })));

        const response = await get(app, '/raw', { origin: APP_ORIGIN });

        expect(response.headers.get('access-control-allow-origin')).toBe('*');
    });

    it('adds the headers to the 404 and error fallbacks and to an error handler answer', async () => {
        const app = create();

        app.get('/fail', defineCoreHandler(() => {
            throw new Error('boom');
        }));

        const missing = await get(app, '/missing', { origin: APP_ORIGIN });
        const failed = await get(app, '/fail', { origin: APP_ORIGIN });

        app.use(defineErrorHandler(() => ({ error: true })));

        const handled = await get(app, '/fail', { origin: APP_ORIGIN });

        expect(missing.status).toBe(404);
        expect(missing.headers.get('access-control-allow-origin')).toBe('*');
        expect(failed.status).toBe(500);
        expect(failed.headers.get('access-control-allow-origin')).toBe('*');
        expect(await handled.json()).toEqual({ error: true });
        expect(handled.headers.get('access-control-allow-origin')).toBe('*');
    });

    it('overwrites Access-Control-* headers and appends Vary', async () => {
        const app = create({ origin: APP_ORIGIN }, (target) => {
            target.use(defineCoreHandler((event) => {
                event.response.headers.set('vary', 'accept-encoding');
                event.response.headers.set('access-control-allow-origin', 'https://old.example');

                return event.next();
            }));
        });
        const response = await get(app, '/', { origin: APP_ORIGIN });

        expect(response.headers.get('vary')).toBe('accept-encoding, origin');
        expect(response.headers.get('access-control-allow-origin')).toBe(APP_ORIGIN);
    });

    it('sends a fixed string origin to every origin', async () => {
        const response = await get(create({ origin: APP_ORIGIN }), '/', { origin: 'https://other.example' });

        expect(response.headers.get('access-control-allow-origin')).toBe(APP_ORIGIN);
        expect(response.headers.get('vary')).toBe('origin');
    });

    it('sends the string null as is', async () => {
        const response = await get(create({ origin: 'null' }), '/', { origin: 'null' });

        expect(response.headers.get('access-control-allow-origin')).toBe('null');
    });

    it('reflects the request origin with true, and sends none without an Origin header', async () => {
        const app = create({ origin: true });
        const reflected = await get(app, '/', { origin: 'https://any.example' });
        const none = await get(app, '/');

        expect(reflected.headers.get('access-control-allow-origin')).toBe('https://any.example');
        expect(reflected.headers.get('vary')).toBe('origin');
        expect(none.headers.get('access-control-allow-origin')).toBeNull();
    });

    it('matches a RegExp with the g flag the same way on every request', async () => {
        const app = create({ origin: /example\.com$/g });

        for (let i = 0; i < 3; i++) {
            const response = await get(app, '/', { origin: APP_ORIGIN });

            expect(response.headers.get('access-control-allow-origin')).toBe(APP_ORIGIN);
        }
    });

    it('skips CORS with origin false, also for a preflight', async () => {
        const app = create({ origin: false });
        const answered = await preflight(app, '/', APP_ORIGIN);
        const response = await get(app, '/', { origin: APP_ORIGIN });

        expect(answered.status).toBe(200);
        expect(corsHeaders(answered)).toEqual({});
        expect(corsHeaders(response)).toEqual({});
    });

    it('treats [\'*\'] like \'*\' and omits a header for an empty list', async () => {
        const app = create({
            methods: [],
            allowHeaders: ['*'],
            exposeHeaders: [],
        });
        const answered = await preflight(app, '/', APP_ORIGIN, 'POST', 'x-trace');
        const response = await get(app, '/', { origin: APP_ORIGIN });

        expect(corsHeaders(answered)).toEqual({
            'access-control-allow-origin': '*',
            'access-control-allow-headers': 'x-trace',
            'content-length': '0',
            vary: 'access-control-request-headers',
        });
        expect(response.headers.has('access-control-expose-headers')).toBe(false);
    });

    it('mirrors the request headers for an empty allowHeaders list', async () => {
        const response = await preflight(create({ allowHeaders: [] }), '/', APP_ORIGIN, 'POST', 'x-trace');

        expect(response.headers.get('access-control-allow-headers')).toBe('x-trace');
    });

    it('stringifies maxAge and uses preflight.status', async () => {
        const response = await preflight(create({
            maxAge: 86400,
            preflight: { status: 200 },
        }), '/', APP_ORIGIN);

        expect(response.status).toBe(200);
        expect(response.headers.get('access-control-max-age')).toBe('86400');
    });

    it('copies headers set before the plugin into the preflight response', async () => {
        const app = create({}, (target) => {
            target.use(defineCoreHandler((event) => {
                event.response.headers.set('x-request-id', 'abc');

                return event.next();
            }));
        });
        const response = await preflight(app, '/', APP_ORIGIN);

        expect(response.headers.get('x-request-id')).toBe('abc');
    });

    it('warns at install, not per request, for credentials with origin * and exposeHeaders *', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        const plugin = cors({ credentials: true });

        expect(warn).not.toHaveBeenCalled();

        const app = new App();

        app.use(plugin);
        app.get('/', defineCoreHandler(() => 'ok'));

        expect(warn).toHaveBeenCalledTimes(2);

        const response = await get(app, '/', { origin: APP_ORIGIN });

        expect(warn).toHaveBeenCalledTimes(2);
        expect(response.headers.get('access-control-allow-origin')).toBe('*');
        expect(response.headers.get('access-control-allow-credentials')).toBe('true');
        expect(response.headers.get('access-control-expose-headers')).toBe('*');
    });

    it('does not warn from handleCors', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        const app = new App();

        app.use(defineCoreHandler((event) => handleCors(event, { credentials: true }) ?? 'ok'));

        const response = await get(app, '/', { origin: APP_ORIGIN });

        expect(response.headers.get('access-control-allow-credentials')).toBe('true');
        expect(warn).not.toHaveBeenCalled();
    });

    it('installs the same handler with createHandler as with the plugin', async () => {
        const app = new App();

        app.use(createHandler({ origin: [APP_ORIGIN] }));
        app.get('/', defineCoreHandler(() => 'ok'));

        const response = await get(app, '/', { origin: APP_ORIGIN });

        expect(response.headers.get('access-control-allow-origin')).toBe(APP_ORIGIN);
    });
});

describe('helpers stated on the pages', () => {
    it('returns undefined from handleCors for origin false, preflight.continue and ordinary requests', async () => {
        const results: unknown[] = [];
        const app = new App();

        app.use(defineCoreHandler((event) => {
            results.push(handleCors(event, { origin: false }));
            results.push(handleCors(event, { preflight: { continue: true } }));
            results.push(handleCors(event, {}) instanceof Response);

            return 'ok';
        }));

        await preflight(app, '/', APP_ORIGIN);
        await get(app, '/', { origin: APP_ORIGIN });

        expect(results).toEqual([undefined, undefined, true, undefined, undefined, false]);
    });

    it('still adds the other headers from appendCors*Headers with origin false', async () => {
        const app = new App();

        app.use(defineCoreHandler((event) => {
            const options: Options = {
                origin: false,
                credentials: true,
                maxAge: 60,
            };

            if (event.method === 'OPTIONS') {
                appendCorsPreflightHeaders(event, options);
            } else {
                appendCorsHeaders(event, options);
            }

            return 'ok';
        }));

        const answered = await preflight(app, '/', APP_ORIGIN, 'POST', 'x-trace');
        const response = await get(app, '/', { origin: APP_ORIGIN });

        expect(corsHeaders(answered)).toEqual({
            'access-control-allow-credentials': 'true',
            'access-control-allow-methods': 'GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS',
            'access-control-allow-headers': 'x-trace',
            'access-control-max-age': '60',
            vary: 'access-control-request-headers',
        });
        expect(corsHeaders(response)).toEqual({
            'access-control-allow-credentials': 'true',
            'access-control-expose-headers': '*',
        });
    });

    it('evaluates the origin option with isCorsOriginAllowed', () => {
        expect(isCorsOriginAllowed(undefined, {})).toBe(false);
        expect(isCorsOriginAllowed('', {})).toBe(false);
        expect(isCorsOriginAllowed(APP_ORIGIN, { origin: false })).toBe(false);
        expect(isCorsOriginAllowed(APP_ORIGIN, {})).toBe(true);
        expect(isCorsOriginAllowed(APP_ORIGIN, { origin: '*' })).toBe(true);
        expect(isCorsOriginAllowed(APP_ORIGIN, { origin: true })).toBe(true);
        expect(isCorsOriginAllowed(APP_ORIGIN, { origin: APP_ORIGIN })).toBe(true);
        expect(isCorsOriginAllowed('https://other.example', { origin: APP_ORIGIN })).toBe(false);
        expect(isCorsOriginAllowed(APP_ORIGIN, { origin: [/^https:\/\/app\./] })).toBe(true);
    });

    it('fills the defaults and the credentials expansion in resolveOptions', () => {
        expect(resolveOptions()).toEqual({
            origin: '*',
            methods: '*',
            allowHeaders: '*',
            exposeHeaders: '*',
            credentials: false,
            maxAge: false,
            preflight: { status: 204, continue: false },
        });
        expect(resolveOptions({ credentials: true, methods: ['*'] }).methods)
            .toEqual(['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']);
    });
});
