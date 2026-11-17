import { createWriteStream } from 'node:fs';
import { App, defineCoreHandler } from 'routup';
import { logger } from '@routup/logger';

// appends one line per request
export const accessLog = createWriteStream(process.env.ACCESS_LOG ?? 'access.log', { flags: 'a' });

export const app = new App();

app.use(logger('combined', {
    write: (line) => {
        accessLog.write(`${line}\n`);
    },
}));

app.get('/', defineCoreHandler(() => 'Hello, World!'));
