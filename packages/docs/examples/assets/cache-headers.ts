import { fileURLToPath } from 'node:url';
import { App } from 'routup';
import { assets } from '@routup/assets';

export const app = new App();

// content-hashed file names never change: cache them for a year
app.use('/assets', assets(fileURLToPath(new URL('public/assets', import.meta.url)), {
    cacheMaxAge: 31536000,
    cacheImmutable: true,
}));

// everything else: browsers revalidate with the ETag on every use
app.use(assets(fileURLToPath(new URL('public', import.meta.url))));
