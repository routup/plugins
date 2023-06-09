import {
    Response, send,
} from 'routup';
import {
    DController, DGet, DQuery, DResponse,
} from '../../src';

@DController('/query')
export class QueryController {
    @DGet('many')
    getMany(
    @DResponse() res: Response,
        @DQuery() query: Record<string, any>,
    ) {
        send(res, query);
    }

    @DGet('single')
    get(
    @DResponse() res: Response,
        @DQuery('foo') foo: string,
    ) {
        send(res, foo);
    }
}
