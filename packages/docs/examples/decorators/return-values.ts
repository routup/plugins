import type { IAppEvent } from 'routup';
import { App } from 'routup';
import {
    DContext,
    DController,
    DGet,
    DPost,
    decorators,
} from '@routup/decorators';

@DController('/orders')
class OrderController {
    @DGet('')
    list() {
        return [{ id: 1 }, { id: 2 }];
    }

    @DGet('/greeting')
    greeting() {
        return 'hello';
    }

    @DGet('/logo')
    logo() {
        return new Response(new Uint8Array([137, 80, 78, 71]), { headers: { 'content-type': 'image/png' } });
    }

    @DPost('')
    create(@DContext() event: IAppEvent) {
        event.response.status = 201;

        return { message: 'created' };
    }
}

export const app = new App();

app.use(decorators({ controllers: [OrderController] }));
