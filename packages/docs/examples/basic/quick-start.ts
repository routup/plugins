import { App, defineCoreHandler } from 'routup';
import { basic } from '@routup/basic';
import { readRequestBody } from '@routup/basic/body';
import { useRequestCookie } from '@routup/basic/cookie';
import { useRequestQuery } from '@routup/basic/query';

export const app = new App();

// registers body(), cookie() and query(), in that order
app.use(basic());

app.post('/items', defineCoreHandler(async (event) => ({
    item: await readRequestBody(event),
    page: useRequestQuery(event, 'page'),
    session: useRequestCookie(event, 'session'),
})));
