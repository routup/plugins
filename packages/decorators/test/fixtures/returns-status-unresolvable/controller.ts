import { DController, DGet, DReturns } from '../../../src';

function conflict(): number {
    return 409;
}

@DController('/unresolvable')
export class UnresolvableController {
    @DGet('')
    @DReturns(conflict(), 'Conflict')
    read(): string {
        return 'id';
    }
}
