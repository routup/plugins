import { App, defineCoreHandler } from 'routup';
import { cors } from '@routup/cors';

export const app = new App();

app.use(cors({
    origin: ['https://app.example.com'],
    methods: ['GET', 'POST', 'DELETE'],
    allowHeaders: ['content-type', 'authorization'],
    // the browser reuses the preflight answer for 10 minutes
    maxAge: 600,
}));

app.post('/todos', defineCoreHandler(() => ({ id: 2 })));
