import { App, defineCoreHandler } from 'routup';
import { cookie, useRequestCookies } from '@routup/cookie';

export const app = new App();

app.use(cookie({
    parse: {
        // only parse the cookies this app sets
        filter: (name) => name.startsWith('app_'),
        // keep every value of a name sent more than once
        allowMultiple: true,
    },
}));

app.get('/', defineCoreHandler((event) => useRequestCookies(event)));
