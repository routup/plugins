import type { IAppEvent } from 'routup';
import {
    DContext,
    DController,
    DGet,
    DProduces,
} from '../../src';

type Report = {
    title: string
};

@DController('/produces-types')
export class ProducesTypesController {
    @DGet('sheet')
    @DProduces('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    sheet(): Uint8Array {
        return new Uint8Array([1]);
    }

    @DGet('archive')
    @DProduces('application/x-tar')
    archive(): Buffer {
        return Buffer.from('foo');
    }

    @DGet('stream')
    @DProduces('application/wasm')
    async stream(): Promise<ReadableStream> {
        return new ReadableStream();
    }

    @DGet('handover')
    @DProduces('application/zip')
    handover(
        @DContext() event: IAppEvent,
    ): Promise<Response | undefined> {
        return event.next();
    }

    @DGet('typed')
    @DProduces('application/pdf')
    typed(): Report {
        return { title: 'foo' };
    }

    @DGet('text')
    @DProduces('application/pdf')
    text(): string {
        return 'foo';
    }

    @DGet('json-bytes')
    @DProduces('application/vnd.api+json')
    jsonBytes(): Uint8Array {
        return new Uint8Array([1]);
    }

    @DGet('mixed')
    @DProduces('application/pdf', 'text/plain')
    mixed(): Uint8Array {
        return new Uint8Array([1]);
    }
}
