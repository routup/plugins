// eslint-disable-next-line max-classes-per-file
import type { IAppEvent } from 'routup';
import type { HandlerInterface } from '../../src';
import {
    DContext,
    DController,
    DDelete,
    DGet,
    DPatch,
    DPath,
    DPaths,
    DPost,
    DPut,
} from '../../src';

export class DeleteMiddleware implements HandlerInterface {
    run(event: IAppEvent) {
        const { id } = event.params;

        if (typeof id !== 'string' || id.length < 3) {
            throw new Error();
        }

        return event.next();
    }
}

@DController('/combined')
export class CombinedController {
    @DGet('')
    async getMany() {
        return 'many';
    }

    @DGet('/:id')
    async getOne(
        @DPath('id') id: string,
    ) {
        return id;
    }

    @DPost('')
    async create() {
        return 'create';
    }

    @DPut('')
    async put() {
        return 'put';
    }

    @DPatch('')
    async patch() {
        return 'patch';
    }

    @DDelete('/:id', [DeleteMiddleware])
    async delete(
        @DPaths() data: { id: string },
    ) {
        return data;
    }
}
