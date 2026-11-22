import { describe, expect, it } from 'vitest';
import {
    App,
    defineCoreHandler,
    defineErrorHandler,
} from 'routup';
import type { MetricValueWithName } from 'prom-client';
import { Registry } from 'prom-client';
import { MetricName, prometheus } from '../../src';

function createApp(): { app: App, registry: Registry } {
    const registry = new Registry();
    const app = new App();

    app.use(prometheus({
        registry,
        uptime: false,
        unmatchedPath: '<unmatched>',
    }));

    return { app, registry };
}

async function readStatusCodes(registry: Registry): Promise<string[]> {
    const metric = registry.getSingleMetric(MetricName.REQUEST_DURATION);

    if (!metric) {
        return [];
    }

    const { values } = await metric.get();

    return values
        .filter((value) => (value as MetricValueWithName<string>).metricName === `${MetricName.REQUEST_DURATION}_count` &&
            value.value > 0)
        .map((value) => String(value.labels.status_code));
}

describe('src/handler: status_code label', () => {
    it('should label a request no route handled with the status the client gets', async () => {
        const { app, registry } = createApp();

        const response = await app.fetch(new Request('http://localhost/nope'));

        expect(response.status).toEqual(404);
        expect(await readStatusCodes(registry)).toEqual(['404']);
    });

    it('should label an unanswered OPTIONS request with the status of the Allow response', async () => {
        const { app, registry } = createApp();

        app.get('/', defineCoreHandler(() => 'ok'));

        const response = await app.fetch(new Request('http://localhost/', { method: 'OPTIONS' }));

        expect(response.status).toEqual(200);
        expect(await readStatusCodes(registry)).toEqual(['200']);
    });

    it('should label a handler error no error handler answered as 404', async () => {
        // routup builds the error response after the pipeline and does not
        // expose the error to middleware, so it cannot be told from a 404
        const { app, registry } = createApp();

        app.get('/', defineCoreHandler(() => {
            throw new Error('boom');
        }));

        const response = await app.fetch(new Request('http://localhost/'));

        expect(response.status).toEqual(500);
        expect(await readStatusCodes(registry)).toEqual(['404']);
    });

    it('should label an answer of an error handler with its status', async () => {
        const { app, registry } = createApp();

        app.get('/', defineCoreHandler(() => {
            throw new Error('boom');
        }));
        app.use(defineErrorHandler((_error, event) => {
            event.response.status = 418;

            return 'teapot';
        }));

        const response = await app.fetch(new Request('http://localhost/'));

        expect(response.status).toEqual(418);
        expect(await readStatusCodes(registry)).toEqual(['418']);
    });

    it('should label a matched route with its status', async () => {
        const { app, registry } = createApp();

        app.post('/', defineCoreHandler((event) => {
            event.response.status = 201;

            return 'created';
        }));

        await app.fetch(new Request('http://localhost/', { method: 'POST' }));

        expect(await readStatusCodes(registry)).toEqual(['201']);
    });
});
