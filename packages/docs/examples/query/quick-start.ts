import { App, defineCoreHandler } from 'routup';
import { query, useRequestQuery } from '@routup/query';

export const app = new App();

app.use(query());

// GET /users?page[limit]=10&page[offset]=0&sort=-name
app.get('/users', defineCoreHandler((event) => {
    const page = useRequestQuery(event, 'page');
    // { limit: '10', offset: '0' }

    return { page, sort: useRequestQuery(event, 'sort') };
}));
