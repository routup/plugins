import { App, defineCoreHandler } from 'routup';
import { logger } from '@routup/logger';

const UserKey = Symbol.for('app:user');

export const app = new App();

app.use(logger(':method :url :status :response-time[0] ms user=:user id=:req[x-request-id]', {
    tokens: {
        // a token returns a string, or undefined for '-'
        user: (event) => event.store[UserKey] as string | undefined,
    },
}));

app.use(defineCoreHandler((event) => {
    const token = event.headers.get('authorization');

    if (token === 'Bearer ada-token') {
        event.store[UserKey] = 'ada';
    }

    return event.next();
}));

app.get('/', defineCoreHandler(() => 'Hello, World!'));
