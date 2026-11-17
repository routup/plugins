import { describe, expect, it } from 'vitest';
import { App, defineCoreHandler } from 'routup';
import { basic } from '@routup/basic';
import type { Options } from '@routup/basic';
import * as basicBody from '@routup/basic/body';
import * as basicCookie from '@routup/basic/cookie';
import * as basicQuery from '@routup/basic/query';
import * as body from '@routup/body';
import * as cookie from '@routup/cookie';
import * as query from '@routup/query';
import { app as configure } from '../../../examples/basic/configure';
import { app as quickStart } from '../../../examples/basic/quick-start';

type PostOptions = {
    cookies?: string,
    contentType?: string,
};

function post(path: string, payload: string, options: PostOptions = {}): Request {
    const headers: Record<string, string> = { 'content-type': options.contentType ?? 'application/json' };

    if (options.cookies) {
        headers.cookie = options.cookies;
    }

    return new Request(`http://localhost${path}`, {
        method: 'POST',
        headers,
        body: payload,
    });
}

function readAll(app: App): App {
    app.post('/', defineCoreHandler(async (event) => ({
        item: await body.readRequestBody(event),
        cookies: cookie.useRequestCookies(event),
        query: query.useRequestQuery(event),
    })));

    return app;
}

function create(options?: Options): App {
    const app = new App();

    app.use(basic(options));

    return readAll(app);
}

async function readItem(app: App, request: Request): Promise<unknown> {
    const output = await (await app.fetch(request)).json() as { item: unknown };

    return output.item;
}

const JSON_BODY = JSON.stringify({ name: 'pen' });
const FORM = { contentType: 'application/x-www-form-urlencoded' };

describe('quick-start', () => {
    it('reads the body, a query value and a cookie', async () => {
        const response = await quickStart.fetch(post('/items?page=2', JSON_BODY, { cookies: 'session=abc' }));

        expect(await response.json()).toEqual({
            item: { name: 'pen' },
            page: '2',
            session: 'abc',
        });
    });
});

describe('configure', () => {
    it('parses JSON and forms and cookies, and no query', async () => {
        const response = await configure.fetch(post('/items?page=2', JSON_BODY, { cookies: 'session=abc' }));

        expect(await response.json()).toEqual({
            item: { name: 'pen' },
            cookies: { session: 'abc' },
            query: {},
        });

        expect(await readItem(configure, post('/items', 'name=pen', FORM))).toEqual({ name: 'pen' });
    });

    it('answers 413 for JSON above 1 kb', async () => {
        const response = await configure.fetch(post('/items', JSON.stringify({ name: 'x'.repeat(1100) })));

        expect(response.status).toBe(413);
    });
});

describe('behaviour stated on the pages', () => {
    it('registers all three parsers when no key is set', async () => {
        const response = await create({}).fetch(post('/?page=2', 'name=pen', { ...FORM, cookies: 'session=abc' }));

        expect(await response.json()).toEqual({
            item: { name: 'pen' },
            cookies: { session: 'abc' },
            query: { page: '2' },
        });
    });

    it('registers nothing when the only key is false', async () => {
        const response = await create({ query: false }).fetch(post('/?page=2', JSON_BODY, { cookies: 'session=abc' }));

        expect(await response.json()).toEqual({
            item: {},
            cookies: {},
            query: {},
        });
    });

    it('writes the defaults into the options object passed without keys', () => {
        const options: Options = {};

        basic(options);

        expect(options).toEqual({
            body: true,
            cookie: true,
            query: true,
        });
    });

    it('applies the body defaults one level down', async () => {
        const app = create({ body: { json: { limit: '1kb' } } });

        expect(await readItem(app, post('/', JSON_BODY))).toEqual({ name: 'pen' });
        expect(await readItem(app, post('/', 'name=pen', FORM))).toEqual({});
    });

    it('leaves handlers registered before basic() without parsed values', async () => {
        const app = readAll(new App());

        app.use(basic());

        const response = await app.fetch(post('/?page=2', JSON_BODY, { cookies: 'session=abc' }));

        expect(await response.json()).toEqual({
            item: {},
            cookies: {},
            query: {},
        });
    });

    it('replaces the body options with a second registration', async () => {
        const app = new App();

        app.use(basic());
        app.use(basic({ body: { json: true } }));
        readAll(app);

        expect(await readItem(app, post('/', 'name=pen', FORM))).toEqual({});
    });

    it('re-exports the named exports of the bundled packages under the subpaths', () => {
        const named = (module: object) => Object.keys(module).filter((key) => key !== 'default').sort();

        expect(basicBody.readRequestBody).toBe(body.readRequestBody);
        expect(basicBody.body).toBe(body.body);
        expect(basicCookie.useRequestCookie).toBe(cookie.useRequestCookie);
        expect(basicCookie.setResponseCookie).toBe(cookie.setResponseCookie);
        expect(basicQuery.useRequestQuery).toBe(query.useRequestQuery);
        expect(Object.keys(basicBody).sort()).toEqual(named(body));
        expect(Object.keys(basicCookie).sort()).toEqual(named(cookie));
        expect(Object.keys(basicQuery).sort()).toEqual(named(query));
        // `export *` leaves out the default export
        expect('default' in basicBody).toBe(false);
    });
});
