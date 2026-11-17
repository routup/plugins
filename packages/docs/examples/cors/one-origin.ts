import { App, defineCoreHandler } from 'routup';
import { cors } from '@routup/cors';

export const app = new App();

// an array of one: other origins get no Access-Control-Allow-Origin
app.use(cors({ origin: ['https://app.example.com'] }));

app.get('/todos', defineCoreHandler(() => [{ id: 1, title: 'Write docs' }]));
