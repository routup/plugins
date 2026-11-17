import { App, defineCoreHandler } from 'routup';
import { rateLimit } from '@routup/rate-limit';
import { RedisStore } from '@routup/rate-limit-redis';

export const app = new App();

// every instance counts in the same Redis, so the quota holds across instances
app.use(rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    store: new RedisStore(process.env.REDIS_URL),
}));

app.get('/', defineCoreHandler(() => 'Hello, World!'));
