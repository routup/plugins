import type { IAppEvent } from 'routup';
import { createError } from 'routup';
import {
    DContext,
    DController,
    DDescription,
    DGet,
    DPost,
    DProduces,
    DReturns,
    DStatus,
} from '../../src';

type ProducedFile = {
    name: string
};

type ExplicitOk = {
    ok: boolean
};

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

    @DPost('returns-srp')
    @DStatus(201)
    @DReturns(201, 'Created')
    @DProduces('application/pdf')
    returnsSRP(): Uint8Array {
        return new Uint8Array([1]);
    }

    @DPost('returns-spr')
    @DStatus(201)
    @DProduces('application/pdf')
    @DReturns(201, 'Created')
    returnsSPR(): Uint8Array {
        return new Uint8Array([1]);
    }

    @DPost('returns-rsp')
    @DReturns(201, 'Created')
    @DStatus(201)
    @DProduces('application/pdf')
    returnsRSP(): Uint8Array {
        return new Uint8Array([1]);
    }

    @DPost('returns-rps')
    @DReturns(201, 'Created')
    @DProduces('application/pdf')
    @DStatus(201)
    returnsRPS(): Uint8Array {
        return new Uint8Array([1]);
    }

    @DPost('returns-psr')
    @DProduces('application/pdf')
    @DStatus(201)
    @DReturns(201, 'Created')
    returnsPSR(): Uint8Array {
        return new Uint8Array([1]);
    }

    @DPost('returns-prs')
    @DProduces('application/pdf')
    @DReturns(201, 'Created')
    @DStatus(201)
    returnsPRS(): Uint8Array {
        return new Uint8Array([1]);
    }

    @DPost('returns-typed-prs')
    @DProduces('application/pdf')
    @DReturns<ProducedFile>(201, 'Created')
    @DStatus(201)
    returnsTypedPRS(): Uint8Array {
        return new Uint8Array([1]);
    }

    @DPost('returns-typed-srp')
    @DStatus(201)
    @DReturns<ProducedFile>(201, 'Created')
    @DProduces('application/pdf')
    returnsTypedSRP(): Uint8Array {
        return new Uint8Array([1]);
    }

    @DPost('explicit-ok-spr')
    @DStatus(201)
    @DProduces('application/pdf')
    @DReturns<ExplicitOk>(200, 'Explicit 200')
    explicitOkSPR(): Uint8Array {
        return new Uint8Array([1]);
    }

    @DPost('explicit-ok-srp')
    @DStatus(201)
    @DReturns<ExplicitOk>(200, 'Explicit 200')
    @DProduces('application/pdf')
    explicitOkSRP(): Uint8Array {
        return new Uint8Array([1]);
    }

    @DPost('explicit-ok-psr')
    @DProduces('application/pdf')
    @DStatus(201)
    @DReturns<ExplicitOk>(200, 'Explicit 200')
    explicitOkPSR(): Uint8Array {
        return new Uint8Array([1]);
    }

    @DPost('explicit-ok-prs')
    @DProduces('application/pdf')
    @DReturns<ExplicitOk>(200, 'Explicit 200')
    @DStatus(201)
    explicitOkPRS(): Uint8Array {
        return new Uint8Array([1]);
    }

    @DPost('explicit-ok-rsp')
    @DReturns<ExplicitOk>(200, 'Explicit 200')
    @DStatus(201)
    @DProduces('application/pdf')
    explicitOkRSP(): Uint8Array {
        return new Uint8Array([1]);
    }

    @DPost('explicit-ok-rps')
    @DReturns<ExplicitOk>(200, 'Explicit 200')
    @DProduces('application/pdf')
    @DStatus(201)
    explicitOkRPS(): Uint8Array {
        return new Uint8Array([1]);
    }

    @DGet('json')
    @DProduces('application/xml')
    json(): { foo: string } {
        return { foo: 'bar' };
    }
}
