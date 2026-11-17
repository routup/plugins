import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
    afterEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';
import type { IAppEvent } from 'routup';
import {
    App,
    createError,
    defineCoreHandler,
    defineErrorHandler,
} from 'routup';
import { rateLimit } from '@routup/rate-limit';
import { app as allowlist } from '../../../examples/rate-limit/allowlist';
import { app as customStore, store as perClientStore } from '../../../examples/rate-limit/custom-store';
import { app as failedOnly } from '../../../examples/rate-limit/failed-only';
import { app as jsonHandler } from '../../../examples/rate-limit/json-handler';
import { app as keyByToken } from '../../../examples/rate-limit/key-by-token';
import { app as limitPath } from '../../../examples/rate-limit/limit-path';
import { app as quickStart } from '../../../examples/rate-limit/quick-start';
import { app as readInfo } from '../../../examples/rate-limit/read-info';
import { app as tieredQuota } from '../../../examples/rate-limit/tiered-quota';

// Runs before the samples are imported: their MemoryStore reads the clock
// and starts its reset interval when the module loads.
const NOW = vi.hoisted(() => {
    const now = new Date('2026-01-01T00:00:00.000Z');

    vi.useFakeTimers({ now, toFake: ['Date', 'setInterval', 'clearInterval'] });

    return now;
});

function request(path: string, init: RequestInit & { ip?: string } = {}): Request {
    const { ip, ...rest } = init;
    const output = new Request(`http://localhost${path}`, rest);

    if (ip) {
        Object.defineProperty(output, 'ip', { value: ip });
    }

    return output;
}

async function fetchTimes(app: App, count: number, path = '/', init: RequestInit & { ip?: string } = {}): Promise<Response[]> {
    const output: Response[] = [];

    for (let i = 0; i < count; i++) {
        output.push(await app.fetch(request(path, init)));
    }

    return output;
}

afterEach(() => {
    // every sample uses a window of at most 15 minutes: clear all counters
    vi.advanceTimersByTime(15 * 60 * 1000);
});

describe('read-info', () => {
    // first, so the request falls on the first second of the first window
    it('returns the limit state of the request', async () => {
        const response = await readInfo.fetch(request('/quota'));

        expect(await response.json()).toEqual({
            limit: 100,
            remaining: 99,
            resetTime: new Date(NOW.getTime() + 60_000).toISOString(),
        });
    });
});

describe('quick-start', () => {
    it('sets the RateLimit headers', async () => {
        const response = await quickStart.fetch(request('/'));

        expect(response.status).toBe(200);
        expect(await response.text()).toBe('Hello, World!');
        expect(response.headers.get('ratelimit-limit')).toBe('100');
        expect(response.headers.get('ratelimit-remaining')).toBe('99');
        expect(response.headers.get('ratelimit-reset')).toBe('900');
        expect(response.headers.get('retry-after')).toBeNull();
    });

    it('rejects the 101st request with 429 and Retry-After', async () => {
        const responses = await fetchTimes(quickStart, 101);
        const last = responses.at(-1)!;

        expect(responses[99]!.status).toBe(200);
        expect(responses[99]!.headers.get('ratelimit-remaining')).toBe('0');
        expect(last.status).toBe(429);
        expect(await last.text()).toBe('Too many requests, please try again later.');
        expect(last.headers.get('ratelimit-remaining')).toBe('0');
        expect(last.headers.get('retry-after')).toBe('900');
    });

    it('is the quick start of the README', () => {
        const normalize = (input: string) => input.replace(/\r\n/g, '\n').trim();
        const sample = readFileSync(fileURLToPath(new URL('../../../examples/rate-limit/quick-start.ts', import.meta.url)), 'utf8');
        const readme = readFileSync(fileURLToPath(new URL('../../../../rate-limit/README.md', import.meta.url)), 'utf8');

        expect(normalize(readme)).toContain(normalize(sample));
    });
});

describe('limit-path', () => {
    it('counts only requests below /auth', async () => {
        const home = await limitPath.fetch(request('/'));

        expect(home.headers.get('ratelimit-limit')).toBeNull();

        const responses = await fetchTimes(limitPath, 6, '/auth/login', { method: 'POST' });

        expect(responses[0]!.status).toBe(200);
        expect(await responses[0]!.json()).toEqual({ ok: true });
        expect(responses[0]!.headers.get('ratelimit-limit')).toBe('5');
        expect(responses[0]!.headers.get('ratelimit-remaining')).toBe('4');
        expect(responses[0]!.headers.get('ratelimit-reset')).toBe('60');
        expect(responses[5]!.status).toBe(429);
        expect(responses[5]!.headers.get('ratelimit-limit')).toBe('5');
        expect(responses[5]!.headers.get('ratelimit-remaining')).toBe('0');
        expect(responses[5]!.headers.get('retry-after')).toBe('60');
        expect(await responses[5]!.text()).toBe('Too many requests, please try again later.');

        expect((await limitPath.fetch(request('/'))).status).toBe(200);
    });
});

describe('tiered-quota', () => {
    it('gives premium keys 10 requests and others 5', async () => {
        const premium = await fetchTimes(tieredQuota, 11, '/', { headers: { 'x-api-key': 'premium-key' } });
        const free = await fetchTimes(tieredQuota, 6, '/', { headers: { 'x-api-key': 'free-key' } });

        expect(premium[0]!.headers.get('ratelimit-limit')).toBe('10');
        expect(premium[9]!.status).toBe(200);
        expect(premium[10]!.status).toBe(429);
        expect(free[0]!.headers.get('ratelimit-limit')).toBe('5');
        expect(free[4]!.status).toBe(200);
        expect(free[5]!.status).toBe(429);
    });
});

describe('failed-only', () => {
    const wrong = { method: 'POST', headers: { authorization: 'Bearer wrong' } };
    const right = { method: 'POST', headers: { authorization: 'Bearer valid-token' } };

    it('leaves the quota untouched on a successful login', async () => {
        const response = await failedOnly.fetch(request('/auth/login', right));

        expect(response.status).toBe(200);
        expect(response.headers.get('ratelimit-limit')).toBe('5');
        expect(response.headers.get('ratelimit-remaining')).toBe('5');
    });

    it('does not count successful logins', async () => {
        const [failed] = await fetchTimes(failedOnly, 1, '/auth/login', wrong);

        expect(failed!.status).toBe(401);
        expect(failed!.headers.get('ratelimit-remaining')).toBe('4');

        const succeeded = await fetchTimes(failedOnly, 3, '/auth/login', right);

        expect(succeeded.map((response) => response.status)).toEqual([200, 200, 200]);
        expect(succeeded.map((response) => response.headers.get('ratelimit-remaining'))).toEqual(['4', '4', '4']);
    });

    it('rejects the sixth failed attempt, and then also a correct one', async () => {
        const failed = await fetchTimes(failedOnly, 6, '/auth/login', wrong);

        expect(failed.map((response) => response.status)).toEqual([401, 401, 401, 401, 401, 429]);
        expect((await failedOnly.fetch(request('/auth/login', right))).status).toBe(429);
    });
});

describe('custom-store', () => {
    it('limits per client window and decrements', async () => {
        const responses = await fetchTimes(customStore, 3);

        expect(responses.map((response) => response.status)).toEqual([200, 200, 429]);
        expect(responses[0]!.headers.get('ratelimit-reset')).toBe('60');
        expect(perClientStore.entries.get('127.0.0.1')?.hits).toBe(3);

        perClientStore.decrement('127.0.0.1');
        expect(perClientStore.entries.get('127.0.0.1')?.hits).toBe(2);

        perClientStore.reset('127.0.0.1');
        expect((await customStore.fetch(request('/'))).status).toBe(200);
    });

    it('starts a new window once the old one has passed', async () => {
        await fetchTimes(customStore, 3);
        vi.setSystemTime(Date.now() + 60_000);

        const response = await customStore.fetch(request('/'));

        expect(response.status).toBe(200);
        expect(response.headers.get('ratelimit-remaining')).toBe('1');
    });
});

describe('key-by-token', () => {
    it('keeps one quota per token', async () => {
        const first = await fetchTimes(keyByToken, 6, '/', { headers: { 'x-api-key': 'a' } });
        const other = await keyByToken.fetch(request('/', { headers: { 'x-api-key': 'b' } }));

        expect(first[5]!.status).toBe(429);
        expect(other.status).toBe(200);
        expect(other.headers.get('ratelimit-remaining')).toBe('4');
    });
});

describe('json-handler', () => {
    it('answers a rejected request with JSON', async () => {
        const [, rejected] = await fetchTimes(jsonHandler, 2);

        expect(rejected!.status).toBe(429);
        expect(rejected!.headers.get('retry-after')).toBe('60');
        expect(await rejected!.json()).toEqual({
            error: 'rate_limited',
            resetTime: new Date(Date.now() + 60_000).toISOString(),
        });
    });
});

describe('allowlist', () => {
    it('skips allowed addresses', async () => {
        const allowed = await fetchTimes(allowlist, 6, '/', { ip: '192.168.0.56' });
        const other = await fetchTimes(allowlist, 6, '/', { ip: '10.0.0.1' });

        expect(allowed.map((response) => response.status)).toEqual([200, 200, 200, 200, 200, 200]);
        expect(allowed[0]!.headers.get('ratelimit-limit')).toBeNull();
        expect(other[5]!.status).toBe(429);
    });
});

describe('behaviour stated on the pages', () => {
    it('keys by the X-Forwarded-For address by default', async () => {
        const app = new App();

        app.use(rateLimit({ max: 1 }));
        app.get('/', defineCoreHandler(() => 'ok'));

        const first = await app.fetch(request('/', { ip: '10.0.0.1', headers: { 'x-forwarded-for': '1.1.1.1' } }));
        const second = await app.fetch(request('/', { ip: '10.0.0.1', headers: { 'x-forwarded-for': '2.2.2.2' } }));
        const third = await app.fetch(request('/', { ip: '10.0.0.1', headers: { 'x-forwarded-for': '2.2.2.2' } }));

        expect([first.status, second.status, third.status]).toEqual([200, 200, 429]);
    });

    it('keys every request without a client address as 127.0.0.1', async () => {
        const app = new App();

        app.use(rateLimit({ max: 1 }));
        app.get('/', defineCoreHandler(() => 'ok'));

        const responses = await fetchTimes(app, 2, '/', { headers: { 'x-forwarded-for': '1.1.1.1' } });

        expect(responses[1]!.status).toBe(429);
    });

    it('never rejects with max 0, but still counts and sets headers', async () => {
        const app = new App();

        app.use(rateLimit({ max: 0 }));
        app.get('/', defineCoreHandler(() => 'ok'));

        const responses = await fetchTimes(app, 10);

        expect(responses.every((response) => response.status === 200)).toBe(true);
        expect(responses[9]!.headers.get('ratelimit-limit')).toBe('0');
        expect(responses[9]!.headers.get('ratelimit-remaining')).toBe('0');
    });

    it('resets all counters together, a fixed window from creation', async () => {
        const app = new App();

        app.use(rateLimit({ windowMs: 10_000, max: 2 }));
        app.get('/', defineCoreHandler(() => 'ok'));

        vi.advanceTimersByTime(9_000);
        await fetchTimes(app, 2);
        expect((await app.fetch(request('/'))).status).toBe(429);

        vi.advanceTimersByTime(1_000);

        const responses = await fetchTimes(app, 2);

        expect(responses.map((response) => response.status)).toEqual([200, 200]);
    });

    it('loses the headers when a handler returns a Response object', async () => {
        const app = new App();

        app.use(rateLimit());
        app.get('/', defineCoreHandler(() => new Response('raw')));

        const response = await app.fetch(request('/'));

        expect(response.headers.get('ratelimit-limit')).toBeNull();
    });

    it('judges a thrown error by the error handler, or counts it when none answers', async () => {
        const handled = new App();

        handled.use(rateLimit({ max: 1, skipFailedRequest: true }));
        handled.get('/', defineCoreHandler(() => {
            throw createError({ status: 500 });
        }));
        handled.use(defineErrorHandler((error, event) => {
            event.response.status = 200;

            return 'recovered';
        }));

        const handledResponses = await fetchTimes(handled, 2);

        expect(handledResponses.map((response) => response.status)).toEqual([200, 429]);

        const unhandled = new App();

        unhandled.use(rateLimit({ max: 1, skipSuccessfulRequest: true }));
        unhandled.get('/', defineCoreHandler(() => {
            throw createError({ status: 200 });
        }));

        const unhandledResponses = await fetchTimes(unhandled, 2);

        expect(unhandledResponses.map((response) => response.status)).toEqual([500, 429]);
    });

    it('calls a message function for the default handler', async () => {
        const app = new App();

        app.use(rateLimit({
            max: 1,
            statusCode: 503,
            message: (event: IAppEvent) => ({ path: event.path }),
        }));
        app.get('/x', defineCoreHandler(() => 'ok'));

        const [, rejected] = await fetchTimes(app, 2, '/x');

        expect(rejected!.status).toBe(503);
        expect(await rejected!.json()).toEqual({ path: '/x' });
    });

    it('falls back to the default text when message returns nothing', async () => {
        const app = new App();

        app.use(rateLimit({ max: 1, message: () => null }));
        app.get('/', defineCoreHandler(() => 'ok'));

        const [, rejected] = await fetchTimes(app, 2);

        expect(await rejected!.text()).toBe('Too many requests, please try again later.');
    });

    it('loses the headers when the handler returns a Response object', async () => {
        const app = new App();

        app.use(rateLimit({ max: 1, handler: () => new Response('limited', { status: 429 }) }));
        app.get('/', defineCoreHandler(() => 'ok'));

        const [, rejected] = await fetchTimes(app, 2);

        expect(rejected!.status).toBe(429);
        expect(rejected!.headers.get('retry-after')).toBeNull();
    });

    it('does not call max for skipped requests', async () => {
        const max = vi.fn(() => 5);
        const app = new App();

        app.use(rateLimit({ max, skip: (event) => event.path === '/skip' }));
        app.get('/skip', defineCoreHandler(() => 'ok'));
        app.get('/count', defineCoreHandler(() => 'ok'));

        await app.fetch(request('/skip'));
        expect(max).not.toHaveBeenCalled();

        await app.fetch(request('/count'));
        expect(max).toHaveBeenCalledTimes(1);
    });
});
