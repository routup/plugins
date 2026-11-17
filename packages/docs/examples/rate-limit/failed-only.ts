import { App, defineCoreHandler, getRequestHeader } from 'routup';
import { rateLimit } from '@routup/rate-limit';

export const app = new App();

// only failed login attempts count towards the limit
app.use('/auth/login', rateLimit({
    max: 5,
    skipSuccessfulRequest: true,
}));

app.post('/auth/login', defineCoreHandler((event) => {
    if (getRequestHeader(event, 'authorization') !== 'Bearer valid-token') {
        event.response.status = 401;

        return { error: 'invalid_credentials' };
    }

    return { ok: true };
}));
