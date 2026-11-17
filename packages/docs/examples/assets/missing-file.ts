import { fileURLToPath } from 'node:url';
import { App } from 'routup';
import { assets } from '@routup/assets';

export const app = new App();

app.use('/files', assets(fileURLToPath(new URL('public', import.meta.url)), {
    resolve: async (event) => {
        event.response.status = 404;

        return { message: `${event.path} not found` };
    },
}));
