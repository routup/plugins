import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { IAppEvent } from 'routup';
import { App, defineCoreHandler, defineErrorHandler } from 'routup';
import { body } from '@routup/body';
import type { ParameterType } from '@routup/decorators';
import {
    DBody,
    DContext,
    DController,
    DCookie,
    DCookies,
    DGet,
    DHeader,
    DNext,
    DPath,
    DPost,
    DProduces,
    DQuery,
    DStatus,
    createParameterDecorator,
    decorators,
    getControllerRoutes,
} from '@routup/decorators';
import { describe, expect, it } from 'vitest';
import { app as cart } from '../../../examples/decorators/cart';
import { app as consumes } from '../../../examples/decorators/consumes';
import { app as crud } from '../../../examples/decorators/crud';
import { app as customDecorator } from '../../../examples/decorators/custom-decorator';
import { preset } from '../../../examples/decorators/custom-preset';
import { app as inheritance } from '../../../examples/decorators/inheritance';
import { routes } from '../../../examples/decorators/list-routes';
import { app as middleware } from '../../../examples/decorators/middleware';
import { app as mountControllersSample } from '../../../examples/decorators/mount-controllers';
import { generateDocument } from '../../../examples/decorators/openapi';
import { UserController as PathsController, app as paths } from '../../../examples/decorators/paths';
import { UserController as PrefixUserController, app as prefix } from '../../../examples/decorators/prefix';
import { app as quickStart } from '../../../examples/decorators/quick-start';
import { app as request } from '../../../examples/decorators/request';
import { app as returnValues } from '../../../examples/decorators/return-values';
import { app as status } from '../../../examples/decorators/status';

function call(app: App, urlPath: string, init?: RequestInit): Promise<Response> {
    return app.fetch(new Request(`http://localhost${urlPath}`, init));
}

function postJson(urlPath: string, data: unknown, headers: Record<string, string> = {}): Request {
    return new Request(`http://localhost${urlPath}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...headers },
        body: JSON.stringify(data),
    });
}

describe('quick-start', () => {
    it('answers GET /users/:id with the path parameter', async () => {
        const response = await call(quickStart, '/users/5');

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ id: '5' });
    });

    it('answers no other path', async () => {
        expect((await call(quickStart, '/users')).status).toBe(404);
    });
});

describe('lifecycle', () => {
    it('creates a controller class once, when the plugin is installed, and once per install', () => {
        let created = 0;

        @DController('/count')
        class CountController {
            constructor() {
                created++;
            }

            @DGet('')
            show() {
                return created;
            }
        }

        const plugin = decorators({ controllers: [CountController] });

        expect(created).toBe(0);

        const app = new App();

        app.use(plugin);
        expect(created).toBe(1);

        app.use(plugin);
        expect(created).toBe(2);
    });

    it('adds nothing for a class without decorators', async () => {
        class Plain {
            list() {
                return 'plain';
            }
        }

        const app = new App();

        app.use(decorators({ controllers: [Plain] }));

        expect(app.routes).toEqual([]);
        expect((await call(app, '/')).status).toBe(404);
    });

    it('registers the routes at the position of app.use()', async () => {
        @DController('/items')
        class ItemController {
            @DGet('')
            list() {
                return 'controller';
            }
        }

        const app = new App();

        app.get('/items', defineCoreHandler(() => 'before'));
        app.use(decorators({ controllers: [ItemController] }));
        app.get('/other', defineCoreHandler(() => 'after'));

        expect(await (await call(app, '/items')).text()).toBe('before');
        expect(await (await call(app, '/other')).text()).toBe('after');
    });

    it('reads the metadata the decorators wrote when the class was defined', () => {
        @DController('/late')
        class LateController {
            @DGet('')
            list() {
                return [];
            }
        }

        expect(getControllerRoutes(LateController)).toEqual([{ method: 'GET', path: '/late' }]);
    });
});

describe('what a method returns', () => {
    @DController('/r')
    class ResultController {
        @DStatus(202)
        @DGet('/undefined')
        nothing() {
            return undefined;
        }

        @DStatus(202)
        @DProduces('text/csv')
        @DGet('/throw')
        fail() {
            throw new Error('boom');
        }

        @DGet('/event')
        event(event: IAppEvent) {
            return event.path;
        }

        @DGet('/partial/:id')
        partial(first: unknown, @DPath('id') id: string) {
            return { first: first === undefined ? 'undefined' : 'set', id };
        }

        @DStatus(202)
        @DGet('/own-status')
        ownStatus(@DContext() event: IAppEvent) {
            event.response.status = 200;

            return 'ok';
        }

        @DGet('/null')
        empty() {
            return null;
        }

        @DGet('/forward')
        forward(@DContext() event: IAppEvent) {
            return event.next();
        }

        @DGet('/next')
        next(@DNext() next: () => Promise<Response | undefined>) {
            return next();
        }
    }

    function build(timeout?: number) {
        const app = new App(timeout ? { options: { timeout } } : {});

        app.use(decorators({ controllers: [ResultController] }));
        app.use(defineCoreHandler(() => 'next handler'));

        return app;
    }

    it('leaves the request unanswered on undefined: a timeout answers 408', async () => {
        const response = await call(build(50), '/r/undefined');

        expect(response.status).toBe(408);
    });

    it('answers an error with routup\'s fallback, without @DStatus or @DProduces', async () => {
        const response = await call(build(), '/r/throw');

        expect(response.status).toBe(500);
        expect(response.headers.get('content-type')).toBe('application/json; charset=utf-8');
        expect(await response.json()).toEqual({ status: 500, message: 'boom' });
    });

    it('answers the fallback as plain text when the request does not accept JSON', async () => {
        const response = await call(build(), '/r/throw', { headers: { accept: 'text/html' } });

        expect(response.status).toBe(500);
        expect(response.headers.get('content-type')).toBe('text/plain; charset=utf-8');
        expect(await response.text()).toBe('boom');
    });

    it('keeps @DStatus and @DProduces from an error handler when the value fails to serialize', async () => {
        @DController('/s')
        class SerializeController {
            @DStatus(202)
            @DProduces('application/vnd.api+json')
            @DGet('')
            show() {
                return { count: 1n };
            }
        }

        const app = new App();

        app.use(decorators({ controllers: [SerializeController] }));
        app.use(defineErrorHandler(() => ({ error: 'serialize' })));

        const response = await call(app, '/s');

        expect(response.status).toBe(200);
        expect(response.headers.get('content-type')).toMatch(/^application\/json/);
        expect(await response.json()).toEqual({ error: 'serialize' });
    });

    it('passes the event to a method without parameter decorators', async () => {
        expect(await (await call(build(), '/r/event')).text()).toBe('/r/event');
    });

    it('leaves an undecorated parameter undefined when another one is decorated', async () => {
        expect(await (await call(build(), '/r/partial/7')).json()).toEqual({ first: 'undefined', id: '7' });
    });

    it('applies @DStatus when the method sets the status it already had', async () => {
        expect((await call(build(), '/r/own-status')).status).toBe(202);
    });

    it('answers null with an empty body and status 200', async () => {
        const response = await call(build(), '/r/null');

        expect(response.status).toBe(200);
        expect(await response.text()).toBe('');
    });

    it('hands over to the next handler with event.next()', async () => {
        expect(await (await call(build(), '/r/forward')).text()).toBe('next handler');
    });

    it('injects event.next unbound with @DNext(): calling it throws', async () => {
        const response = await call(build(), '/r/next');

        expect(response.status).toBe(500);
        expect(await response.json()).toMatchObject({ message: expect.stringMatching(/Cannot read properties of undefined/) });
    });
});

describe('paths', () => {
    it('mounts every method under each controller path', async () => {
        expect(await (await call(paths, '/users')).json()).toEqual([{ id: '1' }]);
        expect(await (await call(paths, '/members')).json()).toEqual([{ id: '1' }]);
        expect(await (await call(paths, '/members/3')).json()).toEqual({ id: '3' });
        expect(await (await call(paths, '/users/3')).json()).toEqual({ id: '3' });
    });

    it('joins the paths with a slash', () => {
        expect(getControllerRoutes(PathsController)).toEqual([
            { method: 'GET', path: '/users' },
            { method: 'GET', path: '/users/:id' },
            { method: 'GET', path: '/members' },
            { method: 'GET', path: '/members/:id' },
        ]);
    });

    it('lets an optional group led by a slash replace the slash it adds', async () => {
        @DController('/a')
        class LedBySlash {
            @DGet('{/:id}')
            show(@DPath('id') id: string | undefined) {
                return { id: id ?? null };
            }
        }

        @DController('/b')
        class WithoutSlash {
            @DGet('{:id}')
            show(@DPath('id') id: string | undefined) {
                return { id: id ?? null };
            }
        }

        const app = new App();

        app.use(decorators({ controllers: [LedBySlash, WithoutSlash] }));

        expect(getControllerRoutes(LedBySlash)).toEqual([{ method: 'GET', path: '/a{/:id}' }]);
        expect(getControllerRoutes(WithoutSlash)).toEqual([{ method: 'GET', path: '/b/{:id}' }]);
        expect(await (await call(app, '/a')).json()).toEqual({ id: null });
        expect(await (await call(app, '/a/')).json()).toEqual({ id: null });
        expect(await (await call(app, '/a/5')).json()).toEqual({ id: '5' });

        expect((await call(app, '/b')).status).toBe(404);
        expect(await (await call(app, '/b/')).json()).toEqual({ id: null });
        expect(await (await call(app, '/b/5')).json()).toEqual({ id: '5' });
    });
});

describe('return-values', () => {
    it('answers an object as JSON', async () => {
        const response = await call(returnValues, '/orders');

        expect(response.headers.get('content-type')).toBe('application/json; charset=utf-8');
        expect(await response.json()).toEqual([{ id: 1 }, { id: 2 }]);
    });

    it('answers a string as text', async () => {
        const response = await call(returnValues, '/orders/greeting');

        expect(response.headers.get('content-type')).toBe('text/plain; charset=utf-8');
        expect(await response.text()).toBe('hello');
    });

    it('passes a Response through', async () => {
        const response = await call(returnValues, '/orders/logo');

        expect(response.headers.get('content-type')).toBe('image/png');
        expect(new Uint8Array(await response.arrayBuffer())).toEqual(new Uint8Array([137, 80, 78, 71]));
    });

    it('streams a generator with the @DProduces media type', async () => {
        const response = await call(returnValues, '/orders/export');

        expect(response.status).toBe(200);
        expect(response.headers.get('content-type')).toBe('text/csv');
        expect(await response.text()).toBe('id\n1\n2\n');
    });

    it('answers with the status the method set on the event', async () => {
        const response = await call(returnValues, '/orders', { method: 'POST' });

        expect(response.status).toBe(201);
        expect(await response.json()).toEqual({ message: 'created' });
    });
});

describe('consumes', () => {
    function send(method: string, urlPath: string, contentType: string): Promise<Response> {
        return call(consumes, urlPath, {
            method,
            headers: { 'content-type': contentType },
            body: '{"text":"hi"}',
        });
    }

    it('accepts a declared media type, ignoring parameters', async () => {
        const response = await send('POST', '/notes', 'application/json; charset=utf-8');

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ text: 'hi' });
    });

    it('answers 415 for another media type or none, and 400 for a malformed one', async () => {
        expect((await send('POST', '/notes', 'text/plain')).status).toBe(415);
        expect((await send('POST', '/notes', 'json')).status).toBe(400);

        const response = await call(consumes, '/notes', {
            method: 'POST',
            headers: { 'content-length': '1' },
            body: new Uint8Array([1]),
        });

        expect(response.status).toBe(415);
    });

    it('does not check a request without a body', async () => {
        expect((await call(consumes, '/notes')).status).toBe(200);

        // the Node listener hands a bodiless POST a body stream without
        // framing headers
        expect((await call(consumes, '/notes', {
            method: 'POST',
            body: new ReadableStream({ start: (controller) => controller.close() }),
            duplex: 'half',
        } as RequestInit)).status).toBe(200);

        expect((await call(consumes, '/notes', {
            method: 'POST',
            headers: { 'content-length': '0', 'content-type': 'text/plain' },
        })).status).toBe(200);
    });

    it('accepts the class and the method media types of a route', async () => {
        expect((await send('PUT', '/notes/1', 'application/json')).status).toBe(200);
        expect((await send('PUT', '/notes/1', 'text/markdown')).status).toBe(200);
        expect((await send('PUT', '/notes/1', 'application/xml')).status).toBe(415);
    });
});

describe('status', () => {
    it('answers with the @DStatus code', async () => {
        const response = await call(status, '/jobs', { method: 'POST' });

        expect(response.status).toBe(202);
        expect(response.headers.get('content-type')).toBe('application/json; charset=utf-8');
        expect(await response.json()).toEqual({ id: 'job-1', state: 'queued' });
    });

    it('answers 204 without a body for a returned null', async () => {
        const response = await call(status, '/jobs/job-1', { method: 'DELETE' });

        expect(response.status).toBe(204);
        expect(await response.text()).toBe('');
    });

    it('sets the @DProduces media type as content-type', async () => {
        const response = await call(status, '/jobs/export');

        expect(response.status).toBe(200);
        expect(response.headers.get('content-type')).toBe('text/csv');
        expect(await response.text()).toBe('id,state\njob-1,queued\n');
    });
});

describe('inheritance', () => {
    it('answers the inherited and the own route under the controller path', async () => {
        expect(await (await call(inheritance, '/users/health')).text()).toBe('ok');
        expect(await (await call(inheritance, '/users')).json()).toEqual([]);
    });
});

describe('request', () => {
    it('injects the path parameters, a header, the request and the response accumulator', async () => {
        const response = await call(request, '/files/docs/a.txt', { headers: { 'accept-language': 'de' } });

        expect(response.headers.get('cache-control')).toBe('no-store');
        expect(await response.json()).toEqual({
            name: 'a.txt',
            params: { folder: 'docs', name: 'a.txt' },
            language: 'de',
            method: 'GET',
        });
    });

    it('injects null for a missing header', async () => {
        expect(await (await call(request, '/files/docs/a.txt')).json()).toMatchObject({ language: null });
    });
});

describe('parameters', () => {
    @DController('/p')
    class ParameterController {
        @DPost('')
        create(
            @DBody('name') name: unknown,
            @DQuery('page') page: unknown,
            @DHeader('x-missing') missing: unknown,
        ) {
            return {
                name: name === undefined ? 'undefined' : name,
                page: page === undefined ? 'undefined' : page,
                missing,
            };
        }
    }

    it('injects undefined for a missing body property or query key, null for a missing header', async () => {
        const app = new App();

        app.use(body());
        app.use(decorators({ controllers: [ParameterController] }));

        const response = await app.fetch(postJson('/p', { other: 1 }));

        expect(await response.json()).toEqual({
            name: 'undefined',
            page: 'undefined',
            missing: null,
        });
    });

    it('gives {} for a decorator without a name, undefined with a name, when no parser plugin is registered', async () => {
        @DController('/none')
        class NoParserController {
            @DPost('')
            create(
                @DBody() data: unknown,
                @DQuery() search: unknown,
                @DCookies() cookies: unknown,
                @DBody('name') name: unknown,
                @DQuery('page') page: unknown,
                @DCookie('session') session: unknown,
            ) {
                return {
                    data,
                    search,
                    cookies,
                    named: [name, page, session].map((value) => (value === undefined ? 'undefined' : value)),
                };
            }
        }

        const app = new App();

        app.use(decorators({ controllers: [NoParserController] }));

        const response = await app.fetch(postJson('/none?page=2', { name: 'pen' }, { cookie: 'session=abc' }));

        expect(await response.json()).toEqual({
            data: {},
            search: {},
            cookies: {},
            named: ['undefined', 'undefined', 'undefined'],
        });
    });

    it('fails the request with the parser error for a malformed body', async () => {
        const app = new App();

        app.use(body());
        app.use(decorators({ controllers: [ParameterController] }));

        const response = await app.fetch(new Request('http://localhost/p', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: '{"name":',
        }));

        expect(response.status).toBe(400);
    });
});

describe('crud', () => {
    it('creates, lists, reads, updates and deletes a todo', async () => {
        let response = await crud.fetch(postJson('/todos', { title: 'Write docs' }));

        expect(response.status).toBe(201);
        expect(await response.json()).toEqual({
            id: '1',
            title: 'Write docs',
            done: false,
        });

        expect(await (await call(crud, '/todos')).json()).toEqual([{
            id: '1',
            title: 'Write docs',
            done: false,
        }]);
        expect(await (await call(crud, '/todos/1')).json()).toEqual({
            id: '1',
            title: 'Write docs',
            done: false,
        });

        response = await crud.fetch(new Request('http://localhost/todos/1', {
            method: 'PATCH',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ done: true }),
        }));
        expect(await response.json()).toEqual({
            id: '1',
            title: 'Write docs',
            done: true,
        });

        response = await call(crud, '/todos/1', { method: 'DELETE' });
        expect(response.status).toBe(204);

        response = await call(crud, '/todos/1');
        expect(response.status).toBe(404);
        expect(await response.json()).toEqual({ status: 404, message: 'todo 1 not found' });
    });

    it('rejects a todo without a title', async () => {
        const response = await crud.fetch(postJson('/todos', {}));

        expect(response.status).toBe(400);
        expect(await response.json()).toEqual({ status: 400, message: 'title must be a non-empty string' });
    });
});

describe('middleware', () => {
    const token = { authorization: 'Bearer secret' };

    it('rejects a request without the token', async () => {
        const response = await call(middleware, '/account');

        expect(response.status).toBe(401);
        expect(await response.json()).toEqual({ status: 401, message: 'Unauthorized' });
    });

    it('runs the class and the method middleware for GET /account', async () => {
        const response = await call(middleware, '/account', { headers: token });

        expect(response.headers.get('x-audited')).toBe('true');
        expect(await response.json()).toEqual({ user: 'ada' });
    });

    it('runs only the class middleware for another route', async () => {
        const response = await call(middleware, '/account/settings', { headers: token });

        expect(response.headers.get('x-audited')).toBeNull();
        expect(await response.json()).toEqual({ theme: 'dark' });
    });

    it('runs the class middleware also for a path under the controller that no method answers', async () => {
        expect((await call(middleware, '/account/unknown')).status).toBe(401);
        expect((await call(middleware, '/account/unknown', { headers: token })).status).toBe(404);
        expect((await call(middleware, '/account', { method: 'DELETE' })).status).toBe(401);
    });

    it('fails the request for a middleware class without run()', async () => {
        class NoRun {}

        @DController('/n', [NoRun])
        class NoRunController {
            @DGet('')
            show() {
                return 'ok';
            }
        }

        const app = new App();

        app.use(decorators({ controllers: [NoRunController] }));

        expect((await call(app, '/n')).status).toBe(500);
    });

    it('creates a middleware instance per request', async () => {
        let created = 0;

        class Count {
            constructor() {
                created++;
            }

            run(event: IAppEvent) {
                return event.next();
            }
        }

        @DController('/c', [Count])
        class CountController {
            @DGet('')
            show() {
                return 'ok';
            }
        }

        const app = new App();

        app.use(decorators({ controllers: [CountController] }));
        expect(created).toBe(0);

        await call(app, '/c');
        await call(app, '/c');
        expect(created).toBe(2);
    });
});

describe('cart', () => {
    it('injects all cookies and the whole query', async () => {
        const response = await call(cart, '/cart?filter[sku]=pen', { headers: { cookie: 'cart=c-42' } });

        expect(await response.json()).toEqual({ cart: 'c-42', query: { filter: { sku: 'pen' } } });
    });

    it('injects the body, one query key and one cookie', async () => {
        const response = await cart.fetch(postJson('/cart/items?currency=USD', { sku: 'pen', quantity: 2 }, { cookie: 'cart=c-42' }));

        expect(await response.json()).toEqual({
            cart: 'c-42',
            item: { sku: 'pen', quantity: 2 },
            currency: 'USD',
        });
    });
});

describe('prefix', () => {
    it('mounts the controllers under the path of app.use()', async () => {
        expect(await (await call(prefix, '/api/v1/users')).json()).toEqual([{ id: '1' }]);
        expect(await (await call(prefix, '/api/v1/teams')).json()).toEqual([{ id: 't1' }]);
        expect((await call(prefix, '/users')).status).toBe(404);
    });

    it('lists the paths without the mount prefix', () => {
        expect(getControllerRoutes(PrefixUserController)).toEqual([{ method: 'GET', path: '/users' }]);
    });
});

describe('without @DController()', () => {
    it('mounts the methods of the class at the root of the app', async () => {
        class Health {
            @DGet('/health')
            check() {
                return { ok: true };
            }
        }

        const app = new App();

        app.use(decorators({ controllers: [Health] }));

        expect(await (await call(app, '/health')).json()).toEqual({ ok: true });
        expect(getControllerRoutes(Health)).toEqual([{ method: 'GET', path: '/health' }]);
    });
});

describe('list-routes', () => {
    it('lists the method-bound routes, per controller path', () => {
        expect(routes).toEqual([
            { method: 'GET', path: '/users' },
            { method: 'POST', path: '/users/:id/invite' },
            { method: 'GET', path: '/members' },
            { method: 'POST', path: '/members/:id/invite' },
        ]);
    });

    it('answers an empty list for a class without decorators', () => {
        class Plain {}

        expect(getControllerRoutes(Plain)).toEqual([]);
    });
});

describe('mount-controllers', () => {
    it('mounts a class and an instance', async () => {
        expect(await (await call(mountControllersSample, '/health')).json()).toEqual({ ok: true });
        expect(await (await call(mountControllersSample, '/version')).json()).toEqual({ version: '1.4.0' });
    });
});

describe('custom-decorator', () => {
    it('routes OPTIONS requests to the method', async () => {
        const response = await call(customDecorator, '/uploads', { method: 'OPTIONS' });

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ methods: ['OPTIONS', 'PUT'] });
    });
});

describe('createParameterDecorator', () => {
    it('fails the request for a type that is not a ParameterType value', async () => {
        @DController('/t')
        class TypeController {
            @DGet('')
            show(@createParameterDecorator('nope' as `${ParameterType}`) value: unknown) {
                return { value };
            }
        }

        const app = new App();

        app.use(decorators({ controllers: [TypeController] }));

        const response = await call(app, '/t');

        expect(response.status).toBe(500);
        expect(await response.json()).toMatchObject({ message: 'Parameter nope could not be extracted.' });
    });
});

describe('custom-preset', () => {
    it('drops the @DHeaders() handler and keeps @DHeader()', () => {
        const names = preset.parameters!.map((handler) => handler.match.name);

        expect(names).not.toContain('DHeaders');
        expect(names).toContain('DHeader');
    });
});

describe('openapi', () => {
    const cwd = fileURLToPath(new URL('../../../examples/decorators/openapi', import.meta.url));

    it('documents the controller', async () => {
        const spec = await generateDocument(path.resolve(cwd)) as Record<string, any>;
        const show = spec.paths['/users/{id}'].get;
        const create = spec.paths['/users'].post;

        expect(spec.openapi).toBe('3.2.0');
        expect(show.tags).toEqual(['users']);
        expect(show.security).toEqual([{ bearer: ['users:read'] }]);
        expect(Object.keys(show.responses).sort()).toEqual(['200', '401', '404']);
        expect(show.responses['404'].description).toBe('No such user');
        expect(show.responses['401'].description).toBe('Unauthorized');
        expect(Object.keys(create.responses).sort()).toEqual(['201', '401']);
        expect(create.responses['201'].description).toBe('Created');
        expect(show.responses['200'].content['application/json'].schema).toEqual({ $ref: '#/components/schemas/User' });
        expect(show.parameters).toHaveLength(1);
        expect(show.parameters[0]).toMatchObject({
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' },
        });
        expect(create.requestBody.content['application/json'].schema).toEqual({ $ref: '#/components/schemas/UserInput' });
    }, 30_000);
});
