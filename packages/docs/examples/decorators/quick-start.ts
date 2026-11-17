import { App } from 'routup';
import {
    DController,
    DGet,
    DPath,
    decorators,
} from '@routup/decorators';

@DController('/users')
class UserController {
    @DGet('/:id')
    show(@DPath('id') id: string) {
        return { id };
    }
}

export const app = new App();

app.use(decorators({ controllers: [UserController] }));
