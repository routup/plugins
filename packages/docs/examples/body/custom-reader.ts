import { App, defineCoreHandler } from 'routup';
import {
    body,
    readRequestBody,
    readRequestBodyText,
    setRequestBody,
} from '@routup/body';

export const app = new App();

app.use(body());

// newline-delimited JSON: one object per line
app.use(defineCoreHandler(async (event) => {
    if (event.headers.get('content-type') === 'application/x-ndjson') {
        const text = await readRequestBodyText(event, { limit: '1mb' });
        const items = text
            .split('\n')
            .filter((line) => line.trim() !== '')
            .map((line) => JSON.parse(line));

        setRequestBody(event, { items });
    }

    return event.next();
}));

app.post('/events', defineCoreHandler(async (event) => {
    const items = await readRequestBody(event, 'items');

    return { count: Array.isArray(items) ? items.length : 0 };
}));
