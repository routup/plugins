import { DController, DGet, DReturns } from '../../../src';

@DController('/invalid')
export class InvalidStatusController {
    @DGet('')
    @DReturns('abc')
    read(): string {
        return 'id';
    }
}
