import { DController, DPost, DStatus } from '../../../src';

function created(): number {
    return 201;
}

@DController('/unresolvable')
export class UnresolvableStatusController {
    @DPost('')
    @DStatus(created())
    create(): string {
        return 'id';
    }
}
