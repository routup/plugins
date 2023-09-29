import type { Request } from 'routup';
import { isObject } from './utils';

const QuerySymbol = Symbol.for('ReqQuery');

export function useRequestQuery(req: Request) : Record<string, any>;
export function useRequestQuery(req: Request, key: string) : any;
export function useRequestQuery(req: Request, key?: string) {
    /* istanbul ignore if  */
    if ('query' in req) {
        if (typeof key === 'string') {
            return (req as any).query[key];
        }

        return (req as any).query;
    }

    if (QuerySymbol in req) {
        if (typeof key === 'string') {
            return (req as any)[QuerySymbol][key];
        }

        return (req as any)[QuerySymbol];
    }

    return typeof key === 'string' ?
        undefined :
        {};
}

export function hasRequestQuery(req: Request) : boolean {
    return (
        (QuerySymbol in req) &&
            isObject((req as any)[QuerySymbol])
    ) ||
        (
            ('query' in req) &&
            isObject(req.query)
        );
}

export function setRequestQuery(req: Request, key: string, value: unknown) : void;
export function setRequestQuery(req: Request, record: Record<string, any>) : void;
export function setRequestQuery(req: Request, key: Record<string, any> | string, value?: unknown) : void {
    if (isObject(key)) {
        (req as any)[QuerySymbol] = key;
        return;
    }

    (req as any)[QuerySymbol] = {
        [key]: value,
    };
}
