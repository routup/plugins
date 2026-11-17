import { App, defineCoreHandler } from 'routup';
import { body, readRequestBody } from '@routup/body';
import { cors } from '@routup/cors';
import { logger } from '@routup/logger';
import { rateLimit } from '@routup/rate-limit';

export const app = new App();

app.use(logger());
app.use(cors({ origin: 'https://app.example.com' }));
app.use(rateLimit({ windowMs: 60 * 1000, max: 100 }));
app.use(body());

app.post('/todos', defineCoreHandler(async (event) => {
    event.response.status = 201;

    return readRequestBody(event);
}));
