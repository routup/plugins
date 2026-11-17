import { Registry } from 'prom-client';
import { App, defineCoreHandler } from 'routup';
import { prometheus } from '@routup/prometheus';

export const registry = new Registry();

export const app = new App();

app.use(prometheus({
    registry,

    // a static label on every observation; its name joins the label set
    requestDurationLabels: { service: 'api' },

    // one series for all requests no route handled, such as 404s
    unmatchedPath: '<unmatched>',

    // last chance to change the values, per request
    requestDurationLabelTransformer: (labels, event) => {
        if (event.method === 'HEAD') {
            labels.method = 'GET';
        }
    },

    // health checks are not timed
    skip: (event) => event.path === '/health',
}));

app.get('/health', defineCoreHandler(() => 'ok'));
app.get('/users/:id', defineCoreHandler((event) => ({ id: event.params.id })));
