import { App, defineCoreHandler, getRequestHeader } from 'routup';
import { rateLimit } from '@routup/rate-limit';

export const app = new App();

// only failed requests count, and only once their response is known:
// pending requests, such as long-polls, hold no slot
app.use('/api', rateLimit({
    max: 5,
    skipSuccessfulRequest: true,
    countAfterResponse: true,
}));

app.get('/api/events', defineCoreHandler((event) => {
    if (getRequestHeader(event, 'authorization') !== 'Bearer valid-token') {
        event.response.status = 401;

        return { error: 'invalid_credentials' };
    }

    return { events: [] };
}));
