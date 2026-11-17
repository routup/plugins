import { App } from 'routup';
import type { ClassType } from '@routup/decorators';
import {
    DController,
    createMethodDecorator,
    decorators,
} from '@routup/decorators';

export function DOptions(path: string, middlewares?: ClassType[]): MethodDecorator {
    return createMethodDecorator('options', path, middlewares);
}

@DController('/uploads')
class UploadController {
    @DOptions('')
    options() {
        return { methods: ['OPTIONS', 'PUT'] };
    }
}

export const app = new App();

app.use(decorators({ controllers: [UploadController] }));
