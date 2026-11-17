import { readFileSync } from 'node:fs';
import { App } from 'routup';
import { swaggerUI } from '@routup/swagger-ui';

// pass the parsed object: a Windows path string would count as a URL
const document = JSON.parse(readFileSync(new URL('./openapi.json', import.meta.url), 'utf8'));

export const app = new App();

app.use('/docs', swaggerUI(document));
