import { App, defineCoreHandler } from 'routup';
import { cookie, setResponseCookie, useRequestCookie } from '@routup/cookie';

type Preferences = { theme: 'light' | 'dark'; language: string };

export const app = new App();

app.use(cookie());

app.put('/preferences/:theme', defineCoreHandler((event) => {
    const preferences: Preferences = {
        theme: event.params.theme === 'dark' ? 'dark' : 'light',
        language: 'en',
    };

    // encoded with encodeURIComponent on the way out
    setResponseCookie(event, 'preferences', JSON.stringify(preferences), { maxAge: 60 * 60 * 24 * 365 });

    return preferences;
}));

app.get('/preferences', defineCoreHandler((event) => {
    const value = useRequestCookie(event, 'preferences');

    if (!value) {
        return { theme: 'light', language: 'en' };
    }

    try {
        // decoded with decodeURIComponent on the way in
        return JSON.parse(value) as Preferences;
    } catch {
        return { theme: 'light', language: 'en' };
    }
}));
