import { Registry } from 'prom-client';
import { App, defineCoreHandler } from 'routup';
import { prometheus } from '@routup/prometheus';

export const registry = new Registry();

export const app = new App();

// before the plugin: it runs first for /metrics and everything below it
app.use('/metrics', defineCoreHandler((event) => {
    const token = process.env.METRICS_TOKEN;

    if (!token || event.headers.get('authorization') !== `Bearer ${token}`) {
        event.response.status = 401;

        return 'Unauthorized';
    }

    return event.next();
}));

app.use(prometheus({ registry }));

app.get('/', defineCoreHandler(() => 'Hello, World!'));
