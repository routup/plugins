import { describe, expect, it } from 'vitest';
import {
    Router,
    defineCoreHandler,
} from 'routup';
import {
    cookie,
    setResponseCookie,
    unsetResponseCookie,
    useRequestCookie,
    useRequestCookies,
} from '../../src';

function createTestRequest(url: string, options?: RequestInit): Request {
    const fullUrl = url.startsWith('http') ? url : `http://localhost${url}`;
    return new Request(fullUrl, options);
}

describe('src/module', () => {
    it('should parse cookie', async () => {
        const router = new Router();

        router.use(cookie());

        router.get('/', defineCoreHandler((event) => {
            useRequestCookies(event);

            const foo = useRequestCookie(event, 'foo');
            return foo;
        }));

        const response = await router.fetch(createTestRequest('/', { headers: { cookie: 'foo=bar' } }));

        expect(response.status).toEqual(200);
        expect(await response.text()).toEqual('bar');
    });

    it('should parse cookie with middleware', async () => {
        const router = new Router();

        router.use(cookie());

        router.get('/', defineCoreHandler((event) => {
            useRequestCookies(event);

            const foo = useRequestCookie(event, 'bar');
            return foo;
        }));

        const response = await router.fetch(createTestRequest('/', { headers: { cookie: 'bar=baz' } }));

        expect(response.status).toEqual(200);
        expect(await response.text()).toEqual('baz');
    });

    it('should set (multiple) cookie', async () => {
        const router = new Router();

        router.get('/', defineCoreHandler((event) => {
            setResponseCookie(event, 'bar', 'baz');

            return null;
        }));

        router.get('/multiple', defineCoreHandler((event) => {
            setResponseCookie(event, 'foo', 'bar');
            setResponseCookie(event, 'bar', 'baz');

            return null;
        }));

        let response = await router.fetch(createTestRequest('/', { headers: { cookie: 'foo=bar' } }));

        expect(response.status).toEqual(200);
        expect(response.headers.get('set-cookie')).toEqual('bar=baz; Path=/');

        response = await router.fetch(createTestRequest('/multiple'));

        expect(response.status).toEqual(200);
        expect(response.headers.get('set-cookie')).toEqual('foo=bar; Path=/, bar=baz; Path=/');
    });

    it('should unset cookie', async () => {
        const router = new Router();

        router.get('/', defineCoreHandler((event) => {
            unsetResponseCookie(event, 'foo');

            return null;
        }));

        const response = await router.fetch(createTestRequest('/', { headers: { cookie: 'foo=bar' } }));

        expect(response.status).toEqual(200);
        expect(response.headers.get('set-cookie')).toEqual('foo=; Max-Age=0; Path=/');
    });
});
