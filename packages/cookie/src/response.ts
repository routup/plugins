import type { Response } from 'routup';
import { HeaderName, appendResponseHeader } from 'routup';
import { serialize } from 'cookie-es';
import type { SerializeOptions } from './type';

export function setResponseCookie(res: Response, name: string, value: string, options?: SerializeOptions) {
    appendResponseHeader(res, HeaderName.SET_COOKIE, serialize(name, value, {
        path: '/',
        ...(options || {}),
    }));
}

/* istanbul ignore next */
export function unsetResponseCookie(res: Response, name: string, options?: SerializeOptions) {
    setResponseCookie(res, name, '', {
        ...(options || {}),
        maxAge: 0,
    });
}
