import { describe, expect, it } from 'vitest';
import type { IAppEvent } from 'routup';
import {
    App,
    defineCoreHandler,
    defineErrorHandler,
} from 'routup';
import type { MetricValueWithName } from 'prom-client';
import { Registry } from 'prom-client';
import type { OptionsInput } from '../../src';
import { MetricName, prometheus } from '../../src';
import { buildPathLabel } from '../../src/utils/path';

type Observation = {
    method: string, 
    path: string, 
    status_code: number | string 
};

function createRequest(url: string, options?: RequestInit): Request {
    return new Request(`http://localhost${url}`, options);
}

function createApp(options: OptionsInput = {}): { app: App, registry: Registry } {
    const registry = new Registry();
    const app = new App();

    app.use(prometheus({
        registry,
        uptime: false,
        ...options,
    }));

    return { app, registry };
}

async function readObservations(registry: Registry): Promise<Observation[]> {
    const metric = registry.getSingleMetric(MetricName.REQUEST_DURATION);

    if (!metric) {
        return [];
    }

    const { values } = await metric.get();

    return values
        .filter((value) => (value as MetricValueWithName<string>).metricName === `${MetricName.REQUEST_DURATION}_count` &&
            value.value > 0)
        .map((value) => value.labels as Observation);
}

async function readPaths(registry: Registry): Promise<string[]> {
    const observations = await readObservations(registry);

    return observations.map((observation) => observation.path);
}

describe('src/handler: path label', () => {
    it('should label a matched route by its pattern', async () => {
        const { app, registry } = createApp();

        app.get('/users/:id', defineCoreHandler((event) => event.params.id));

        await app.fetch(createRequest('/users/1'));
        await app.fetch(createRequest('/users/2'));

        const observations = await readObservations(registry);

        expect(observations).toHaveLength(1);
        expect(observations[0]).toMatchObject({ method: 'GET', path: '/users/:id' });
    });

    it('should label a route of a nested mount by its full pattern', async () => {
        const { app, registry } = createApp();

        const notes = new App();

        notes.get('/:id', defineCoreHandler((event) => event.params.id));

        const api = new App();

        api.use('/notes', notes);

        app.use('/api', api);

        const response = await app.fetch(createRequest('/api/notes/42'));

        expect(response.status).toEqual(200);

        expect(await readPaths(registry)).toEqual(['/api/notes/:id']);
    });

    it('should label a route of a child app with a path option by its full pattern', async () => {
        const { app, registry } = createApp();

        // the shape a decorated controller mounts: a child app carrying its own prefix
        const controller = new App({ path: '/users' });

        controller.get('/:id', defineCoreHandler((event) => event.params.id));
        controller.post('/', defineCoreHandler(() => 'created'));

        app.use('/api', controller);

        await app.fetch(createRequest('/api/users/7'));
        await app.fetch(createRequest('/api/users', { method: 'POST' }));

        const paths = await readPaths(registry);

        expect(paths.sort()).toEqual(['/api/users', '/api/users/:id']);
    });

    it('should keep the raw path for a request without a route', async () => {
        const { app, registry } = createApp();

        app.get('/users/:id', defineCoreHandler((event) => event.params.id));

        await app.fetch(createRequest('/missing/1'));

        expect(await readPaths(registry)).toEqual(['/missing/1']);
    });

    it('should label a request without a route with unmatchedPath', async () => {
        const { app, registry } = createApp({ unmatchedPath: '<unmatched>' });

        app.get('/users/:id', defineCoreHandler((event) => event.params.id));

        await app.fetch(createRequest('/missing/1'));
        await app.fetch(createRequest('/missing/2'));
        await app.fetch(createRequest('/users/3'));

        const paths = await readPaths(registry);

        expect(paths.sort()).toEqual(['/users/:id', '<unmatched>']);
    });

    it('should label a request only middleware answered as unmatched', async () => {
        const { app, registry } = createApp({ unmatchedPath: '<unmatched>' });

        app.use('/static', defineCoreHandler(() => 'file'));

        const response = await app.fetch(createRequest('/static/a.css'));

        expect(response.status).toEqual(200);

        expect(await readPaths(registry)).toEqual(['<unmatched>']);
    });

    it('should let normalizePath win and see the route', async () => {
        const seen: (string | undefined)[] = [];
        const { app, registry } = createApp({
            unmatchedPath: '<unmatched>',
            normalizePath: (path, event) => {
                seen.push(event.route?.path);

                return `custom:${path}`;
            },
        });

        app.get('/users/:id', defineCoreHandler((event) => event.params.id));

        await app.fetch(createRequest('/users/5'));
        await app.fetch(createRequest('/missing'));

        expect(seen).toEqual(['/users/:id', undefined]);
        expect((await readPaths(registry)).sort()).toEqual(['custom:/missing', 'custom:/users/5']);
    });

    it('should keep the concrete URL with an identity normalizePath', async () => {
        const { app, registry } = createApp({ normalizePath: (path) => path });

        app.get('/users/:id', defineCoreHandler((event) => event.params.id));

        await app.fetch(createRequest('/users/9'));

        expect(await readPaths(registry)).toEqual(['/users/9']);
    });

    it('should read the label after the handlers ran', async () => {
        const routes: (string | undefined)[] = [];
        const { app, registry } = createApp({
            requestDurationLabelTransformer: (_labels, event) => {
                routes.push(event.route?.path);
            },
        });

        // a middleware after the plugin, so the plugin's event is not the route's event
        app.use(defineCoreHandler((event) => event.next()));

        const users = new App();

        users.get('/:id', defineCoreHandler((event) => event.params.id));
        app.use('/users', users);

        await app.fetch(createRequest('/users/1'));

        expect(routes).toEqual(['/users/:id']);
        expect(await readPaths(registry)).toEqual(['/users/:id']);
    });

    it('should label a route that throws by its pattern', async () => {
        const { app, registry } = createApp();

        app.get('/fail/:id', defineCoreHandler(() => {
            throw new Error('boom');
        }));
        app.use(defineErrorHandler(() => new Response('failed', { status: 500 })));

        await app.fetch(createRequest('/fail/1'));

        expect(await readPaths(registry)).toEqual(['/fail/:id']);
    });

    it('should label a 404 below a method-bound guard with the guard pattern', async () => {
        const { app, registry } = createApp({ unmatchedPath: '<unmatched>' });

        app.get('/admin/*rest', defineCoreHandler((event) => event.next()));

        await app.fetch(createRequest('/admin/nothing'));

        expect(await readPaths(registry)).toEqual(['/admin/*rest']);
    });
});

describe('src/utils/path', () => {
    function createEvent(route?: unknown): IAppEvent {
        return (route === undefined ? {} : { route }) as unknown as IAppEvent;
    }

    it('should fall back to the raw path for an event without route', () => {
        expect(buildPathLabel('/users/1', createEvent(), {})).toEqual('/users/1');
    });

    it('should fall back to unmatchedPath for an event without route', () => {
        expect(buildPathLabel('/users/1', createEvent(), { unmatchedPath: 'none' })).toEqual('none');
    });

    it('should ignore a route without a string path', () => {
        expect(buildPathLabel('/users/1', createEvent({}), {})).toEqual('/users/1');
    });

    it('should use the route path', () => {
        expect(buildPathLabel('/users/1', createEvent({ path: '/users/:id' }), {})).toEqual('/users/:id');
    });
});
