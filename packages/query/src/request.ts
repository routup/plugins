import type { IAppEvent } from 'routup';
import { isObject } from './utils';

const QuerySymbol = Symbol.for('@routup/query:ReqQuery');

export function useRequestQuery(event: IAppEvent) : Record<string, any>;
export function useRequestQuery(event: IAppEvent, key: string) : any;
export function useRequestQuery(event: IAppEvent, key?: string) {
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

export function hasRequestQuery(event: IAppEvent) : boolean {
    return QuerySymbol in event.store &&
        isObject(event.store[QuerySymbol]);
}

export function setRequestQuery(event: IAppEvent, key: string, value: unknown) : void;
export function setRequestQuery(event: IAppEvent, record: Record<string, any>) : void;
export function setRequestQuery(event: IAppEvent, key: Record<string, any> | string, value?: unknown) : void {
    if (isObject(key)) {
        event.store[QuerySymbol] = key;
        return;
    }

    const existing = QuerySymbol in event.store ?
        event.store[QuerySymbol] as Record<string, any> :
        {};
    event.store[QuerySymbol] = { ...existing, [key]: value };
}
