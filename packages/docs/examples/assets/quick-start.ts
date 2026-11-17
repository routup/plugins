import { fileURLToPath } from 'node:url';
import { App } from 'routup';
import { assets } from '@routup/assets';

export const app = new App();

// an absolute path: a relative one is resolved against the working directory
app.use(assets(fileURLToPath(new URL('public', import.meta.url))));
