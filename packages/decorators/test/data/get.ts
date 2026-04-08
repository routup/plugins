import type { IRoutupEvent } from 'routup';
import {
    DController,
    DExample,
    DGet,
    DPath,
    DPaths,
} from '../../src';

type GetManyResponse = {
    foo: string
};

@DController('/get')
export class GetController {
    @DGet('many')
    @DExample<GetManyResponse>({ foo: 'bar' })
    getMany() {
        return null;
    }

    @DGet(':id')
    get(
        @DPath('id') foo: string,
    ) {
        return foo;
    }

    @DGet(':id/:foo')
    getNested(
        @DPaths() foo: { id: string, foo: string },
    ) {
        return foo;
    }
}
