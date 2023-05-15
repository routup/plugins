import {
    Request,
    Response,
    send,
} from 'routup';
import {
    DController,
    DGet, DHeader,
    DHeaders,
    DRequest,
    DResponse,
} from '../../src';

@DController('/header')
export class HeaderController {
    @DGet('/many')
    async headers(
    @DRequest() req: Request,
        @DResponse() res: Response,
        @DHeaders() headers: Record<string, any>,
    ) {
        send(res, headers);
    }

    @DGet('/single')
    async header(
    @DRequest() req: Request,
        @DResponse() res: Response,
        @DHeader('connection') header: string,
    ) {
        send(res, header);
    }
}
