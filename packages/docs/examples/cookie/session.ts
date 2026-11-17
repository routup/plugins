import { App, defineCoreHandler } from 'routup';
import {
    cookie,
    setResponseCookie,
    unsetResponseCookie,
    useRequestCookie,
} from '@routup/cookie';

export const app = new App();

app.use(cookie());

app.post('/login', defineCoreHandler((event) => {
    // issued by your authentication code
    const token = crypto.randomUUID();

    setResponseCookie(event, 'session', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
    });

    return { ok: true };
}));

app.get('/me', defineCoreHandler((event) => ({ loggedIn: useRequestCookie(event, 'session') !== undefined })));

app.post('/logout', defineCoreHandler((event) => {
    unsetResponseCookie(event, 'session');

    return { ok: true };
}));
