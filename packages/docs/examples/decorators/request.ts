import type { AppResponse } from 'routup';
import { App } from 'routup';
import {
    DController,
    DGet,
    DHeader,
    DPath,
    DPaths,
    DRequest,
    DResponse,
    decorators,
} from '@routup/decorators';

@DController('/files')
class FileController {
    @DGet('/:folder/:name')
    show(
        @DPath('name') name: string,
        @DPaths() params: Record<string, string | undefined>,
        @DHeader('Accept-Language') language: string | null,
        @DRequest() request: Request,
        @DResponse() response: AppResponse,
    ) {
        response.headers.set('cache-control', 'no-store');

        return {
            name,
            params,
            language,
            method: request.method,
        };
    }
}

export const app = new App();

// these decorators read the request event: no parser plugin needed
app.use(decorators({ controllers: [FileController] }));
