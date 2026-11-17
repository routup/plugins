import { App, defineCoreHandler } from 'routup';
import { cors } from '@routup/cors';

const ORIGINS = new Set([
    'https://app.example.com',
    'https://admin.example.com',
]);

export const app = new App();

app.use(cors({
    // the listed origins and every preview deployment
    origin: (origin) => ORIGINS.has(origin) ||
        /^https:\/\/pr-\d+\.preview\.example\.com$/.test(origin),
}));

app.get('/todos', defineCoreHandler(() => [{ id: 1, title: 'Write docs' }]));
