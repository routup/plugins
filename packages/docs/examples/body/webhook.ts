import { App, defineCoreHandler } from 'routup';
import { body, readRequestBody, readRequestBodyArrayBuffer } from '@routup/body';

export const app = new App();

const key = crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode('webhook-secret'),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
);

function fromHex(input: string): Uint8Array<ArrayBuffer> {
    // Uint8Array.fromHex() is not available on Node.js 24
    // eslint-disable-next-line unicorn/prefer-uint8array-hex
    return new Uint8Array((input.match(/../g) ?? []).map((byte) => Number.parseInt(byte, 16)));
}

// keep the raw bytes, so the JSON parser reuses them
app.use(body({ json: true, raw: { limit: '1mb', cache: true } }));

app.post('/webhook', defineCoreHandler(async (event) => {
    const bytes = await readRequestBodyArrayBuffer(event);
    const signature = fromHex(event.headers.get('x-signature') ?? '');

    if (!await crypto.subtle.verify('HMAC', await key, signature, bytes)) {
        event.response.status = 401;

        return { error: 'invalid signature' };
    }

    const payload = await readRequestBody(event);

    return { received: payload.type };
}));
