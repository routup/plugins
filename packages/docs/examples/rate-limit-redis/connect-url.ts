import { App, defineCoreHandler } from 'routup';
import { rateLimit } from '@routup/rate-limit';
import { RedisStore } from '@routup/rate-limit-redis';

export const app = new App();

app.use(rateLimit({
    // the store creates its own client for this URL
    store: new RedisStore('redis://user:secret@redis.internal:6379/0'),
}));

app.get('/', defineCoreHandler(() => 'Hello, World!'));
