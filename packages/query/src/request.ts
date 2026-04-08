import type { IRoutupEvent } from 'routup';
import { isObject } from './utils';

const QuerySymbol = Symbol.for('ReqQuery');

export function useRequestQuery(event: IRoutupEvent) : Record<string, any>;
export function useRequestQuery(event: IRoutupEvent, key: string) : any;
export function useRequestQuery(event: IRoutupEvent, key?: string) {
    if (QuerySymbol in event.store) {
        if (typeof key === 'string') {
            return (event.store[QuerySymbol] as Record<string, any>)[key];
        }

        return event.store[QuerySymbol];
    }

    return typeof key === 'string' ?
        undefined :
        {};
}

export function hasRequestQuery(event: IRoutupEvent) : boolean {
    return QuerySymbol in event.store &&
        isObject(event.store[QuerySymbol]);
}

export function setRequestQuery(event: IRoutupEvent, key: string, value: unknown) : void;
export function setRequestQuery(event: IRoutupEvent, record: Record<string, any>) : void;
export function setRequestQuery(event: IRoutupEvent, key: Record<string, any> | string, value?: unknown) : void {
    if (isObject(key)) {
        event.store[QuerySymbol] = key;
        return;
    }

    const existing = QuerySymbol in event.store ?
        event.store[QuerySymbol] as Record<string, any> :
        {};
    event.store[QuerySymbol] = { ...existing, [key]: value };
}
