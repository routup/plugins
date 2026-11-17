import { Registry } from 'prom-client';
import { App, defineCoreHandler } from 'routup';
import { prometheus } from '@routup/prometheus';

export const registry = new Registry();

export const app = new App();

app.use(prometheus({
    registry,
    requestDurationType: 'summary',
    requestDurationSummary: { percentiles: [0.5, 0.9, 0.99] },
}));

app.get('/', defineCoreHandler(() => 'Hello, World!'));
