import type { IRoutupEvent } from 'routup';
import { appendResponseHeader } from 'routup';
import { serialize } from 'cookie-es';
import type { SerializeOptions } from './types';

export function setResponseCookie(event: IRoutupEvent, name: string, value: string, options?: SerializeOptions) {
    appendResponseHeader(event, 'set-cookie', serialize(name, value, {
        path: '/',
        ...(options || {}),
    }));
}

/* istanbul ignore next */
export function unsetResponseCookie(event: IRoutupEvent, name: string, options?: SerializeOptions) {
    setResponseCookie(event, name, '', {
        ...(options || {}),
        maxAge: 0,
    });
}
