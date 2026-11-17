import { fileURLToPath } from 'node:url';
import { App, defineCoreHandler } from 'routup';
import { assets } from '@routup/assets';

export const app = new App();

// GET /static/about serves public/about.html
app.use('/static', assets(fileURLToPath(new URL('public', import.meta.url))));

app.get('/about', defineCoreHandler(() => ({ page: 'about' })));
