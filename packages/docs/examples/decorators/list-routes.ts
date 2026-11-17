import {
    DController,
    DGet,
    DPost,
    getControllerRoutes,
} from '@routup/decorators';

class Authenticate {
    run() {}
}

@DController(['/users', '/members'], [Authenticate])
class UserController {
    @DGet('')
    list() {
        return [];
    }

    @DPost('/:id/invite')
    invite() {
        return null;
    }
}

// the class is not instantiated, the middleware is not listed
export const routes = getControllerRoutes(UserController);
// [
//     { method: 'GET', path: '/users' },
//     { method: 'POST', path: '/users/:id/invite' },
//     { method: 'GET', path: '/members' },
//     { method: 'POST', path: '/members/:id/invite' },
// ]
