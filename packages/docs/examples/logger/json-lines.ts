import { App, defineCoreHandler } from 'routup';
import { logger } from '@routup/logger';

export const app = new App();

app.use(logger((tokens, event, response) => JSON.stringify({
    method: event.method,
    url: tokens.url?.(event, response),
    status: response?.status,
    ms: Number(tokens['response-time']?.(event, response, '1')),
})));

app.get('/', defineCoreHandler(() => 'Hello, World!'));
