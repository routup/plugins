import {
    DBody,
    DController,
    DPost,
} from '../../src';

@DController('/post')
export class PostController {
    @DPost('many')
    postMany(
        @DBody() body: { foo: string },
    ) {
        return body;
    }

    @DPost('single')
    post(
        @DBody('foo') foo: string,
    ) {
        return foo;
    }
}
