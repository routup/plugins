import { fileURLToPath } from 'node:url';
import { App } from 'routup';
import { assets } from '@routup/assets';

export const app = new App();

// checked first: a file here wins over one of the same name below
app.use(assets(fileURLToPath(new URL('public', import.meta.url))));

// reached when public/ has no matching file
app.use(assets(fileURLToPath(new URL('legacy', import.meta.url))));
