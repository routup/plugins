import type { IAppEvent } from 'routup';
import {
    DBody,
    DContext,
    DController,
    DGet,
    DPost,
    DStatus,
} from '../../src';

type StatusAcceptedResponse = {
    foo: string
};

@DController('/status')
export class StatusController {
    @DStatus(202)
    @DPost('accepted')
    accept(
        @DBody() body: { foo: string },
    ): StatusAcceptedResponse {
        return body;
    }

    @DGet('created')
    @DStatus(201)
    create(): string {
        return 'created';
    }

    @DStatus(201)
    @DGet('override')
    override(
        @DContext() event: IAppEvent,
    ): string {
        event.response.status = 200;

        return 'override';
    }

    @DStatus(201)
    @DGet('raw')
    raw(): Response {
        return new Response('raw', { status: 203 });
    }
}
