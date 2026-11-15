import {
    DBody,
    DController,
    DDelete,
    DGet,
    DPatch,
    DPath,
    DPost,
    DPut,
    DReturns,
    DStatus,
} from '../../src';

type UserInput = {
    name: string
};

type UserPayload = {
    id: string
};

type ConflictPayload = {
    conflict: string
};

type ValidationPayload = {
    errors: string[]
};

type NotFoundPayload = {
    missing: string
};

type UnauthorizedPayload = {
    reason: string
};

@DController('/returns')
@DReturns<UnauthorizedPayload>(401)
@DReturns<ValidationPayload>(400, 'Class level')
export class ReturnsController {
    @DPost('')
    @DReturns<ConflictPayload>(409, 'User exists')
    @DReturns<ValidationPayload>(400)
    async create(
        @DBody() data: UserInput,
    ): Promise<UserPayload> {
        return { id: data.name };
    }

    @DPut('/:name')
    @DStatus(201)
    @DReturns<UserPayload>(201, 'Created')
    @DReturns<UserPayload>(202, 'Accepted')
    async upsert(
        @DPath('name') name: string,
    ): Promise<UserPayload> {
        return { id: name };
    }

    @DDelete('/:name')
    @DReturns(204)
    async remove(
        @DPath('name') _name: string,
    ): Promise<void> {
        // no content
    }

    @DPatch('/:name')
    @DReturns(200, 'Patched')
    async patch(
        @DPath('name') name: string,
    ): Promise<UserPayload> {
        return { id: name };
    }

    @DGet('/:name')
    @DReturns<NotFoundPayload>('404', 'Missing')
    async read(
        @DPath('name') name: string,
    ): Promise<UserPayload> {
        return { id: name };
    }
}
