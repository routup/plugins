import {
    DController,
    DGet,
    DPost,
    DReturns,
    DStatus,
} from '../../../src';
import { HTTP_CONFLICT, HttpStatus } from './codes';

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
    @DReturns(HttpStatus.NotFound)
    read(): UserPayload {
        return { id: 'id' };
    }

    @DPost('')
    @DStatus(HttpStatus.Created)
    create(): UserPayload {
        return { id: 'id' };
    }
}
