import { readFileSync } from 'node:fs';
import { App } from 'routup';
import { swaggerUI } from '@routup/swagger-ui';

const document = JSON.parse(readFileSync(new URL('./openapi.json', import.meta.url), 'utf8'));

export const app = new App();

app.use('/docs', swaggerUI(document, {
    // the recommended policy, plus framing by this app and the portal
    csp: {
        frameAncestors: ["'self'", 'https://portal.example.com'],
        connectSrc: ['https://extra.example.com'],
    },
    securityHeaders: true,
}));
