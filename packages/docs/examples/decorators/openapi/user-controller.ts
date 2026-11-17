import {
    DBody,
    DController,
    DGet,
    DPath,
    DPost,
    DReturns,
    DSecurity,
    DStatus,
    DTags,
} from '@routup/decorators';

type User = { id: string, name: string };

type UserInput = { name: string };

type Problem = { message: string };

@DTags('users')
@DController('/users')
@DReturns<Problem>(401)
export class UserController {
    @DGet('/:id')
    @DSecurity(['users:read'], 'bearer')
    @DReturns<Problem>(404, 'No such user')
    show(@DPath('id') id: string): User {
        return { id, name: 'Ada' };
    }

    @DStatus(201)
    @DPost('')
    create(@DBody() input: UserInput): User {
        return { id: '2', name: input.name };
    }
}
