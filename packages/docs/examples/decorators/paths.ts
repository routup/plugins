import { App } from 'routup';
import {
    DController,
    DGet,
    DPath,
    decorators,
} from '@routup/decorators';

// every method answers under both paths
@DController(['/users', '/members'])
export class UserController {
    @DGet('')
    list() {
        return [{ id: '1' }];
    }

    // no leading slash needed: this is /users/:id and /members/:id
    @DGet(':id')
    show(@DPath('id') id: string) {
        return { id };
    }
}

export const app = new App();

app.use(decorators({ controllers: [UserController] }));
