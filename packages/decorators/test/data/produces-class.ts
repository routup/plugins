import {
    DController,
    DGet,
    DProduces,
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
}
