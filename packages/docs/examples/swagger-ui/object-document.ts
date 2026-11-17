import { App } from 'routup';
import { swaggerUI } from '@routup/swagger-ui';

// built at runtime: the server URL depends on the environment
const document = {
    openapi: '3.1.0',
    info: { title: 'Todo API', version: '1.0.0' },
    servers: [{ url: process.env.API_URL ?? 'https://api.example.com' }],
    paths: {},
};

export const app = new App();

// csp: true adds the server origin to connect-src
app.use('/docs', swaggerUI(document, { csp: true }));
