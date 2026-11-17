import { App, defineCoreHandler } from 'routup';
import { body, readRequestBody } from '@routup/body';
import { cors } from '@routup/cors';

export const app = new App();

app.use(cors({ origin: 'https://app.example.com' }));
app.use(body());

app.post('/echo', defineCoreHandler((event) => readRequestBody(event)));
