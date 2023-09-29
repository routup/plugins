import type { Request } from 'routup';
import { isObject } from './utils';

const BodySymbol = Symbol.for('ReqBody');

export function useRequestBody(req: Request) : Record<string, any>;
export function useRequestBody(req: Request, key: string) : any | undefined;
export function useRequestBody(req: Request, key?: string) {
    let body : Record<string, any> | undefined;

    /* istanbul ignore next */
    if ('body' in req) {
        body = (req as any).body;
    }

    if (BodySymbol in req) {
        if (body) {
            body = {
                ...(req as any)[BodySymbol],
                ...body,
            };
        } else {
            body = (req as any)[BodySymbol];
        }
    }

    if (body) {
        if (typeof key === 'string') {
            return body[key];
        }

        return body;
    }

    return typeof key === 'string' ?
        undefined :
        {};
}

export function setRequestBody(req: Request, key: string, value: unknown) : void;
export function setRequestBody(req: Request, record: Record<string, any>) : void;
export function setRequestBody(req: Request, key: Record<string, any> | string, value?: unknown) : void {
    if (isObject(key)) {
        (req as any)[BodySymbol] = key;
        return;
    }

    (req as any)[BodySymbol] = {
        [key]: value,
    };
}
