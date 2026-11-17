import { App, defineCoreHandler } from 'routup';
import { rateLimit, useRequestRateLimitInfo } from '@routup/rate-limit';

export const app = new App();

app.use(rateLimit({
    max: 1,
    handler(event, options) {
        event.response.status = options.statusCode;

        return {
            error: 'rate_limited',
            resetTime: useRequestRateLimitInfo(event, 'resetTime'),
        };
    },
}));

app.get('/', defineCoreHandler(() => 'Hello, World!'));
