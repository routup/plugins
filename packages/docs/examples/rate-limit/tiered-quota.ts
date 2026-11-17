import { App, defineCoreHandler, getRequestHeader } from 'routup';
import { rateLimit } from '@routup/rate-limit';

const PREMIUM_KEYS = new Set(['premium-key']);

export const app = new App();

app.use(rateLimit({
    // premium API keys get 10 requests per minute, everyone else 5
    max: (event) => (PREMIUM_KEYS.has(getRequestHeader(event, 'x-api-key') ?? '') ? 10 : 5),
    // count per API key, so one premium key does not share a quota with others
    keyGenerator: (event) => getRequestHeader(event, 'x-api-key') ?? 'anonymous',
}));

app.get('/', defineCoreHandler(() => 'Hello, World!'));
