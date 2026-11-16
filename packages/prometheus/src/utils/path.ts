import type { IAppEvent } from 'routup';
import type { Options } from '../types';

/**
 * Resolve the `path` label of a request, after its handlers ran.
 *
 * `normalizePath` wins when given. Otherwise the label is the pattern of
 * the dispatched route (`event.route.path`), then `unmatchedPath`, then
 * the raw request path. `event.route` is read defensively: a routup
 * without it (or a custom event) falls back to the raw path.
 */
export function buildPathLabel(
    path: string,
    event: IAppEvent,
    options: Pick<Options, 'normalizePath' | 'unmatchedPath'>,
): string {
    if (typeof options.normalizePath === 'function') {
        return options.normalizePath(path, event);
    }

    const route = event.route as { path?: unknown } | undefined;

    if (route && typeof route.path === 'string') {
        return route.path;
    }

    if (typeof options.unmatchedPath === 'string') {
        return options.unmatchedPath;
    }

    return path;
}
