import { DController, DGet, DReturns } from '../../../src';
import { HTTP_CONFLICT } from './codes';

type UserPayload = {
    id: string
};

type ConflictPayload = {
    conflict: string
};

@DController('/constant')
export class ConstantController {
    @DGet('')
    @DReturns<ConflictPayload>(HTTP_CONFLICT, 'Conflict')
    read(): UserPayload {
        return { id: 'id' };
    }
}
