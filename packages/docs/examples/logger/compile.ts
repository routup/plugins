import { App, defineCoreHandler } from 'routup';
import {
    StartTimeSymbol,
    compile,
    defaultTokens,
    formatStrings,
} from '@routup/logger';

const formatter = compile(`${formatStrings.tiny} :user`);
const tokens = { ...defaultTokens, user: () => 'alice' };

export const app = new App();

app.use(defineCoreHandler(async (event) => {
    // :response-time reads the start time from here
    event.store[StartTimeSymbol] = performance.now();

    const response = await event.next();

    console.log(formatter(tokens, event, response));

    return response;
}));

app.get('/', defineCoreHandler(() => 'Hello, World!'));
