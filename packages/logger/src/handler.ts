import type { IRoutupEvent } from 'routup';
import { defineCoreHandler } from 'routup';
import { resolveFormat } from './formats';
import { StartTimeSymbol, defaultTokens } from './tokens';
import type { Options, TokenMap } from './types';

export function createHandler(options: Options = {}) {
    const formatter = resolveFormat(options.format ?? 'tiny');
    const tokens: TokenMap = {
        ...defaultTokens,
        ...(options.tokens ?? {}),
    };
    const { skip } = options;
    const write = options.write ?? ((line) => {
        // eslint-disable-next-line no-console
        console.log(line);
    });
    const immediate = options.immediate ?? false;

    const emit = (event: IRoutupEvent, response: Response | undefined): void => {
        if (skip && skip(event, response)) {
            return;
        }

        const line = formatter(tokens, event, response);
        if (line === undefined) {
            return;
        }

        try {
            write(line);
        } catch {
            // swallow log-sink failures — logging must not break the request path
        }
    };

    return defineCoreHandler(async (event) => {
        (event.store as Record<string | symbol, unknown>)[StartTimeSymbol] = performance.now();

        if (immediate) {
            emit(event, undefined);
            return event.next();
        }

        const response = await event.next();
        emit(event, response);
        return response;
    });
}
