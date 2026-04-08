import {
    DController,
    DGet,
    DHeader,
    DHeaders,
} from '../../src';

@DController('/header')
export class HeaderController {
    @DGet('/many')
    async headers(
        @DHeaders() headers: Headers,
    ) {
        const obj: Record<string, string> = {};
        headers.forEach((value, key) => {
            obj[key] = value;
        });
        return obj;
    }

    @DGet('/single')
    async header(
        @DHeader('connection') header: string,
    ) {
        return header;
    }
}
