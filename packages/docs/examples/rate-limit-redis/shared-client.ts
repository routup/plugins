import { App, defineCoreHandler } from 'routup';
import { rateLimit } from '@routup/rate-limit';
import { RedisStore } from '@routup/rate-limit-redis';
import { createClient } from 'redis-extension';

// the client the rest of the app uses as well
export const client = createClient({ url: process.env.REDIS_URL });

export const store = new RedisStore(client);

export const app = new App();

app.use(rateLimit({ store }));

app.get('/', defineCoreHandler(() => 'Hello, World!'));
