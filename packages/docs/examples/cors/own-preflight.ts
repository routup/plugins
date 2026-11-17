import { App, defineCoreHandler } from 'routup';
import { cors } from '@routup/cors';

export const app = new App();

app.use(cors({ preflight: { continue: true } }));

app.options('/upload', defineCoreHandler((event) => {
    event.response.status = 204;
    event.response.headers.set('x-upload-limit', '10mb');

    return null;
}));
