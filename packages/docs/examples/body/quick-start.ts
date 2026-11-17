import { App, defineCoreHandler } from 'routup';
import { body, readRequestBody } from '@routup/body';

export const app = new App();

// parses application/json and application/x-www-form-urlencoded bodies
app.use(body());

app.post('/users', defineCoreHandler(async (event) => {
    // the same handler for a JSON client and an HTML <form>
    const email = await readRequestBody(event, 'email');

    return { email };
}));
