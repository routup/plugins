import { App, defineCoreHandler } from 'routup';
import { rateLimit } from '@routup/rate-limit';
import { RedisStore } from '@routup/rate-limit-redis';

export const app = new App();

// 100 requests per client every 15 minutes, counted in Redis
app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    // without an argument: a client for localhost:6379
    store: new RedisStore(),
}));

app.get('/', defineCoreHandler(() => 'Hello, World!'));
