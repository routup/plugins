import { describe, expect, it } from 'vitest';
import { App, defineCoreHandler } from 'routup';
import type { OptionsInput } from '../../src';
import { rateLimit } from '../../src';

function createApp(options: OptionsInput = {}) {
    const app = new App();

    app.use(rateLimit({ max: 1, ...options }));
    app.use(defineCoreHandler(() => 'ok'));

    return app;
}

function send(app: App, forwardedFor: string) {
    // the address of the proxy that connected
    const request = Object.assign(
        new Request('http://localhost/', { headers: { 'x-forwarded-for': forwardedFor } }),
        { ip: '192.168.0.1' },
    );

    return app.fetch(request);
}

describe('trustProxy', () => {
    it('should key by x-forwarded-for by default', async () => {
        const app = createApp();

        expect((await send(app, '10.0.0.1')).status).toEqual(200);
        expect((await send(app, '10.0.0.2')).status).toEqual(200);
        expect((await send(app, '10.0.0.1')).status).toEqual(429);
    });

    it('should ignore x-forwarded-for when proxies are not trusted', async () => {
        const app = createApp({ trustProxy: false });

        expect((await send(app, '10.0.0.1')).status).toEqual(200);
        expect((await send(app, '10.0.0.2')).status).toEqual(429);
    });

    it('should pass the option to the default key generator only', async () => {
        const app = createApp({ trustProxy: false, keyGenerator: (event) => event.headers.get('x-forwarded-for')! });

        expect((await send(app, '10.0.0.1')).status).toEqual(200);
        expect((await send(app, '10.0.0.2')).status).toEqual(200);
    });
});
