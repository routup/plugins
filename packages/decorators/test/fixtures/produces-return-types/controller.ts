import {
    DController,
    DGet,
    DProduces,
    DReturns,
    DStatus,
} from '../../../src';

type Report = {
    title: string
};

type Download = Response;

@DController('/types')
export class ReturnTypesController {
    @DGet('nullable')
    @DProduces('application/pdf')
    nullable(): Response | null {
        return null;
    }

    @DGet('alias')
    @DProduces('application/pdf')
    alias(): Download {
        return new Response();
    }

    @DGet('bytes-or-text')
    @DProduces('application/pdf')
    bytesOrText(): Uint8Array | string {
        return 'foo';
    }

    @DGet('blob')
    @DProduces('application/pdf')
    blob(): Blob {
        return new Blob();
    }

    @DGet('file')
    @DProduces('application/pdf')
    file(): File {
        return new File([], 'foo');
    }

    @DGet('nothing')
    @DProduces('application/pdf')
    async nothing(): Promise<void> {
        // answers through the event
    }

    @DGet('typed-or-nothing')
    @DProduces('application/pdf')
    typedOrNothing(): Report | undefined {
        return undefined;
    }

    @DGet('json')
    @DProduces('application/json')
    json(): Response {
        return new Response();
    }

    @DGet('xml')
    @DProduces('text/xml')
    xml(): Response {
        return new Response();
    }

    @DGet('yaml')
    @DProduces('application/yaml')
    yaml(): Response {
        return new Response();
    }

    @DGet('wildcard')
    @DProduces('*/*')
    wildcard(): Response {
        return new Response();
    }

    @DGet('mixed')
    @DProduces('image/png', 'application/json')
    mixed(): Response {
        return new Response();
    }

    @DGet('empty')
    @DProduces('')
    empty(): string {
        return 'foo';
    }

    @DGet('declared')
    @DReturns<Report>(200)
    @DProduces('application/pdf')
    async declared(): Promise<void> {
        // answers through the event
    }

    @DGet('no-content')
    @DStatus(204)
    @DProduces('application/pdf')
    noContent(): null {
        return null;
    }
}
