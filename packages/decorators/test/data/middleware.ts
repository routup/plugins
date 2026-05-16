// eslint-disable-next-line max-classes-per-file
import type { IAppEvent } from 'routup';
import type { HandlerInterface } from '../../src';
import {
    DContext,
    DController,
    DGet,
} from '../../src';

const MIDDLEWARE_KEY = Symbol.for('routup:test:middleware-key');

class DummyMiddleware implements HandlerInterface {
    run(event: IAppEvent) {
        event.store[MIDDLEWARE_KEY] = 'value';

        return event.next();
    }
}

@DController('/middleware', [DummyMiddleware])
export class MiddlewareController {
    @DGet('')
    async middleware(
        @DContext() event: IAppEvent,
    ) {
        return event.store[MIDDLEWARE_KEY];
    }
}
