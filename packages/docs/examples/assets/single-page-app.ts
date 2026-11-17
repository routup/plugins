import { fileURLToPath } from 'node:url';
import { App, defineCoreHandler } from 'routup';
import { assets } from '@routup/assets';

export const app = new App();

app.use(assets(fileURLToPath(new URL('public', import.meta.url)), {
    // index.html for the paths of the client-side router
    fallback: true,
    // not for API paths; a missing file with an extension is left out too
    fallbackIgnores: ['^/api(/|$)'],
}));

app.get('/api/todos', defineCoreHandler(() => [{ title: 'Write docs' }]));
