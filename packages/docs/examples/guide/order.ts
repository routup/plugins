import { App, defineCoreHandler } from 'routup';
import { body, readRequestBody } from '@routup/body';

export const app = new App();

// registered before body(): the body is never parsed for this route
app.post('/before', defineCoreHandler((event) => readRequestBody(event)));

app.use(body());

app.post('/after', defineCoreHandler((event) => readRequestBody(event)));
