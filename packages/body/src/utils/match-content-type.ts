import type { IRoutupEvent } from 'routup';
import { matchRequestContentType } from 'routup';

export function matchContentType(
    event: IRoutupEvent,
    types: string | string[],
): boolean {
    const typeList = Array.isArray(types) ? types : [types];
    return typeList.some((t) => matchRequestContentType(event, t));
}
