import { App, defineCoreHandler } from 'routup';
import { basic } from '@routup/basic';
import { readRequestBody } from '@routup/basic/body';
import { useRequestCookies } from '@routup/basic/cookie';
import { useRequestQuery } from '@routup/basic/query';

export const app = new App();

app.use(basic({
    // JSON up to 1 kb, URL-encoded forms with the default options
    body: { json: { limit: '1kb' }, urlEncoded: true },
    cookie: true,
    // no query parser
    query: false,
}));

app.post('/items', defineCoreHandler(async (event) => ({
    item: await readRequestBody(event),
    cookies: useRequestCookies(event),
    query: useRequestQuery(event),
})));
