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
        @DHeaders() headers: Record<string, any>,
    ) {
        return headers;
    }

    @DGet('/single')
    async header(
        @DHeader('connection') header: string,
    ) {
        return header;
    }
}
