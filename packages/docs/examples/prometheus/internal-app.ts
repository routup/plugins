import { Registry } from 'prom-client';
import { App, defineCoreHandler } from 'routup';
import { buildOptions, createHandler, registerMetrics } from '@routup/prometheus';

export const registry = new Registry();

// the public app: timed, but without a metrics endpoint
export const app = new App();

registerMetrics(app, buildOptions({ registry }));

app.get('/', defineCoreHandler(() => 'Hello, World!'));

// serve this one on a port that only Prometheus can reach
export const internal = new App();

internal.get('/metrics', createHandler(registry));
