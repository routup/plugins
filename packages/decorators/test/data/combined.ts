// eslint-disable-next-line max-classes-per-file
import {
    Next,
    Request,
    Response,
    useRequestParam,
} from 'routup';
import type { HandlerInterface } from '../../src';
import {
    DController,
    DDelete,
    DGet,
    DNext,
    DPatch,
    DPath,
    DPaths,
    DPost,
    DPut,
    DRequest,
    DResponse,
} from '../../src';

export class DeleteMiddleware implements HandlerInterface {
    run(request: Request, response: Response, next: Next): Promise<void> | void {
        const id = useRequestParam(request, 'id');

        if (typeof id !== 'string' || id.length < 3) {
            throw new Error();
        }

        next();
    }
}

@DController('/combined')
export class CombinedController {
    @DGet('')
    async getMany(
    @DRequest() req: Request,
        @DResponse() res: Response,
        @DNext() next: Next,
    ) {
        return 'many';
    }

    @DGet('/:id')
    async getOne(
    @DRequest() req: Request,
        @DResponse() res: Response,
        @DPath('id') id: string,
    ) {
        return id;
    }

    @DPost('')
    async create(
    @DRequest() req: Request,
        @DResponse() res: Response,
    ) {
        return 'create';
    }

    @DPut('')
    async put(
    @DRequest() req: Request,
        @DResponse() res: Response,
    ) {
        return 'put';
    }

    @DPatch('')
    async patch(
    @DRequest() req: Request,
        @DResponse() res: Response,
    ) {
        return 'patch';
    }

    @DDelete('/:id', [DeleteMiddleware])
    async delete(
    @DRequest() req: Request,
        @DResponse() res: Response,
        @DPaths() data: { id: string },
    ) {
        return data;
    }
}
