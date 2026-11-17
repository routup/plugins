import { App, defineCoreHandler } from 'routup';
import { query, useRequestQuery } from '@routup/query';

export const app = new App();

app.use(query());

// GET /search?q=routup&limit=5&tag=http&tag=router
app.get('/search', defineCoreHandler((event) => {
    const all = useRequestQuery(event);

    // a value is never a number: convert and check it yourself
    const limit = Number.parseInt(useRequestQuery(event, 'limit') ?? '', 10);

    // one tag gives a string, several give an array
    const tags: string[] = [useRequestQuery(event, 'tag') ?? []].flat();

    return {
        all,
        q: useRequestQuery(event, 'q') ?? '',
        limit: Number.isSafeInteger(limit) && limit > 0 ? Math.min(limit, 100) : 20,
        tags,
    };
}));
