import { describe, expect, it } from 'vitest';
import type { IAppEvent } from 'routup';
import { App, defineCoreHandler } from 'routup';
import {
    cookie,
    hasRequestCookies,
    isObject,
    parseRequestCookies,
    setRequestCookies,
    setResponseCookie,
    unsetResponseCookie,
    useRequestCookie,
    useRequestCookies,
} from '@routup/cookie';
import { app as defaultCookie } from '../../../examples/cookie/default-cookie';
import { app as jsonValue } from '../../../examples/cookie/json-value';
import { app as parseOptions } from '../../../examples/cookie/parse-options';
import { app as quickStart } from '../../../examples/cookie/quick-start';
import { app as session } from '../../../examples/cookie/session';

function request(path: string, cookies?: string, method = 'GET'): Request {
    return new Request(`http://localhost${path}`, {
        method,
        headers: cookies ? { cookie: cookies } : {},
    });
}

function create(fn: (event: IAppEvent) => unknown, withPlugin = true): App {
    const app = new App();

    if (withPlugin) {
        app.use(cookie());
    }

    app.get('/', defineCoreHandler(fn));

    return app;
}

describe('quick-start', () => {
    it('counts the first visit', async () => {
        const response = await quickStart.fetch(request('/'));

        expect(await response.json()).toEqual({ visits: 1 });
        expect(response.headers.get('set-cookie')).toBe('visits=1; Path=/; HttpOnly; SameSite=Lax');
    });

    it('counts on from the cookie', async () => {
        const response = await quickStart.fetch(request('/', 'visits=3'));

        expect(await response.json()).toEqual({ visits: 4 });
        expect(response.headers.get('set-cookie')).toBe('visits=4; Path=/; HttpOnly; SameSite=Lax');
    });
});

describe('session', () => {
    it('sets the session cookie with its attributes', async () => {
        const response = await session.fetch(request('/login', undefined, 'POST'));

        expect(response.headers.get('set-cookie')).toMatch(/^session=[\da-f-]{36}; Max-Age=604800; Path=\/; HttpOnly; Secure; SameSite=Lax$/);
    });

    it('reads the session cookie', async () => {
        expect(await (await session.fetch(request('/me', 'session=abc'))).json()).toEqual({ loggedIn: true });
        expect(await (await session.fetch(request('/me'))).json()).toEqual({ loggedIn: false });
    });

    it('clears the session cookie', async () => {
        const response = await session.fetch(request('/logout', 'session=abc', 'POST'));

        expect(response.headers.get('set-cookie')).toBe('session=; Max-Age=0; Path=/');
    });
});

describe('json-value', () => {
    it('writes the value URI-encoded and reads it back', async () => {
        const write = await jsonValue.fetch(request('/preferences/dark', undefined, 'PUT'));
        const header = write.headers.get('set-cookie')!;

        expect(header).toBe('preferences=%7B%22theme%22%3A%22dark%22%2C%22language%22%3A%22en%22%7D; Max-Age=31536000; Path=/');

        const pair = header.split(';')[0]!;
        const read = await jsonValue.fetch(request('/preferences', pair));

        expect(await read.json()).toEqual({ theme: 'dark', language: 'en' });
    });

    it('falls back for a missing or broken value', async () => {
        expect(await (await jsonValue.fetch(request('/preferences'))).json()).toEqual({ theme: 'light', language: 'en' });
        expect(await (await jsonValue.fetch(request('/preferences', 'preferences=oops'))).json()).toEqual({ theme: 'light', language: 'en' });
    });
});

describe('default-cookie', () => {
    it('provides a default for later handlers', async () => {
        expect(await (await defaultCookie.fetch(request('/'))).json()).toEqual({ locale: 'en' });
        expect(await (await defaultCookie.fetch(request('/', 'locale=fr'))).json()).toEqual({ locale: 'fr' });
    });

    it('sends no cookie to the client', async () => {
        expect((await defaultCookie.fetch(request('/'))).headers.get('set-cookie')).toBeNull();
    });
});

describe('parse-options', () => {
    it('filters names and keeps every value of a repeated name', async () => {
        const response = await parseOptions.fetch(request('/', 'app_tab=a; other=x; app_tab=b; app_id=1'));

        expect(await response.json()).toEqual({ app_tab: ['a', 'b'], app_id: '1' });
    });
});

describe('behaviour stated on the pages', () => {
    it('returns {} and undefined without the plugin', async () => {
        const app = create((event) => ({ all: useRequestCookies(event), one: useRequestCookie(event, 'a') ?? null }), false);

        expect(await (await app.fetch(request('/', 'a=1'))).json()).toEqual({ all: {}, one: null });
    });

    it('keeps the first value of a repeated name', async () => {
        const app = create((event) => useRequestCookies(event));

        expect(await (await app.fetch(request('/', 'a=1; a=2'))).json()).toEqual({ a: '1' });
    });

    it('decodes values and keeps a value that does not decode', async () => {
        const app = create((event) => useRequestCookies(event));

        expect(await (await app.fetch(request('/', 'a=hello%20world; b=%E0%A4%A'))).json()).toEqual({ a: 'hello world', b: '%E0%A4%A' });
    });

    it('does not parse again when cookies are stored already', async () => {
        const app = new App();

        app.use(defineCoreHandler((event) => {
            setRequestCookies(event, { fixed: 'yes' });

            return event.next();
        }));
        app.use(cookie());
        app.get('/', defineCoreHandler((event) => useRequestCookies(event)));

        expect(await (await app.fetch(request('/', 'a=1'))).json()).toEqual({ fixed: 'yes' });
    });

    it('merges one key and replaces with a record', async () => {
        const app = create((event) => {
            setRequestCookies(event, 'b', '2');

            const merged = { ...useRequestCookies(event) };

            setRequestCookies(event, { c: '3' });

            return { merged, replaced: useRequestCookies(event) };
        });

        expect(await (await app.fetch(request('/', 'a=1'))).json()).toEqual({ merged: { a: '1', b: '2' }, replaced: { c: '3' } });
    });

    it('reports whether cookies are stored', async () => {
        const app = create((event) => {
            const before = hasRequestCookies(event);

            setRequestCookies(event, { a: '1' });

            return { before, after: hasRequestCookies(event) };
        }, false);

        expect(await (await app.fetch(request('/'))).json()).toEqual({ before: false, after: true });
    });

    it('parses without storing', async () => {
        const app = create((event) => ({
            parsed: parseRequestCookies(event, { filter: (name) => name !== 'b' }),
            stored: hasRequestCookies(event),
        }), false);

        expect(await (await app.fetch(request('/', 'a=1; b=2'))).json()).toEqual({ parsed: { a: '1' }, stored: false });
    });

    it('appends one Set-Cookie header per call, without the plugin', async () => {
        const app = create((event) => {
            setResponseCookie(event, 'a', '1');
            setResponseCookie(event, 'b', '2', { path: '/admin', domain: 'example.com' });

            return null;
        }, false);

        expect((await app.fetch(request('/'))).headers.getSetCookie()).toEqual([
            'a=1; Path=/',
            'b=2; Domain=example.com; Path=/admin',
        ]);
    });

    it('clears a cookie with the given scope and overrides maxAge', async () => {
        const app = create((event) => {
            unsetResponseCookie(event, 'b', {
                path: '/admin',
                domain: 'example.com',
                maxAge: 3600,
            });

            return null;
        }, false);

        expect((await app.fetch(request('/'))).headers.get('set-cookie')).toBe('b=; Max-Age=0; Domain=example.com; Path=/admin');
    });

    it('ignores the serialize option of the plugin', async () => {
        const app = new App();

        app.use(cookie({ serialize: { httpOnly: true, path: '/other' } }));
        app.get('/', defineCoreHandler((event) => {
            setResponseCookie(event, 'a', '1');

            return null;
        }));

        expect((await app.fetch(request('/'))).headers.get('set-cookie')).toBe('a=1; Path=/');
    });

    it('caps maxAge at 400 days', async () => {
        const app = create((event) => {
            setResponseCookie(event, 'a', '1', { maxAge: 60 * 60 * 24 * 1000 });

            return null;
        }, false);

        expect((await app.fetch(request('/'))).headers.get('set-cookie')).toBe('a=1; Max-Age=34560000; Path=/');
    });

    it('answers 500 for invalid attributes', async () => {
        const app = create((event) => {
            setResponseCookie(event, 'a', '1', { sameSite: 'none' });

            return null;
        }, false);
        const response = await app.fetch(request('/'));

        expect(response.status).toBe(500);
        expect(await response.json()).toEqual({ status: 500, message: 'SameSite=None cookies must have the Secure attribute' });
    });

    it('answers 500 for each invalid attribute value', async () => {
        const cases = [
            { domain: 'exa mple.com' },
            { path: '/a;b' },
            { expires: new Date('invalid') },
            { priority: 'urgent' },
            { sameSite: 'loose' },
            { maxAge: 1.5 },
        ];

        for (const options of cases) {
            const app = create((event) => {
                setResponseCookie(event, 'a', '1', options as Parameters<typeof setResponseCookie>[3]);

                return null;
            }, false);

            expect((await app.fetch(request('/'))).status, JSON.stringify(options)).toBe(500);
        }
    });

    it('drops the cookie when the handler returns a Response', async () => {
        const app = create((event) => {
            setResponseCookie(event, 'a', '1');

            return new Response('raw');
        }, false);

        expect((await app.fetch(request('/'))).headers.get('set-cookie')).toBeNull();
    });

    it('exports isObject as a type guard for plain objects', () => {
        expect(isObject({})).toBe(true);
        expect(isObject([])).toBe(false);
        expect(isObject(null)).toBe(false);
    });
});
