import { App, defineCoreHandler, getRequestHeader } from 'routup';
import { rateLimit } from '@routup/rate-limit';

export const app = new App();

app.use(rateLimit({
    // one quota per API token instead of per IP address
    keyGenerator: (event) => getRequestHeader(event, 'x-api-key') ?? 'anonymous',
}));

app.get('/', defineCoreHandler(() => 'Hello, World!'));
