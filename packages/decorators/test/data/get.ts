import { Response, send } from 'routup';
import {
    DController, DExample, DGet, DPath, DPaths,
    DResponse,
} from '../../src';

type GetManyResponse = {
    foo: string
};

@DController('/get')
export class GetController {
    @DGet('many')
    @DExample<GetManyResponse>({ foo: 'bar' })
    getMany(
    @DResponse() res: Response,
    ) {
        send(res);
    }

    @DGet(':id')
    get(
    @DResponse() res: Response,
        @DPath('id') foo: string,
    ) {
        send(res, foo);
    }

    @DGet(':id/:foo')
    getNested(
    @DResponse() res: Response,
        @DPaths() foo: {id: string, foo: string},
    ) {
        send(res, foo);
    }
}
