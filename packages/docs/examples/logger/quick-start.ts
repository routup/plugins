import { App, defineCoreHandler } from 'routup';
import { logger } from '@routup/logger';

export const app = new App();

// first, so it sees every request the routes answer
app.use(logger());

app.get('/', defineCoreHandler(() => 'Hello, World!'));
