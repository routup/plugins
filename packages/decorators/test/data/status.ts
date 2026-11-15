import type { IAppEvent } from 'routup';
import { createError } from 'routup';
import {
    DBody,
    DConsumes,
    DContext,
    DController,
    DGet,
    DPost,
    DProduces,
    DStatus,
} from '../../src';

type StatusAcceptedResponse = {
    foo: string
};

@DController('/status')
export class StatusController {
    @DStatus(202)
    @DConsumes('application/json')
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
        event.response.status = 202;

        return 'override';
    }

    @DStatus(201)
    @DGet('raw')
    raw(): Response {
        return new Response('raw', { status: 203 });
    }

    @DStatus(201)
    @DGet('error')
    error(): string {
        throw createError({ status: 404, message: 'Not found' });
    }

    @DStatus(201)
    @DProduces('application/pdf')
    @DGet('next')
    async next(
        @DContext() event: IAppEvent,
    ): Promise<void> {
        await event.next();
    }

    @DStatus(201)
    @DProduces('application/pdf')
    @DGet('next-returned')
    next2(
        @DContext() event: IAppEvent,
    ): Promise<Response | undefined> {
        return event.next();
    }

    @DStatus(204)
    @DGet('empty')
    empty(): null {
        return null;
    }
}
