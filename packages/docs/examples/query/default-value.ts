import { App, defineCoreHandler } from 'routup';
import { query, setRequestQuery, useRequestQuery } from '@routup/query';

export const app = new App();

app.use(query());

// later handlers read a limit even when the client sent none
app.use(defineCoreHandler((event) => {
    if (typeof useRequestQuery(event, 'limit') === 'undefined') {
        setRequestQuery(event, 'limit', '20');
    }

    return event.next();
}));

app.get('/items', defineCoreHandler((event) => ({ limit: useRequestQuery(event, 'limit') })));
