import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';
import type { LabelValues, OpenMetricsContentType } from 'prom-client';
import { Registry, register } from 'prom-client';
import {
    App,
    defineCoreHandler,
    defineErrorHandler,
} from 'routup';
import {
    MetricName,
    MetricTypeName,
    buildOptions,
    prometheus,
} from '@routup/prometheus';
import type { OptionsInput } from '@routup/prometheus';
import { app as buckets, registry as bucketsRegistry } from '../../../examples/prometheus/buckets';
import { app as customMetrics, registry as customMetricsRegistry } from '../../../examples/prometheus/custom-metrics';
import { app as defaultMetrics, registry as defaultMetricsRegistry } from '../../../examples/prometheus/default-metrics';
import {
    internal,
    app as internalPublic,
    registry as internalRegistry,
} from '../../../examples/prometheus/internal-app';
import { app as labels, registry as labelsRegistry } from '../../../examples/prometheus/labels';
import { app as protect, registry as protectRegistry } from '../../../examples/prometheus/protect';
import { app as quickStart } from '../../../examples/prometheus/quick-start';
import { app as summary, registry as summaryRegistry } from '../../../examples/prometheus/summary';

// Every sample registers its metrics once, on import, on its own registry;
// only quick-start uses prom-client's global `register`. Before each test,
// prom-client's Registry#resetMetrics() sets every value back to zero.
// Apps built inside a test get a new Registry.
const SAMPLE_REGISTRIES = [
    register,
    bucketsRegistry,
    customMetricsRegistry,
    defaultMetricsRegistry,
    internalRegistry,
    labelsRegistry,
    protectRegistry,
    summaryRegistry,
];

beforeEach(() => {
    SAMPLE_REGISTRIES.forEach((registry) => registry.resetMetrics());
});

afterEach(() => {
    delete process.env.METRICS_TOKEN;
    vi.restoreAllMocks();
});

function get(app: App, path: string, init: RequestInit = {}): Promise<Response> {
    return app.fetch(new Request(`http://localhost${path}`, init));
}

/**
 * Observation counts of the request duration metric, one entry per label
 * set, such as `GET /users/:id 200`.
 */
async function counts(registry: Registry, name = 'http_request_duration'): Promise<Record<string, number>> {
    const metric = registry.getSingleMetric(name);
    const output: Record<string, number> = {};

    if (!metric) {
        return output;
    }

    const { values } = await metric.get();

    for (const value of values) {
        const metricName = (value as { metricName?: string }).metricName ?? name;

        if (metricName === `${name}_count`) {
            const {
                method,
                path,
                status_code: status,
                ...rest
            } = value.labels as LabelValues<string>;
            const extra = Object.entries(rest).map(([key, item]) => ` ${key}=${item}`).join('');

            output[`${method} ${path} ${status}${extra}`] = value.value;
        }
    }

    return output;
}

function create(input: OptionsInput, setup?: (app: App) => void): { app: App, registry: Registry } {
    const registry = new Registry();
    const app = new App();

    app.use(prometheus({ ...input, registry }));
    setup?.(app);

    return { app, registry };
}

describe('quick-start', () => {
    it('labels requests by the route pattern and serves /metrics', async () => {
        await get(quickStart, '/users/1');
        await get(quickStart, '/users/2');

        const response = await get(quickStart, '/metrics');
        const text = await response.text();

        expect(response.headers.get('content-type')).toBe('text/plain; version=0.0.4; charset=utf-8');
        expect(text).toContain('# TYPE http_uptime gauge');
        expect(text).toContain('# TYPE http_request_duration histogram');
        expect(text).toContain('http_request_duration_count{status_code="200",method="GET",path="/users/:id"} 2');
        expect(text).toMatch(/^http_uptime \d+$/m);
    });
});

describe('labels', () => {
    it('adds the static label, maps HEAD to GET, collapses unmatched paths and skips health checks', async () => {
        await get(labels, '/users/1', { method: 'HEAD' });
        await get(labels, '/nope');
        await get(labels, '/other');
        await get(labels, '/health');

        expect(await counts(labelsRegistry)).toEqual({
            'GET /users/:id 200 service=api': 1,
            'GET <unmatched> 200 service=api': 2,
        });
    });
});

describe('buckets', () => {
    it('uses the given buckets', async () => {
        await get(buckets, '/');

        const text = await bucketsRegistry.metrics();

        expect(text.match(/le="[^"]+"/g)).toEqual([
            'le="0.005"',
            'le="0.01"',
            'le="0.05"',
            'le="0.1"',
            'le="0.5"',
            'le="1"',
            'le="+Inf"',
        ]);
    });
});

describe('summary', () => {
    it('records a summary with the given percentiles', async () => {
        await get(summary, '/');

        const text = await summaryRegistry.metrics();

        expect(text).toContain('# TYPE http_request_duration summary');
        expect(text.match(/quantile="[^"]+"/g)).toEqual(['quantile="0.5"', 'quantile="0.9"', 'quantile="0.99"']);
    });
});

describe('protect', () => {
    it('answers 401 without the token, also below /metrics', async () => {
        process.env.METRICS_TOKEN = 'scrape-secret';

        const missing = await get(protect, '/metrics');
        const wrong = await get(protect, '/metrics/x', { headers: { authorization: 'Bearer nope' } });

        expect(missing.status).toBe(401);
        expect(wrong.status).toBe(401);
    });

    it('answers 401 when no token is configured', async () => {
        const response = await get(protect, '/metrics', { headers: { authorization: 'Bearer undefined' } });

        expect(response.status).toBe(401);
    });

    it('serves the metrics with the token and does not time rejected scrapes', async () => {
        process.env.METRICS_TOKEN = 'scrape-secret';

        await get(protect, '/metrics');
        await get(protect, '/');

        const response = await get(protect, '/metrics', { headers: { authorization: 'Bearer scrape-secret' } });

        const text = await response.text();

        expect(response.status).toBe(200);
        expect(text).toContain('http_request_duration_count{status_code="200",method="GET",path="/"} 1');
        expect(text).not.toContain('path="/metrics"');
    });
});

describe('internal-app', () => {
    it('times the public app, which has no metrics endpoint, and serves the metrics internally', async () => {
        await get(internalPublic, '/');

        const publicMetrics = await get(internalPublic, '/metrics');
        const response = await get(internal, '/metrics');

        expect(publicMetrics.status).toBe(404);
        expect(await response.text()).toContain('http_request_duration_count{status_code="200",method="GET",path="/"} 1');
    });
});

describe('custom-metrics', () => {
    it('serves the custom counter next to the built-in metrics', async () => {
        await customMetrics.fetch(new Request('http://localhost/orders', { method: 'POST' }));

        const text = await (await get(customMetrics, '/metrics')).text();

        expect(text).toContain('orders_created_total{region="eu"} 1');
        expect(text).toContain('http_request_duration_count{status_code="200",method="POST",path="/orders"} 1');
    });
});

describe('default-metrics', () => {
    it('collects the process metrics into the given registry', async () => {
        const text = await (await get(defaultMetrics, '/metrics')).text();

        expect(text).toContain('# TYPE process_cpu_user_seconds_total counter');
        expect(text).toContain('# TYPE nodejs_heap_size_used_bytes gauge');
    });
});

describe('behaviour stated on the pages', () => {
    it('labels a nested route with its full pattern and keeps the URL with normalizePath', async () => {
        const users = new App();

        users.get('/:id', defineCoreHandler(() => 'ok'));

        const pattern = create({}, (app) => app.use('/api/users', users));
        const concrete = create({ normalizePath: (path) => path }, (app) => app.use('/api/users', users));

        await get(pattern.app, '/api/users/42');
        await get(concrete.app, '/api/users/42');

        expect(await counts(pattern.registry)).toEqual({ 'GET /api/users/:id 200': 1 });
        expect(await counts(concrete.registry)).toEqual({ 'GET /api/users/42 200': 1 });
    });

    it('labels an unmatched request with its raw path when unmatchedPath is unset', async () => {
        const { app, registry } = create({});

        await get(app, '/a');
        await get(app, '/b');

        expect(await counts(registry)).toEqual({
            'GET /a 200': 1,
            'GET /b 200': 1,
        });
    });

    it('labels answers of middleware, a method-less mount and routup\'s OPTIONS answer as unmatched', async () => {
        const { app, registry } = create({ unmatchedPath: '<unmatched>' }, (target) => {
            target.use('/static', defineCoreHandler(() => 'file'));
            target.use(defineCoreHandler((event) => (event.path === '/ping' ? 'pong' : event.next())));
            target.get('/users', defineCoreHandler(() => []));
        });

        await get(app, '/static/app.js');
        await get(app, '/ping');

        const options = await get(app, '/users', { method: 'OPTIONS' });

        expect(options.headers.get('allow')).toBe('GET,HEAD');
        expect(await counts(registry)).toEqual({
            'GET <unmatched> 200': 2,
            'OPTIONS <unmatched> 200': 1,
        });
    });

    it('labels a 404 behind a method-bound guard with the guard pattern', async () => {
        const { app, registry } = create({ unmatchedPath: '<unmatched>' }, (target) => {
            target.get('/admin/*rest', defineCoreHandler((event) => event.next()));
        });

        const response = await get(app, '/admin/users');

        expect(response.status).toBe(404);
        expect(await counts(registry)).toEqual({ 'GET /admin/*rest 200': 1 });
    });

    it('records status 200 for an error or a 404 without an error handler, the real status with one', async () => {
        const { app, registry } = create({}, (target) => {
            target.get('/fail', defineCoreHandler(() => {
                throw new Error('boom');
            }));
            target.get('/created', defineCoreHandler((event) => {
                event.response.status = 201;

                return 'created';
            }));
        });

        expect((await get(app, '/fail')).status).toBe(500);
        expect((await get(app, '/missing')).status).toBe(404);
        await get(app, '/created');

        app.use(defineErrorHandler((_error, event) => {
            event.response.status = 503;

            return 'unavailable';
        }));
        await get(app, '/fail');

        expect(await counts(registry)).toEqual({
            'GET /fail 200': 1,
            'GET /missing 200': 1,
            'GET /created 201': 1,
            'GET /fail 503': 1,
        });
    });

    it('serves the metrics for every method and sub-path and times the scrape as unmatched', async () => {
        const { app, registry } = create({ unmatchedPath: '<unmatched>' });

        const post = await get(app, '/metrics', { method: 'POST' });
        const sub = await get(app, '/metrics/x');

        expect(post.status).toBe(200);
        expect(sub.status).toBe(200);
        expect(await counts(registry)).toEqual({
            'POST <unmatched> 200': 1,
            'GET <unmatched> 200': 1,
        });
    });

    it('does not time a request a handler before the plugin answered', async () => {
        const registry = new Registry();
        const app = new App();

        app.get('/early', defineCoreHandler(() => 'early'));
        app.use(prometheus({ registry }));
        app.get('/late', defineCoreHandler(() => 'late'));

        await get(app, '/early');
        await get(app, '/late');

        expect(await counts(registry)).toEqual({ 'GET /late 200': 1 });
    });

    it('fails the request when the transformer sets an undeclared label', async () => {
        const { app } = create({
            requestDurationLabelTransformer: (values) => {
                values.region = 'eu';
            },
        }, (target) => {
            target.get('/', defineCoreHandler(() => 'ok'));
        });

        const response = await get(app, '/');

        expect(response.status).toBe(500);
    });

    it('throws at app.use() when the metrics already exist on the registry', () => {
        const registry = new Registry();

        new App().use(prometheus({ registry }));

        expect(() => new App().use(prometheus({ registry }))).toThrow('has already been registered');
    });

    it('uses the default histogram buckets and summary percentiles', async () => {
        const histogram = create({}, (target) => {
            target.get('/', defineCoreHandler(() => 'ok'));
        });
        const summaryApp = create({ requestDurationType: 'summary' }, (target) => {
            target.get('/', defineCoreHandler(() => 'ok'));
        });

        await get(histogram.app, '/');
        await get(summaryApp.app, '/');

        expect((await histogram.registry.metrics()).match(/le="[^"]+"/g)).toEqual([
            'le="0.003"',
            'le="0.03"',
            'le="0.1"',
            'le="0.3"',
            'le="1.5"',
            'le="10"',
            'le="+Inf"',
        ]);
        expect((await summaryApp.registry.metrics()).match(/quantile="[^"]+"/g)).toEqual([
            'quantile="0.5"',
            'quantile="0.75"',
            'quantile="0.95"',
            'quantile="0.98"',
            'quantile="0.99"',
            'quantile="0.999"',
        ]);
    });

    it('reports uptime in whole seconds since the install, not since prometheus() was called', async () => {
        const now = vi.spyOn(performance, 'now').mockReturnValue(5_000);
        const registry = new Registry();
        const plugin = prometheus({ requestDuration: false, registry });

        now.mockReturnValue(10_000);
        new App().use(plugin);
        now.mockReturnValue(12_999);

        expect(await registry.metrics()).toMatch(/^http_uptime 2$/m);
    });

    it('uses the given names, turns metrics off and ignores uptimeLabels', async () => {
        const named = create({
            uptimeName: 'app_uptime',
            requestDurationName: 'app_request_duration',
            uptimeLabels: { app: 'shop' },
        }, (target) => {
            target.get('/', defineCoreHandler(() => 'ok'));
        });
        const off = create({ uptime: false, requestDuration: false });

        await get(named.app, '/');

        const text = await named.registry.metrics();

        expect(text).toMatch(/^app_uptime \d+$/m);
        expect(await counts(named.registry, 'app_request_duration')).toEqual({ 'GET / 200': 1 });
        expect((await off.registry.metrics()).trim()).toBe('');
    });

    it('serves the content type of an OpenMetrics registry', async () => {
        const registry = new Registry<OpenMetricsContentType>();
        const app = new App();

        registry.setContentType(Registry.OPENMETRICS_CONTENT_TYPE);

        app.use(prometheus({ registry }));

        const response = await get(app, '/metrics');

        expect(response.headers.get('content-type')).toBe(Registry.OPENMETRICS_CONTENT_TYPE);
    });

    it('collects the default metrics into the global registry without a register field', async () => {
        const before = new Set((await register.getMetricsAsJSON()).map((metric) => metric.name));
        const app = new App();

        app.use(prometheus({ registry: new Registry(), collectDefaultMetrics: {} }));

        const added = (await register.getMetricsAsJSON())
            .map((metric) => metric.name)
            .filter((name) => !before.has(name));

        added.forEach((name) => register.removeSingleMetric(name));

        expect(added).toContain('process_cpu_user_seconds_total');
    });
});

describe('helpers stated on the pages', () => {
    it('applies the defaults in buildOptions', () => {
        const options = buildOptions();

        expect(options).toMatchObject({
            metricsPath: '/metrics',
            uptime: true,
            uptimeName: 'http_uptime',
            requestDuration: true,
            requestDurationName: 'http_request_duration',
            requestDurationType: 'histogram',
            requestDurationHistogram: {},
            requestDurationSummary: {},
        });
        expect(options.registry).toBe(register);
        expect(options.skip({} as never)).toBe(false);
        expect(MetricName.UPTIME).toBe('http_uptime');
        expect(MetricName.REQUEST_DURATION).toBe('http_request_duration');
        expect(MetricTypeName.SUMMARY).toBe('summary');
    });
});
