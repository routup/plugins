// eslint-disable-next-line max-classes-per-file
import type { Next } from 'routup';
import {
    Request, Response, send,
    setRequestEnv, useRequestEnv,
} from 'routup';
import type { HandlerInterface } from '../../src';
import {
    DController, DGet, DRequest, DResponse,
} from '../../src';

class DummyMiddleware implements HandlerInterface {
    run(request: Request, response: Response, next: Next): Promise<void> | void {
        setRequestEnv(request, 'key', 'value');

        next();
    }
}

@DController('/middleware', [DummyMiddleware])
export class MiddlewareController {
    @DGet('')
    async middleware(
    @DRequest() req: Request,
        @DResponse() res: Response,
    ) {
        send(res, useRequestEnv(req, 'key'));
    }
}
