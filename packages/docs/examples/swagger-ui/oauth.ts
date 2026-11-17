import { readFileSync } from 'node:fs';
import { App } from 'routup';
import { swaggerUI } from '@routup/swagger-ui';

const document = JSON.parse(readFileSync(new URL('./openapi.json', import.meta.url), 'utf8'));

export const app = new App();

app.use('/docs', swaggerUI(document, {
    persistAuthorization: true,
    oauth: {
        clientId: 'swagger-ui',
        scopes: ['openid', 'profile'],
        usePkceWithAuthorizationCodeGrant: true,
    },
}));
