import { Registry } from 'prom-client';
import { App, defineCoreHandler } from 'routup';
import { prometheus } from '@routup/prometheus';

export const registry = new Registry();

export const app = new App();

app.use(prometheus({
    registry,
    // seconds; spread over the plugin's histogram defaults, replacing its buckets
    requestDurationHistogram: { buckets: [0.005, 0.01, 0.05, 0.1, 0.5, 1] },
}));

app.get('/', defineCoreHandler(() => 'Hello, World!'));
