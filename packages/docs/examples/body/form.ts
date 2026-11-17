import { App, defineCoreHandler } from 'routup';
import { body, readRequestBody } from '@routup/body';

export const app = new App();

app.use(body({ urlEncoded: { parameterLimit: 20 } }));

// <form method="post" action="/subscribe"> with an email field and tag checkboxes
app.post('/subscribe', defineCoreHandler(async (event) => {
    const email = await readRequestBody(event, 'email');
    const tags = await readRequestBody(event, 'tags');

    return {
        email,
        // one checked box gives a string, several give an array
        tags: typeof tags === 'string' ? [tags] : (tags ?? []),
    };
}));
