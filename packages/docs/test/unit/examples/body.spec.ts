import { createHmac } from 'node:crypto';
import { brotliCompressSync, gzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import type { IAppEvent } from 'routup';
import { App, defineCoreHandler } from 'routup';
import type { Options } from '@routup/body';
import {
    body,
    readRequestBody,
    readRequestBodyArrayBuffer,
    readRequestBodyBlob,
    readRequestBodyBytes,
    readRequestBodyRaw,
    readRequestBodyStream,
    readRequestBodyText,
    setRequestBody,
} from '@routup/body';
import { app as customReader } from '../../../examples/body/custom-reader';
import { app as form } from '../../../examples/body/form';
import { app as jsonLimit } from '../../../examples/body/json-limit';
import { app as limitPerPath } from '../../../examples/body/limit-per-path';
import { app as quickStart } from '../../../examples/body/quick-start';
import { app as stream } from '../../../examples/body/stream';
import { app as strictContentType } from '../../../examples/body/strict-content-type';
import { app as text } from '../../../examples/body/text';
import { app as webhook } from '../../../examples/body/webhook';

const encode = (input: string) => new TextEncoder().encode(input);

function post(path: string, payload: RequestInit['body'], headers: Record<string, string> = {}): Request {
    return new Request(`http://localhost${path}`, {
        method: 'POST',
        headers,
        body: payload,
    });
}

function json(path: string, payload: unknown): Request {
    return post(path, JSON.stringify(payload), { 'content-type': 'application/json' });
}

function create(options: Options | undefined, fn: (event: IAppEvent) => unknown): App {
    const app = new App();

    app.use(body(options));
    app.post('/', defineCoreHandler(fn));

    return app;
}

function sign(payload: string, secret: string): string {
    return createHmac('sha256', secret).update(payload).digest('hex');
}

describe('quick-start', () => {
    it('reads a field of a JSON body', async () => {
        const response = await quickStart.fetch(json('/users', { email: 'ada@example.com' }));

        expect(await response.json()).toEqual({ email: 'ada@example.com' });
    });

    it('reads the same field of a form body', async () => {
        const response = await quickStart.fetch(post('/users', 'email=ada%40example.com', { 'content-type': 'application/x-www-form-urlencoded' }));

        expect(await response.json()).toEqual({ email: 'ada@example.com' });
    });
});

describe('json-limit', () => {
    it('answers 201 with the note', async () => {
        const response = await jsonLimit.fetch(json('/notes', { text: 'hello' }));

        expect(response.status).toBe(201);
        expect(await response.json()).toEqual({ text: 'hello' });
    });

    it('answers 413 for a body over the limit', async () => {
        const response = await jsonLimit.fetch(json('/notes', { text: 'x'.repeat(11 * 1024) }));

        expect(response.status).toBe(413);
        expect(await response.json()).toEqual({ status: 413, message: 'request entity too large' });
    });

    it('does not parse a form body once only json is set', async () => {
        const response = await jsonLimit.fetch(post('/notes', 'text=hello', { 'content-type': 'application/x-www-form-urlencoded' }));

        expect(await response.json()).toEqual({});
    });
});

describe('form', () => {
    it('turns repeated fields into an array', async () => {
        const response = await form.fetch(post('/subscribe', 'email=ada%40example.com&tags=news&tags=releases', { 'content-type': 'application/x-www-form-urlencoded' }));

        expect(await response.json()).toEqual({ email: 'ada@example.com', tags: ['news', 'releases'] });
    });

    it('wraps a single field in an array', async () => {
        const response = await form.fetch(post('/subscribe', 'email=ada%40example.com&tags=news', { 'content-type': 'application/x-www-form-urlencoded' }));

        expect(await response.json()).toEqual({ email: 'ada@example.com', tags: ['news'] });
    });

    it('answers 413 for more fields than parameterLimit', async () => {
        const fields = Array.from({ length: 21 }, (_, i) => `tags=${i}`).join('&');
        const response = await form.fetch(post('/subscribe', fields, { 'content-type': 'application/x-www-form-urlencoded' }));

        expect(response.status).toBe(413);
        expect(await response.json()).toEqual({ status: 413, message: 'too many parameters' });
    });
});

describe('strict-content-type', () => {
    it('parses a listed or suffix-matched JSON type', async () => {
        for (const type of ['application/json; charset=utf-8', 'application/vnd.api+json']) {
            const response = await strictContentType.fetch(post('/notes', '{"text":"hi"}', { 'content-type': type }));

            expect(await response.json()).toEqual({ note: { text: 'hi' } });
        }
    });

    it('answers 415 for another or a missing type, and 400 for a malformed one', async () => {
        let response = await strictContentType.fetch(post('/notes', 'hi', { 'content-type': 'text/plain' }));

        expect(response.status).toBe(415);

        response = await strictContentType.fetch(post('/notes', 'text=hi', { 'content-type': 'application/x-www-form-urlencoded' }));
        expect(response.status).toBe(415);

        response = await strictContentType.fetch(post('/notes', new Uint8Array([123, 125]), { 'content-length': '2' }));
        expect(response.status).toBe(415);

        response = await strictContentType.fetch(post('/notes', '{}', { 'content-type': 'json' }));
        expect(response.status).toBe(400);
    });

    it('reads a request without a body as {}', async () => {
        const response = await strictContentType.fetch(new Request('http://localhost/notes', {
            method: 'POST',
            body: new ReadableStream({ start: (controller) => controller.close() }),
            duplex: 'half',
        } as RequestInit));

        expect(await response.json()).toEqual({ note: {} });
    });
});

describe('webhook', () => {
    const payload = '{"type":"invoice.paid"}';

    it('accepts a body signed with the secret', async () => {
        const response = await webhook.fetch(post('/webhook', payload, {
            'content-type': 'application/json',
            'x-signature': sign(payload, 'webhook-secret'),
        }));

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ received: 'invoice.paid' });
    });

    it('rejects a body signed with another secret', async () => {
        const response = await webhook.fetch(post('/webhook', payload, {
            'content-type': 'application/json',
            'x-signature': sign(payload, 'other-secret'),
        }));

        expect(response.status).toBe(401);
        expect(await response.json()).toEqual({ error: 'invalid signature' });
    });
});

describe('text', () => {
    it('imports CSV lines', async () => {
        const response = await text.fetch(post('/contacts/import', 'Ada,ada@example.com\nAlan,alan@example.com\n', { 'content-type': 'text/csv' }));

        expect(await response.json()).toEqual({
            imported: 2,
            contacts: [
                { name: 'Ada', email: 'ada@example.com' },
                { name: 'Alan', email: 'alan@example.com' },
            ],
        });
    });
});

describe('limit-per-path', () => {
    const notes = Array.from({ length: 200 }, (_, i) => ({ text: `note ${i} ${'x'.repeat(100)}` }));

    it('applies the larger limit below /import', async () => {
        const response = await limitPerPath.fetch(json('/import/notes', notes));

        expect(await response.json()).toEqual({ imported: 200 });
    });

    it('keeps the smaller limit elsewhere', async () => {
        const response = await limitPerPath.fetch(json('/notes', notes));

        expect(response.status).toBe(413);
    });
});

describe('custom-reader', () => {
    it('returns the body set with setRequestBody', async () => {
        const response = await customReader.fetch(post('/events', '{"a":1}\n{"a":2}\n', { 'content-type': 'application/x-ndjson' }));

        expect(await response.json()).toEqual({ count: 2 });
    });

    it('leaves other content types to the parsers', async () => {
        const response = await customReader.fetch(json('/events', { items: [1, 2, 3] }));

        expect(await response.json()).toEqual({ count: 3 });
    });
});

describe('stream', () => {
    it('counts the streamed bytes', async () => {
        const response = await stream.fetch(post('/upload', encode('abcdef')));

        expect(await response.json()).toEqual({ size: 6 });
    });

    it('answers 413 for a content-length over the limit', async () => {
        const response = await stream.fetch(post('/upload', encode('abc'), { 'content-length': String(51 * 1024 * 1024) }));

        expect(response.status).toBe(413);
    });
});

describe('behaviour stated on the pages', () => {
    it('enables json and urlEncoded when no format is set, none else', async () => {
        const options: Options = {};

        body(options);

        expect(options).toEqual({ json: true, urlEncoded: true });

        const textOnly: Options = { text: true };

        body(textOnly);

        expect(textOnly).toEqual({ text: true });
    });

    it('returns {} without the plugin', async () => {
        const app = new App();

        app.post('/', defineCoreHandler((event) => readRequestBody(event)));

        const response = await app.fetch(json('/', { a: 1 }));

        expect(await response.json()).toEqual({});
    });

    it('parses a body without content-type as JSON while json is enabled', async () => {
        const app = create(undefined, (event) => readRequestBody(event));

        expect(await (await app.fetch(post('/', encode('{"a":1}')))).json()).toEqual({ a: 1 });
        expect((await app.fetch(post('/', encode('a=1')))).status).toBe(400);
    });

    it('parses a body without content-type as a form when only urlEncoded is enabled', async () => {
        const app = create({ urlEncoded: true }, (event) => readRequestBody(event));

        expect(await (await app.fetch(post('/', encode('a=1')))).json()).toEqual({ a: '1' });
    });

    it('ignores content-type parameters and case, and matches patterns', async () => {
        const charset = create(undefined, (event) => readRequestBody(event));

        expect(await (await charset.fetch(post('/', '{"a":1}', { 'content-type': 'application/json; charset=utf-8' }))).json()).toEqual({ a: 1 });

        const wildcard = create({ json: { type: 'application/*+json' } }, (event) => readRequestBody(event));

        expect(await (await wildcard.fetch(post('/', '{"a":1}', { 'content-type': 'application/vnd.api+json' }))).json()).toEqual({ a: 1 });
        expect(await (await wildcard.fetch(post('/', '{"a":1}', { 'content-type': 'application/xml' }))).json()).toEqual({});
        expect(await (await charset.fetch(post('/', '{"a":1}', { 'content-type': 'Application/JSON' }))).json()).toEqual({ a: 1 });

        const listed = create({ json: { type: ['application/json', 'application/vnd.api+json'] } }, (event) => readRequestBody(event));

        expect(await (await listed.fetch(post('/', '{"a":1}', { 'content-type': 'application/vnd.api+json' }))).json()).toEqual({ a: 1 });
    });

    it('parses an empty JSON body as {}', async () => {
        const app = create(undefined, (event) => readRequestBody(event));
        const response = await app.fetch(post('/', null, { 'content-type': 'application/json' }));

        expect(await response.json()).toEqual({});
    });

    it('answers 400 for malformed JSON and a primitive in strict mode', async () => {
        const app = create(undefined, (event) => readRequestBody(event));

        const malformed = await app.fetch(post('/', '{a', { 'content-type': 'application/json' }));

        expect(malformed.status).toBe(400);

        const primitive = await app.fetch(post('/', '1', { 'content-type': 'application/json' }));

        expect(primitive.status).toBe(400);
        expect(await primitive.json()).toEqual({ status: 400, message: 'request body must be an object or array in strict mode' });

        const loose = create({ json: { strict: false } }, async (event) => ({ value: await readRequestBody(event), key: await readRequestBody(event, 'a') }));

        expect(await (await loose.fetch(post('/', '1', { 'content-type': 'application/json' }))).json()).toEqual({ value: 1 });
    });

    it('passes the reviver to JSON.parse', async () => {
        const app = create({ json: { reviver: (key, value) => (key === 'at' ? `date:${value}` : value) } }, (event) => readRequestBody(event));
        const response = await app.fetch(json('/', { at: '2026' }));

        expect(await response.json()).toEqual({ at: 'date:2026' });
    });

    it('does not expand bracket keys of a form body', async () => {
        const app = create(undefined, (event) => readRequestBody(event));
        const response = await app.fetch(post('/', 'user[name]=ada', { 'content-type': 'application/x-www-form-urlencoded' }));

        expect(await response.json()).toEqual({ 'user[name]': 'ada' });
    });

    it('resolves a keyed read only for own properties of an object body', async () => {
        const app = create(undefined, async (event) => ({
            index: await readRequestBody(event, '0'),
            inherited: typeof await readRequestBody(event, 'constructor'),
        }));
        const response = await app.fetch(json('/', ['a']));

        expect(await response.json()).toEqual({ inherited: 'undefined' });
    });

    it('returns the cached parsed body on a second read', async () => {
        const app = create(undefined, async (event) => {
            const first = await readRequestBody(event);
            const second = await readRequestBody(event);

            return first === second;
        });

        expect(await (await app.fetch(json('/', { a: 1 }))).json()).toBe(true);
    });

    it('decodes gzip and br bodies', async () => {
        const app = create(undefined, (event) => readRequestBody(event));

        const gzip = await app.fetch(post('/', gzipSync('{"a":1}'), { 'content-type': 'application/json', 'content-encoding': 'gzip' }));

        expect(await gzip.json()).toEqual({ a: 1 });

        const br = await app.fetch(post('/', brotliCompressSync('{"a":1}'), { 'content-type': 'application/json', 'content-encoding': 'br' }));

        expect(await br.json()).toEqual({ a: 1 });
    });

    it('answers 415 for an unsupported content-encoding', async () => {
        const app = create(undefined, (event) => readRequestBody(event));
        const response = await app.fetch(post('/', 'x', { 'content-type': 'application/json', 'content-encoding': 'zstd' }));

        expect(response.status).toBe(415);
    });

    it('checks the limit against the decoded bytes', async () => {
        const app = create({ json: { limit: 10 } }, (event) => readRequestBody(event));
        const compressed = gzipSync(JSON.stringify({ a: 'x'.repeat(100) }));

        expect(compressed.byteLength).toBeLessThan(100);

        const response = await app.fetch(post('/', compressed, { 'content-type': 'application/json', 'content-encoding': 'gzip' }));

        expect(response.status).toBe(413);
    });

    it('rejects a content-length over the limit before reading', async () => {
        const app = create({ json: { limit: '1kb' } }, (event) => readRequestBody(event));
        const response = await app.fetch(post('/', '{}', { 'content-type': 'application/json', 'content-length': '2048' }));

        expect(response.status).toBe(413);
    });

    it('reads a limit string with an unknown unit as bytes and answers 500 for one without a number', async () => {
        const unknownUnit = create({ json: { limit: '2 MiB' } }, (event) => readRequestBody(event));

        expect((await unknownUnit.fetch(json('/', { a: 1 }))).status).toBe(413);

        const noNumber = create({ json: { limit: 'large' } }, (event) => readRequestBody(event));
        const response = await noNumber.fetch(json('/', {}));

        expect(response.status).toBe(500);
        expect(await response.json()).toEqual({ status: 500, message: 'invalid size format: large' });
    });

    it('reads text, bytes, an ArrayBuffer and a Blob whatever the content-type', async () => {
        const app = new App();

        app.post('/text', defineCoreHandler((event) => readRequestBodyText(event)));
        app.post('/bytes', defineCoreHandler(async (event) => (await readRequestBodyBytes(event)).byteLength));
        app.post('/buffer', defineCoreHandler(async (event) => (await readRequestBodyArrayBuffer(event)).byteLength));
        app.post('/blob', defineCoreHandler(async (event) => {
            const blob = await readRequestBodyBlob(event);

            return { type: blob.type, size: blob.size };
        }));

        expect(await (await app.fetch(post('/text', 'hi', { 'content-type': 'application/json' }))).text()).toBe('hi');
        expect(await (await app.fetch(post('/bytes', 'hi', { 'content-type': 'image/png' }))).json()).toBe(2);
        expect(await (await app.fetch(post('/buffer', 'hi', { 'content-type': 'image/png' }))).json()).toBe(2);
        expect(await (await app.fetch(post('/blob', 'hi', { 'content-type': 'image/png' }))).json()).toEqual({ type: 'image/png', size: 2 });
        expect(await (await app.fetch(post('/blob', encode('hi')))).json()).toEqual({ type: 'application/octet-stream', size: 2 });
    });

    it('uses the raw and text options as defaults and lets call options replace them', async () => {
        const app = new App();

        app.use(body({ raw: { limit: 2 }, text: { limit: 2 } }));
        app.post('/bytes', defineCoreHandler(async (event) => (await readRequestBodyBytes(event)).byteLength));
        app.post('/text', defineCoreHandler((event) => readRequestBodyText(event)));
        app.post('/override', defineCoreHandler((event) => readRequestBodyText(event, { limit: 10 })));

        expect((await app.fetch(post('/bytes', 'abc'))).status).toBe(413);
        expect((await app.fetch(post('/text', 'abc'))).status).toBe(413);
        expect(await (await app.fetch(post('/override', 'abc'))).text()).toBe('abc');
    });

    it('does not apply the raw options to readRequestBodyRaw', async () => {
        const app = new App();

        app.use(body({ raw: { limit: 2 } }));
        app.post('/', defineCoreHandler(async (event) => (await readRequestBodyRaw(event)).byteLength));

        expect(await (await app.fetch(post('/', 'abc'))).json()).toBe(3);
    });

    it('decodes text with defaultCharset', async () => {
        const app = create({ text: { defaultCharset: 'latin1' } }, (event) => readRequestBodyText(event));
        const response = await app.fetch(post('/', new Uint8Array([0xE9])));

        expect(await response.text()).toBe('é');
    });

    it('fails a second uncached read with 500 and reuses cached bytes', async () => {
        const uncached = create({ json: true }, async (event) => {
            await readRequestBody(event);

            return readRequestBodyText(event);
        });

        expect((await uncached.fetch(json('/', { a: 1 }))).status).toBe(500);

        const cached = create({ json: true, text: { cache: true } }, async (event) => {
            await readRequestBody(event);

            return readRequestBodyText(event);
        });

        expect(await (await cached.fetch(json('/', { a: 1 }))).text()).toBe('{"a":1}');
    });

    it('returns null from readRequestBodyStream without a body', async () => {
        const app = new App();

        app.post('/', defineCoreHandler((event) => ({ isNull: readRequestBodyStream(event) === null })));

        expect(await (await app.fetch(post('/', null))).json()).toEqual({ isNull: true });
    });

    it('does not count streamed bytes against the limit', async () => {
        const app = new App();

        app.post('/', defineCoreHandler(async (event) => {
            const output = readRequestBodyStream(event, { limit: 2 });

            return new Response(output);
        }));

        expect(await (await app.fetch(post('/', encode('abcdef')))).text()).toBe('abcdef');
    });

    it('lets setRequestBody replace an already parsed body', async () => {
        const app = create(undefined, async (event) => {
            await readRequestBody(event);
            setRequestBody(event, { replaced: true });

            return readRequestBody(event);
        });

        expect(await (await app.fetch(json('/', { a: 1 }))).json()).toEqual({ replaced: true });
    });
});
