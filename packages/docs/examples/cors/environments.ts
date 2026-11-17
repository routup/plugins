import { App, defineCoreHandler } from 'routup';
import { cors } from '@routup/cors';

export const app = new App();

app.use(cors({
    origin: [
        'https://app.example.com',
        /\.staging\.example\.com$/,
    ],
}));

app.get('/', defineCoreHandler(() => 'Hello, World!'));
