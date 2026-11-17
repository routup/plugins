import { App, defineCoreHandler } from 'routup';
import { rateLimit } from '@routup/rate-limit';

export const app = new App();

// only requests below /auth count, 5 per minute
app.use('/auth', rateLimit({ windowMs: 60_000, max: 5 }));

app.post('/auth/login', defineCoreHandler(() => ({ ok: true })));
app.get('/', defineCoreHandler(() => 'Hello, World!'));
