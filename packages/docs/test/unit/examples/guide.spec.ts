import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';
import { App, defineCoreHandler } from 'routup';
import { basic } from '@routup/basic';
import { body, readRequestBody } from '@routup/body';
import { cookie, useRequestCookies } from '@routup/cookie';
import { cors } from '@routup/cors';
import {
    DBody,
    DController,
    DCookie,
    DCookies,
    DPost,
    DQuery,
    decorators,
} from '@routup/decorators';
import { logger } from '@routup/logger';
import { query, useRequestQuery } from '@routup/query';
import { rateLimit } from '@routup/rate-limit';
import { app as apiStack } from '../../../examples/guide/api-stack';
import { app as decoratorsSample } from '../../../examples/guide/decorators';
import { app as order } from '../../../examples/guide/order';
import { app as separateParsers } from '../../../examples/guide/separate-parsers';
import { app as sharedStore } from '../../../examples/guide/shared-store';
import { app as twoPlugins } from '../../../examples/guide/two-plugins';

// RedisStore creates its client with redis-extension when the sample loads;
// an in-memory client stands in for Redis.
const redis = vi.hoisted(() => {
    const entries = new Map<string, string>();

    return {
        entries,
        client: {
            get: async (key: string) => entries.get(key) ?? null,
            set: async (key: string, value: number) => {
                entries.set(key, String(value));

                return 'OK';
            },
            del: async (key: string) => {
                entries.delete(key);

                return 1;
            },
        },
    };
});

vi.mock('redis-extension', () => ({ createClient: () => redis.client }));

const ORIGIN = 'https://app.example.com';

function request(urlPath: string, init: RequestInit & { ip?: string } = {}): Request {
    const { ip, ...rest } = init;
    const output = new Request(`http://localhost${urlPath}`, rest);

    if (ip) {
        Object.defineProperty(output, 'ip', { value: ip });
    }

    return output;
}

function postJson(urlPath: string, data: unknown, init: RequestInit & { ip?: string } = {}): Request {
    return request(urlPath, {
        ...init,
        method: 'POST',
        headers: { 'content-type': 'application/json', ...init.headers },
        body: JSON.stringify(data),
    });
}

function preflight(urlPath: string, ip: string): Request {
    return request(urlPath, {
        ip,
        method: 'OPTIONS',
        headers: {
            origin: ORIGIN,
            'access-control-request-method': 'POST',
        },
    });
}

describe('two-plugins', () => {
    it('echoes the parsed body with the CORS header', async () => {
        const response = await twoPlugins.fetch(postJson('/echo', { title: 'Write docs' }, { headers: { origin: ORIGIN } }));

        expect(response.status).toBe(200);
        expect(response.headers.get('access-control-allow-origin')).toBe(ORIGIN);
        expect(await response.json()).toEqual({ title: 'Write docs' });
    });
});

describe('order', () => {
    it('does not run a plugin for a route registered before it', async () => {
        const before = await order.fetch(postJson('/before', { title: 'Write docs' }));

        expect(await before.json()).toEqual({});
    });

    it('runs a plugin for a route registered after it', async () => {
        const after = await order.fetch(postJson('/after', { title: 'Write docs' }));

        expect(await after.json()).toEqual({ title: 'Write docs' });
    });
});

describe('separate-parsers', () => {
    it('parses the body under /api, the query and the cookies everywhere', async () => {
        const response = await separateParsers.fetch(postJson('/api/items?page=2', { name: 'pen' }, { headers: { cookie: 'session=abc' } }));

        expect(await response.json()).toEqual({
            item: { name: 'pen' },
            page: '2',
            session: 'abc',
        });
    });

    it('does not parse the body outside /api', async () => {
        const response = await separateParsers.fetch(postJson('/webhook', { name: 'pen' }));

        expect(await response.json()).toEqual({ item: {} });
    });
});

describe('decorators', () => {
    it('fills @DBody, @DQuery and @DCookie from the parser plugins', async () => {
        const response = await decoratorsSample.fetch(postJson('/items?dryRun=true', { name: 'pen' }, { headers: { cookie: 'session=abc' } }));

        expect(await response.json()).toEqual({
            name: 'pen',
            dryRun: 'true',
            session: 'abc',
        });
    });

    it('resolves them to undefined without the parser plugins', async () => {
        @DController('/items')
        class ItemController {
            @DPost('')
            create(
                @DBody('name') name: string | undefined,
                @DQuery('dryRun') dryRun: string | undefined,
                @DCookie('session') session: string | undefined,
            ) {
                return {
                    name: name ?? null,
                    dryRun: dryRun ?? null,
                    session: session ?? null,
                };
            }

            @DPost('/all')
            createAll(
                @DBody() data: unknown,
                @DQuery() search: unknown,
                @DCookies() cookies: unknown,
            ) {
                return {
                    data,
                    search,
                    cookies,
                };
            }
        }

        const app = new App();

        app.use(decorators({ controllers: [ItemController] }));
        // registered after the controller routes: they do not run for them
        app.use(body());
        app.use(query());
        app.use(cookie());

        const response = await app.fetch(postJson('/items?dryRun=true', { name: 'pen' }, { headers: { cookie: 'session=abc' } }));

        expect(await response.json()).toEqual({
            name: null,
            dryRun: null,
            session: null,
        });

        const all = await app.fetch(postJson('/items/all?dryRun=true', { name: 'pen' }, { headers: { cookie: 'session=abc' } }));

        expect(await all.json()).toEqual({
            data: {},
            search: {},
            cookies: {},
        });
    });
});

describe('shared-store', () => {
    beforeEach(() => {
        redis.entries.clear();
    });

    it('counts in Redis', async () => {
        const response = await sharedStore.fetch(request('/', { ip: '10.0.0.1' }));

        expect(response.status).toBe(200);
        expect(response.headers.get('ratelimit-remaining')).toBe('99');
        expect(redis.entries.get('rate-limit:10.0.0.1')).toBe('1');
    });

    it('rejects a client whose count another instance raised', async () => {
        redis.entries.set('rate-limit:10.0.0.2', '100');

        const response = await sharedStore.fetch(request('/', { ip: '10.0.0.2' }));

        expect(response.status).toBe(429);
    });
});

describe('api-stack', () => {
    let lines: string[];

    beforeEach(() => {
        lines = [];
        vi.spyOn(console, 'log').mockImplementation((line: string) => {
            lines.push(line);
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('creates a todo with CORS and rate-limit headers', async () => {
        const response = await apiStack.fetch(postJson('/todos', { title: 'Write docs' }, {
            ip: '10.0.1.1',
            headers: { origin: ORIGIN },
        }));

        expect(response.status).toBe(201);
        expect(await response.json()).toEqual({ title: 'Write docs' });
        expect(response.headers.get('access-control-allow-origin')).toBe(ORIGIN);
        expect(response.headers.get('ratelimit-limit')).toBe('100');
        expect(response.headers.get('ratelimit-remaining')).toBe('99');
        expect(lines).toHaveLength(1);
        expect(lines[0]).toMatch(/^POST \/todos 201 /);
    });

    it('answers a preflight without counting it, and logs it', async () => {
        const response = await apiStack.fetch(preflight('/todos', '10.0.1.2'));

        expect(response.status).toBe(204);
        expect(response.headers.get('access-control-allow-origin')).toBe(ORIGIN);
        expect(response.headers.get('ratelimit-limit')).toBeNull();
        expect(lines[0]).toMatch(/^OPTIONS \/todos 204 /);

        const next = await apiStack.fetch(postJson('/todos', {}, { ip: '10.0.1.2', headers: { origin: ORIGIN } }));

        expect(next.headers.get('ratelimit-remaining')).toBe('99');
    });

    it('sends the 429 with the CORS header, and logs it', async () => {
        let response: Response | undefined;

        for (let i = 0; i < 101; i++) {
            response = await apiStack.fetch(postJson('/todos', {}, { ip: '10.0.1.3', headers: { origin: ORIGIN } }));
        }

        expect(response?.status).toBe(429);
        expect(response?.headers.get('access-control-allow-origin')).toBe(ORIGIN);
        expect(lines.at(-1)).toMatch(/^POST \/todos 429 /);
    });
});

describe('ordering pitfalls', () => {
    it('registers only the parsers basic() names once one is named', async () => {
        const app = new App();

        app.use(basic({ body: true }));
        app.post('/', defineCoreHandler(async (event) => ({
            data: await readRequestBody(event),
            search: useRequestQuery(event),
            cookies: useRequestCookies(event),
        })));

        const response = await app.fetch(postJson('/?page=2', { name: 'pen' }, { headers: { cookie: 'session=abc' } }));

        expect(await response.json()).toEqual({
            data: { name: 'pen' },
            search: {},
            cookies: {},
        });
    });

    it('sends a 429 without CORS headers when rate-limit runs before cors', async () => {
        const app = new App();

        app.use(rateLimit({ windowMs: 60 * 1000, max: 1 }));
        app.use(cors({ origin: ORIGIN }));
        app.post('/todos', defineCoreHandler(() => 'ok'));

        await app.fetch(request('/todos', {
            ip: '10.0.2.1',
            method: 'POST',
            headers: { origin: ORIGIN },
        }));

        const response = await app.fetch(request('/todos', {
            ip: '10.0.2.1',
            method: 'POST',
            headers: { origin: ORIGIN },
        }));

        expect(response.status).toBe(429);
        expect(response.headers.get('access-control-allow-origin')).toBeNull();
    });

    it('counts preflights when rate-limit runs before cors', async () => {
        const app = new App();

        app.use(rateLimit({ windowMs: 60 * 1000, max: 1 }));
        app.use(cors({ origin: ORIGIN }));
        app.post('/todos', defineCoreHandler(() => 'ok'));

        await app.fetch(preflight('/todos', '10.0.2.2'));

        const response = await app.fetch(request('/todos', {
            ip: '10.0.2.2',
            method: 'POST',
            headers: { origin: ORIGIN },
        }));

        expect(response.status).toBe(429);
    });

    it('does not log what a handler before the logger answers', async () => {
        const write = vi.fn();
        const app = new App();

        app.use(rateLimit({ windowMs: 60 * 1000, max: 1 }));
        app.use(logger({ write }));
        app.get('/', defineCoreHandler(() => 'ok'));

        await app.fetch(request('/', { ip: '10.0.2.3' }));

        const response = await app.fetch(request('/', { ip: '10.0.2.3' }));

        expect(response.status).toBe(429);
        expect(write).toHaveBeenCalledTimes(1);
    });

    it('reads the body when body() is registered after the rate limiter', async () => {
        const app = new App();

        app.use(rateLimit({ windowMs: 60 * 1000, max: 1 }));
        app.use(body());
        app.post('/', defineCoreHandler((event) => readRequestBody(event)));

        const response = await app.fetch(postJson('/', { title: 'Write docs' }, { ip: '10.0.2.4' }));

        expect(await response.json()).toEqual({ title: 'Write docs' });
    });
});
