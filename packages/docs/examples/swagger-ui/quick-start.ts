import { fileURLToPath } from 'node:url';
import { App } from 'routup';
import { swaggerUI } from '@routup/swagger-ui';

// a file path, not a file:// URL
const document = fileURLToPath(new URL('./openapi.json', import.meta.url));

export const app = new App();

app.use('/docs', swaggerUI(document));
