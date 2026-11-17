import { App, defineCoreHandler } from 'routup';
import { query, useRequestQuery } from '@routup/query';

export const app = new App();

app.use(query({
    parse: {
        // ?filter.status=open -> { filter: { status: 'open' } }
        allowDots: true,
        // ?ids=1,2,3 -> { ids: ['1', '2', '3'] }
        comma: true,
        depth: 2,
        parameterLimit: 50,
    },
}));

app.get('/issues', defineCoreHandler((event) => useRequestQuery(event)));
