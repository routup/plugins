import { App, defineCoreHandler, serve } from 'routup';
import { basic } from '@routup/basic';
import { readRequestBody } from '@routup/basic/body';
import { useRequestCookie } from '@routup/basic/cookie';
import { useRequestQuery } from '@routup/basic/query';
import { cors } from '@routup/cors';
import { logger } from '@routup/logger';
import { rateLimit } from '@routup/rate-limit';

const app = new App();

app.use(logger('dev'));
app.use(cors({ origin: ['https://app.example.com'], credentials: true }));
app.use(rateLimit({ windowMs: 60_000, max: 100 }));
app.use(basic());

app.post('/posts', defineCoreHandler(async (event) => {
    const post = await readRequestBody(event);
    const session = useRequestCookie(event, 'session');
    const { draft } = useRequestQuery(event);

    return {
        post,
        session,
        draft,
    };
}));

serve(app, { port: 3000 });
