import { App } from 'routup';
import { DController, DGet, decorators } from '@routup/decorators';

@DController('/users')
class UserController {
    @DGet('')
    list() {
        return [{ id: '1' }];
    }
}

@DController('/teams')
class TeamController {
    @DGet('')
    list() {
        return [{ id: 't1' }];
    }
}

export const app = new App();

// GET /api/v1/users and GET /api/v1/teams
app.use('/api/v1', decorators({ controllers: [UserController, TeamController] }));
