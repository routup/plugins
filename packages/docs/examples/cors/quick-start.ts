import { App, defineCoreHandler } from 'routup';
import { cors } from '@routup/cors';

export const app = new App();

// before the routes: answers preflights and adds the CORS headers
app.use(cors({
    origin: ['https://app.example.com'],
    allowHeaders: ['content-type', 'authorization'],
    exposeHeaders: ['x-request-id'],
}));

app.get('/', defineCoreHandler(() => 'Hello, World!'));
