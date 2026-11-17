import type { IAppEvent } from 'routup';
import { App, defineCoreHandler, getRequestIP } from 'routup';
import { rateLimit } from '@routup/rate-limit';
import { RedisStore } from '@routup/rate-limit-redis';

// stands in for a real password check
const PASSWORD = 'secret';

const keyGenerator = (event: IAppEvent) => getRequestIP(event, { trustProxy: true }) ?? '127.0.0.1';

const store = new RedisStore(process.env.REDIS_URL);

export const app = new App();

// five attempts per client every 15 minutes
app.use('/login', rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    keyGenerator,
    store,
}));

app.post('/login', defineCoreHandler(async (event) => {
    const { password } = await event.request.json() as { password?: string };

    if (password !== PASSWORD) {
        event.response.status = 401;

        return 'Wrong password';
    }

    // a successful login clears the attempts of this client
    await store.reset(keyGenerator(event));

    return 'Welcome';
}));
