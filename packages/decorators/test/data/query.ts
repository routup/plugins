import {
    DController,
    DGet,
    DQuery,
} from '../../src';

@DController('/query')
export class QueryController {
    @DGet('many')
    getMany(
        @DQuery() query: Record<string, any>,
    ) {
        return query;
    }

    @DGet('single')
    get(
        @DQuery('foo') foo: string,
    ) {
        return foo;
    }
}
