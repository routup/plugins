import { App, defineCoreHandler } from 'routup';
import { body, readRequestBody } from '@routup/body';

export const app = new App();

// JSON only, up to 10 kB; URL-encoded bodies are not parsed
app.use(body({ json: { limit: '10kb' } }));

app.post('/notes', defineCoreHandler(async (event) => {
    const note = await readRequestBody(event);

    event.response.status = 201;

    return note;
}));
