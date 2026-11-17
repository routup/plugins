import { App } from 'routup';
import { DController, DGet, decorators } from '@routup/decorators';

class BaseController {
    @DGet('/health')
    health() {
        return 'ok';
    }
}

// answers GET /users/health and GET /users
@DController('/users')
export class UserController extends BaseController {
    @DGet('')
    list() {
        return [];
    }
}

export const app = new App();

app.use(decorators({ controllers: [UserController] }));
