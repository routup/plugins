import { fileURLToPath } from 'node:url';
import { App } from 'routup';
import { swaggerUI } from '@routup/swagger-ui';

const document = fileURLToPath(new URL('./openapi.json', import.meta.url));

export const app = new App();

app.use('/docs', swaggerUI(document, {
    persistAuthorization: true,
    oauth: {
        clientId: 'swagger-ui',
        scopes: ['openid', 'profile'],
        usePkceWithAuthorizationCodeGrant: true,
    },
}));
