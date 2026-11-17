import { App, defineCoreHandler } from 'routup';
import { body, readRequestBody } from '@routup/body';
import { cookie, useRequestCookie } from '@routup/cookie';
import { query, useRequestQuery } from '@routup/query';

export const app = new App();

app.use(cookie());
app.use(query());

// parse request bodies under /api only
app.use('/api', body());

app.post('/api/items', defineCoreHandler(async (event) => ({
    item: await readRequestBody(event),
    page: useRequestQuery(event, 'page'),
    session: useRequestCookie(event, 'session'),
})));

app.post('/webhook', defineCoreHandler(async (event) => ({ item: await readRequestBody(event) })));
