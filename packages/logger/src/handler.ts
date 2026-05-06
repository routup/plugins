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

    return defineCoreHandler(async (event) => {
        (event.store as Record<string | symbol, unknown>)[StartTimeSymbol] = performance.now();

        if (immediate) {
            if (!skip || !skip(event, undefined)) {
                const line = formatter(tokens, event, undefined);
                if (line !== undefined) {
                    write(line);
                }
            }

            return event.next();
        }

        const response = await event.next();

        if (!skip || !skip(event, response)) {
            const line = formatter(tokens, event, response);
            if (line !== undefined) {
                write(line);
            }
        }

        return response;
    });
}
