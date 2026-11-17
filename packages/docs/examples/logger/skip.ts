import { App, defineCoreHandler } from 'routup';
import { logger } from '@routup/logger';

export const app = new App();

app.use(logger({
    // no line for health checks, and none for redirects and successes
    skip: (event, response) => event.path === '/health' ||
        (!!response && response.status < 400),
}));

app.get('/health', defineCoreHandler(() => 'ok'));
app.get('/', defineCoreHandler(() => 'Hello, World!'));
app.get('/admin', defineCoreHandler((event) => {
    event.response.status = 403;

    return 'Forbidden';
}));
