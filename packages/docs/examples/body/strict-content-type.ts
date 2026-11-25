import { App, defineCoreHandler } from 'routup';
import { body, readRequestBody } from '@routup/body';

export const app = new App();

app.use(body({
    strictContentType: true,
    // JSON only, also JSON:API and other `+json` types
    json: { type: ['application/json', 'application/*+json'] },
}));

app.post('/notes', defineCoreHandler(async (event) => {
    const note = await readRequestBody(event);

    return { note };
}));
