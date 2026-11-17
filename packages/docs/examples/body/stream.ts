import { App, defineCoreHandler } from 'routup';
import { readRequestBodyStream } from '@routup/body';

export const app = new App();

app.post('/upload', defineCoreHandler(async (event) => {
    // checks content-length only; the bytes are not counted
    const stream = readRequestBodyStream(event, { limit: '50mb' });

    let size = 0;

    if (stream) {
        for await (const chunk of stream) {
            // write the chunk to disk or object storage here
            size += chunk.byteLength;
        }
    }

    return { size };
}));
