import { App, defineCoreHandler } from 'routup';
import {
    appendCorsHeaders,
    appendCorsPreflightHeaders,
    isPreflightRequest,
} from '@routup/cors';

const options = { origin: 'https://app.example.com', maxAge: 600 };

export const app = new App();

app.use('/', defineCoreHandler((event) => {
    if (isPreflightRequest(event)) {
        appendCorsPreflightHeaders(event, options);
        event.response.status = 204;

        return null;
    }

    appendCorsHeaders(event, options);

    return 'Hello, World!';
}));
