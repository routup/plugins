import { App, defineCoreHandler, getRequestIP } from 'routup';
import { rateLimit } from '@routup/rate-limit';

const ALLOWLIST = ['192.168.0.56', '192.168.0.21'];

export const app = new App();

app.use(rateLimit({
    // requests from these addresses are not counted and get no RateLimit headers
    skip: (event) => ALLOWLIST.includes(getRequestIP(event) ?? ''),
}));

app.get('/', defineCoreHandler(() => 'Hello, World!'));
