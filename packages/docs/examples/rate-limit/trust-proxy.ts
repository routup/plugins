import { App, defineCoreHandler } from 'routup';
import { rateLimit } from '@routup/rate-limit';

export const app = new App();

app.use(rateLimit({
    // reachable directly: key by the address of the connection
    trustProxy: false,
}));

app.get('/', defineCoreHandler(() => 'Hello, World!'));
