import { App, defineCoreHandler } from 'routup';
import { cors } from '@routup/cors';

export const app = new App();

app.use(cors({
    // a listed origin is reflected; browsers reject '*' on a credentialed request
    origin: ['https://app.example.com'],
    credentials: true,
    // list the headers the script may read; '*' does not apply with credentials
    exposeHeaders: ['x-request-id'],
}));

app.get('/me', defineCoreHandler((event) => {
    event.response.headers.set('x-request-id', crypto.randomUUID());

    return { name: 'Ada' };
}));
