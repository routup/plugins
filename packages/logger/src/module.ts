import { createHandler } from './handler';
import type { FormatInput, Options } from './types';

export function logger(options?: Options): ReturnType<typeof createHandler>;
export function logger(format: FormatInput, options?: Options): ReturnType<typeof createHandler>;
export function logger(
    formatOrOptions?: FormatInput | Options,
    maybeOptions?: Options,
) {
    let resolved: Options;
    if (typeof formatOrOptions === 'string' || typeof formatOrOptions === 'function') {
        resolved = { ...(maybeOptions ?? {}), format: formatOrOptions };
    } else {
        resolved = formatOrOptions ?? {};
    }

    return createHandler(resolved);
}
