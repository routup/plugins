import { Response, send } from 'routup';
import {
    DBody, DController, DPost, DResponse,
} from '../../src';

@DController('/post')
export class PostController {
    @DPost('many')
    postMany(
    @DResponse() res: Response,
        @DBody() body: { foo: string },
    ) {
        send(res, body);
    }

    @DPost('single')
    post(
    @DResponse() res: Response,
        @DBody('foo') foo: string,
    ) {
        send(res, foo);
    }
}
