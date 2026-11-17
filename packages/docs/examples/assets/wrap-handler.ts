import { fileURLToPath } from 'node:url';
import { App, defineCoreHandler } from 'routup';
import { createCoreHandler } from '@routup/assets';

export const app = new App();

const serveFile = createCoreHandler(fileURLToPath(new URL('public', import.meta.url)), { fallthrough: false });

app.use('/files', defineCoreHandler((event) => {
    event.response.headers.set('x-robots-tag', 'noindex');

    return serveFile(event);
}));
