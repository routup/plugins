import { App } from 'routup';
import { swaggerUI } from '@routup/swagger-ui';

export const app = new App();

// the browser fetches the document from this URL
app.use('/docs', swaggerUI('https://petstore3.swagger.io/api/v3/openapi.json'));
