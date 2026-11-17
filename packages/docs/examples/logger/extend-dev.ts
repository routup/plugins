import { App, defineCoreHandler } from 'routup';
import { devFormatter, logger } from '@routup/logger';

export const app = new App();

app.use(logger((tokens, event, response) => {
    const line = devFormatter(tokens, event, response);

    return line && `${line} pid=${tokens.pid?.(event, response)}`;
}));

app.get('/', defineCoreHandler(() => 'Hello, World!'));
