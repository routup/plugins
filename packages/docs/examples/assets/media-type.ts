import { fileURLToPath } from 'node:url';
import { App, defineCoreHandler } from 'routup';
import { assets } from '@routup/assets';

export const app = new App();

const publicDir = fileURLToPath(new URL('public', import.meta.url));

// GET /source/about.html shows the HTML source: the type set here wins
app.use('/source', defineCoreHandler((event) => {
    event.response.headers.set('content-type', 'text/plain; charset=utf-8');

    return event.next();
}));
app.use('/source', assets(publicDir));

// everything else gets the type of its file name
app.use(assets(publicDir));
