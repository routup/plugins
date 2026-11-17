import { App, defineCoreHandler } from 'routup';
import { rateLimit } from '@routup/rate-limit';

export const app = new App();

// 100 requests per client every 15 minutes
app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
}));

app.get('/', defineCoreHandler(() => 'Hello, World!'));
