import { App, defineCoreHandler } from 'routup';
import { handleCors } from '@routup/cors';

export const app = new App();

// use() matches every method, so the preflight reaches the handler too
app.use('/public', defineCoreHandler((event) => {
    const preflight = handleCors(event, { origin: '*' });

    if (preflight) {
        return preflight;
    }

    return 'Hello, World!';
}));

app.get('/private', defineCoreHandler(() => 'no CORS headers'));
