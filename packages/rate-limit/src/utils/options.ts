import type { IRoutupEvent } from 'routup';
import { getRequestIP } from 'routup';
import { RETRY_AGAIN_MESSAGE } from '../constants';
import { MemoryStore } from '../store';
import type { Options, OptionsInput, ValueDeterminingMiddleware } from '../type';

export function buildHandlerOptions(input?: OptionsInput) : Options {
    input = input || {};

    const options : Options = {
        windowMs: 60 * 1000,
        max: 5,
        message: RETRY_AGAIN_MESSAGE,
        statusCode: 429,
        skipFailedRequest: false,
        skipSuccessfulRequest: false,
        requestWasSuccessful: (_event: IRoutupEvent, response: Response): boolean => response.status < 400,
        skip: (_event: IRoutupEvent): boolean => false,
        keyGenerator: (event: IRoutupEvent): string => getRequestIP(event, { trustProxy: true }) || '127.0.0.1',
        async handler(
            event: IRoutupEvent,
            _optionsUsed: Options,
        ): Promise<unknown> {
            const message: unknown = typeof options.message === 'function' ?
                await (options.message as ValueDeterminingMiddleware<any>)(
                    event,
                ) :
                options.message;

            event.response.status = options.statusCode;

            return message ?? 'Too many requests, please try again later.';
        },
        ...input,

        store: input.store || new MemoryStore(),
    };

    return options;
}
