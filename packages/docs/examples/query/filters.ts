import { App, defineCoreHandler } from 'routup';
import { query, useRequestQuery } from '@routup/query';

export const app = new App();

app.use(query());

// GET /issues?filter[status]=open&filter[labels][]=bug&filter[labels][]=ui&fields[issue]=title
app.get('/issues', defineCoreHandler((event) => ({
    filter: useRequestQuery(event, 'filter'),
    fields: useRequestQuery(event, 'fields'),
})));
