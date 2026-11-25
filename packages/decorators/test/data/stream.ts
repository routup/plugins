import type { IAppEvent } from 'routup';
import {
    DContext,
    DController,
    DGet,
    DPost,
    DProduces,
    DStatus,
} from '../../src';

@DController('/stream')
export class StreamController {
    closed = false;

    @DPost('lines')
    @DStatus(201)
    @DProduces('text/csv')
    * lines(): Generator<string> {
        yield 'a,b\n';
        yield 'c,d\n';
    }

    @DGet('events')
    @DProduces('text/event-stream')
    async* events(): AsyncGenerator<string> {
        yield 'data: 1\n\n';
        yield 'data: 2\n\n';
    }

    @DGet('endless')
    @DProduces('text/plain')
    async* endless(): AsyncGenerator<string> {
        try {
            for (let i = 0; ; i++) {
                yield `${i}\n`;
            }
        } finally {
            this.closed = true;
        }
    }

    @DPost('own')
    @DStatus(201)
    @DProduces('text/csv')
    async* own(@DContext() event: IAppEvent): AsyncGenerator<string> {
        event.response.status = 202;
        event.response.headers.set('content-type', 'text/plain');

        yield 'a';
    }

    // eslint-disable-next-line require-yield
    @DPost('error')
    @DStatus(201)
    @DProduces('text/csv')
    async* error(): AsyncGenerator<string> {
        throw new Error('Before the first chunk');
    }
}
