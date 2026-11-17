import { App, defineCoreHandler } from 'routup';
import { cookie, setRequestCookies, useRequestCookie } from '@routup/cookie';

export const app = new App();

app.use(cookie());

// later handlers read a locale even when the client sent none
app.use(defineCoreHandler((event) => {
    if (!useRequestCookie(event, 'locale')) {
        setRequestCookies(event, 'locale', 'en');
    }

    return event.next();
}));

app.get('/', defineCoreHandler((event) => ({ locale: useRequestCookie(event, 'locale') })));
