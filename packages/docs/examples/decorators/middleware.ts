import type { IAppEvent } from 'routup';
import { App, createError } from 'routup';
import type { HandlerInterface } from '@routup/decorators';
import {
    DContext,
    DController,
    DGet,
    decorators,
} from '@routup/decorators';

const UserKey = Symbol.for('app:user');

class RequireToken implements HandlerInterface {
    run(event: IAppEvent) {
        if (event.headers.get('authorization') !== 'Bearer secret') {
            throw createError({ status: 401, message: 'Unauthorized' });
        }

        event.store[UserKey] = 'ada';

        return event.next();
    }
}

class MarkAudited implements HandlerInterface {
    run(event: IAppEvent) {
        event.response.headers.set('x-audited', 'true');

        return event.next();
    }
}

// RequireToken runs for every request under /account
@DController('/account', [RequireToken])
class AccountController {
    // MarkAudited runs for GET /account only
    @DGet('', [MarkAudited])
    show(@DContext() event: IAppEvent) {
        return { user: event.store[UserKey] };
    }

    @DGet('/settings')
    settings() {
        return { theme: 'dark' };
    }
}

export const app = new App();

app.use(decorators({ controllers: [AccountController] }));
