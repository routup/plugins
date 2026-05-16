import type { IAppEvent } from 'routup';
import { matchRequestContentType } from 'routup';

export function matchContentType(
    event: IAppEvent,
    types: string | string[],
): boolean {
    const typeList = Array.isArray(types) ? types : [types];
    return typeList.some((t) => matchRequestContentType(event, t));
}
