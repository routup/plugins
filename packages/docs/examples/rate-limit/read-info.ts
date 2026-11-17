import { App, defineCoreHandler } from 'routup';
import { rateLimit, useRequestRateLimitInfo } from '@routup/rate-limit';

export const app = new App();

app.use(rateLimit({ max: 100 }));

app.get('/quota', defineCoreHandler((event) => {
    const info = useRequestRateLimitInfo(event);

    return {
        limit: info.limit,
        remaining: info.remaining,
        resetTime: info.resetTime,
    };
}));
