import { fileURLToPath } from 'node:url';
import { App } from 'routup';
import { swaggerUI } from '@routup/swagger-ui';

const document = fileURLToPath(new URL('./openapi.json', import.meta.url));

const api = new App();

// the proxy forwards https://example.com/backend/* to this app
api.use('/docs', swaggerUI(document, { basePath: '/backend/' }));

export const app = new App();

app.use('/api', api);
