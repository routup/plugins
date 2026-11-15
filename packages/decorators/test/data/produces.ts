import type { IAppEvent } from 'routup';
import { createError } from 'routup';
import {
    DContext,
    DController,
    DDescription,
    DGet,
    DPost,
    DProduces,
    DStatus,
} from '../../src';

@DController('/produces')
export class ProducesController {
    @DGet('events')
    @DProduces('text/event-stream')
    events(): Response {
        return new Response('data: foo\n\n', { headers: { 'content-type': 'text/event-stream' } });
    }

    @DGet('csv')
    @DProduces('text/csv', 'text/plain')
    csv(): string {
        return 'a,b';
    }

    @DGet('own')
    @DProduces('text/csv')
    own(
        @DContext() event: IAppEvent,
    ): string {
        event.response.headers.set('content-type', 'text/plain');

        return 'a,b';
    }

    @DGet('error')
    @DProduces('text/event-stream')
    error(): string {
        throw createError({ status: 404, message: 'Not found' });
    }

    @DGet('download')
    @DProduces('application/octet-stream')
    download(): Uint8Array {
        return new Uint8Array([1, 2, 3]);
    }

    @DGet('raw')
    @DProduces('application/octet-stream')
    raw(): Response {
        return new Response(new Uint8Array([1, 2, 3]), { headers: { 'x-raw': 'true' } });
    }

    @DGet('described')
    @DDescription(200, 'The file')
    @DProduces('application/pdf')
    described(): Uint8Array {
        return new Uint8Array([1]);
    }

    @DGet('described-last')
    @DProduces('application/pdf')
    @DDescription(200, 'The file')
    describedLast(): Uint8Array {
        return new Uint8Array([1]);
    }

    @DGet('with-error')
    @DProduces('application/octet-stream')
    @DDescription<{ message: string }>(404, 'Not found')
    withError(): Uint8Array {
        return new Uint8Array([1]);
    }

    @DPost('status-first')
    @DStatus(201)
    @DProduces('image/png')
    statusFirst(): Uint8Array {
        return new Uint8Array([1]);
    }

    @DPost('status-last')
    @DProduces('image/png')
    @DStatus(201)
    statusLast(): Uint8Array {
        return new Uint8Array([1]);
    }

    @DGet('json')
    @DProduces('application/xml')
    json(): { foo: string } {
        return { foo: 'bar' };
    }
}
