import {
    DController,
    DGet,
    DProduces,
    DReturns,
} from '../../src';

@DController('/produces-class')
@DProduces('text/html')
export class ProducesClassController {
    @DGet('')
    page(): string {
        return '<p>foo</p>';
    }

    @DGet('method')
    @DProduces('text/plain')
    method(): string {
        return 'foo';
    }

    @DGet('with-error')
    @DReturns<{ message: string }>(404)
    withError(): string {
        return '<p>foo</p>';
    }
}
