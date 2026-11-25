import { describe, expect, it } from 'vitest';
import {
    App,
    defineCoreHandler,
} from 'routup';
import type { Options } from '../../src';
import { body, readRequestBody } from '../../src';

function createApp(options: Options) {
    const app = new App();

    app.use(body(options));
    app.use(defineCoreHandler(async (event) => readRequestBody(event)));

    return app;
}

function send(app: App, contentType: string | undefined, payload: string) {
    const headers: Record<string, string> = { 'content-length': `${payload.length}` };

    if (contentType) {
        headers['content-type'] = contentType;
    }

    return app.fetch(new Request('http://localhost/', {
        method: 'POST',
        headers,
        body: payload,
    }));
}

describe('strictContentType', () => {
    it('should parse json and url-encoded bodies', async () => {
        const app = createApp({ strictContentType: true });

        let response = await send(app, 'application/json', '{"a":1}');

        expect(response.status).toEqual(200);
        expect(await response.json()).toEqual({ a: 1 });

        response = await send(app, 'application/x-www-form-urlencoded', 'a=1');
        expect(response.status).toEqual(200);
        expect(await response.json()).toEqual({ a: '1' });
    });

    it('should ignore parameters and case', async () => {
        const app = createApp({ strictContentType: true });
        const response = await send(app, 'Application/JSON; charset=utf-8', '{"a":1}');

        expect(response.status).toEqual(200);
        expect(await response.json()).toEqual({ a: 1 });
    });

    it('should match a suffix pattern', async () => {
        const app = createApp({
            strictContentType: true,
            json: { type: 'application/*+json' },
        });
        const response = await send(app, 'application/vnd.api+json', '{"a":1}');

        expect(response.status).toEqual(200);
        expect(await response.json()).toEqual({ a: 1 });
    });

    it('should answer 415 for an unlisted or missing media type', async () => {
        const app = createApp({ strictContentType: true });

        expect((await send(app, 'text/plain', 'a')).status).toEqual(415);
        expect((await send(app, undefined, '{"a":1}')).status).toEqual(415);
    });

    it('should only accept the media types of the enabled parsers', async () => {
        const app = createApp({ strictContentType: true, json: true });

        expect((await send(app, 'application/x-www-form-urlencoded', 'a=1')).status).toEqual(415);
    });

    it('should answer 400 for a malformed media type', async () => {
        const app = createApp({ strictContentType: true });

        expect((await send(app, 'json', '{"a":1}')).status).toEqual(400);
    });

    it('should not check a request without a body', async () => {
        const app = createApp({ strictContentType: true });

        let response = await app.fetch(new Request('http://localhost/'));

        expect(response.status).toEqual(200);
        expect(await response.json()).toEqual({});

        // The Node listener gives every request but GET and HEAD a body
        // stream, also when the message has no body.
        response = await app.fetch(new Request('http://localhost/', {
            method: 'POST',
            body: new ReadableStream({ start: (controller) => controller.close() }),
            duplex: 'half',
        } as RequestInit));
        expect(response.status).toEqual(200);
        expect(await response.json()).toEqual({});
    });

    it('should not check a GET with framing headers', async () => {
        const app = createApp({ strictContentType: true });
        const response = await app.fetch(new Request('http://localhost/', { headers: { 'content-length': '3', 'content-type': 'text/plain' } }));

        expect(await response.json()).toEqual({});
    });

    it('should check a body with an invalid content-length', async () => {
        const app = createApp({ strictContentType: true });
        const response = await app.fetch(new Request('http://localhost/', {
            method: 'POST',
            headers: { 'content-length': 'abc', 'content-type': 'text/plain' },
            body: 'a',
        }));

        expect(response.status).toEqual(415);
    });

    it('should accept an extension in a type list', async () => {
        const app = createApp({ strictContentType: true, json: { type: 'json' } });
        const response = await send(app, 'application/json', '{"a":1}');

        expect(await response.json()).toEqual({ a: 1 });
        expect((await send(app, 'text/plain', 'a')).status).toEqual(415);
    });

    it('should answer 415 for every body with no parser enabled', async () => {
        const app = createApp({ strictContentType: true, text: true });

        expect((await send(app, 'application/json', '{"a":1}')).status).toEqual(415);
    });

    it('should return an unsupported media type as an empty body by default', async () => {
        const app = createApp({});
        const response = await send(app, 'text/plain', 'a');

        expect(response.status).toEqual(200);
        expect(await response.json()).toEqual({});
    });
});

describe('type', () => {
    it('should match a pattern, ignoring parameters and case', async () => {
        const app = createApp({ json: { type: ['application/json', 'application/*+json'] } });

        for (const type of ['application/vnd.api+json', 'Application/JSON; charset=utf-8']) {
            const response = await send(app, type, '{"a":1}');

            expect(await response.json()).toEqual({ a: 1 });
        }

        expect(await (await send(app, 'application/xml', '<a/>')).json()).toEqual({});
    });

    it('should resolve an extension', async () => {
        const app = createApp({ json: { type: 'json' } });
        const response = await send(app, 'application/json', '{"a":1}');

        expect(await response.json()).toEqual({ a: 1 });
    });
});
