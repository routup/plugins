import { DController, DGet, DProduces } from '../../../src';

function mediaType(): string {
    return 'application/pdf';
}

@DController('/unresolvable')
export class UnresolvableProducesController {
    @DGet('')
    @DProduces(mediaType())
    read(): string {
        return 'id';
    }
}
