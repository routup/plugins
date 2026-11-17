import { App } from 'routup';
import { body } from '@routup/body';
import { cookie } from '@routup/cookie';
import {
    DBody,
    DController,
    DCookie,
    DPost,
    DQuery,
    decorators,
} from '@routup/decorators';
import { query } from '@routup/query';

@DController('/items')
class ItemController {
    @DPost('')
    create(
        @DBody('name') name: string | undefined,
        @DQuery('dryRun') dryRun: string | undefined,
        @DCookie('session') session: string | undefined,
    ) {
        return {
            name,
            dryRun,
            session,
        };
    }
}

export const app = new App();

// the parsers first: decorators() adds the controller routes where it is installed
app.use(body());
app.use(query());
app.use(cookie());
app.use(decorators({ controllers: [ItemController] }));
