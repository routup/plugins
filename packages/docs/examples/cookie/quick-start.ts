import { App, defineCoreHandler } from 'routup';
import { cookie, setResponseCookie, useRequestCookie } from '@routup/cookie';

export const app = new App();

app.use(cookie());

app.get('/', defineCoreHandler((event) => {
    const visits = Number(useRequestCookie(event, 'visits') ?? 0) + 1;

    setResponseCookie(event, 'visits', String(visits), { httpOnly: true, sameSite: 'lax' });

    return { visits };
}));
