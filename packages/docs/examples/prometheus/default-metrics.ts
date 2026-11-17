import { Registry } from 'prom-client';
import { App } from 'routup';
import { prometheus } from '@routup/prometheus';

export const registry = new Registry();

export const app = new App();

app.use(prometheus({
    registry,
    // the same registry, or the process metrics land in prom-client's global one
    collectDefaultMetrics: { register: registry },
}));
