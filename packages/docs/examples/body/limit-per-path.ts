import { App, defineCoreHandler } from 'routup';
import { body, readRequestBody } from '@routup/body';

export const app = new App();

app.use(body({ json: { limit: '10kb' } }));
// registered later, so its options win below /import
app.use('/import', body({ json: { limit: '1mb' } }));

app.post('/notes', defineCoreHandler(async (event) => readRequestBody(event)));

app.post('/import/notes', defineCoreHandler(async (event) => {
    const notes = await readRequestBody(event);

    return { imported: Array.isArray(notes) ? notes.length : 0 };
}));
