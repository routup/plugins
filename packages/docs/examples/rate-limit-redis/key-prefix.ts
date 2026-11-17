import { App, defineCoreHandler } from 'routup';
import { rateLimit } from '@routup/rate-limit';
import { RedisStore } from '@routup/rate-limit-redis';

// keys rate-limit:login:<key> instead of rate-limit:<key>
class LoginStore extends RedisStore {
    protected override buildKey(key: string): string {
        return `rate-limit:login:${key}`;
    }
}

export const app = new App();

app.use(rateLimit({
    max: 100,
    store: new RedisStore(process.env.REDIS_URL),
}));

app.use('/login', rateLimit({
    max: 5,
    store: new LoginStore(process.env.REDIS_URL),
}));

app.get('/', defineCoreHandler(() => 'Hello, World!'));
app.post('/login', defineCoreHandler(() => 'Welcome'));
