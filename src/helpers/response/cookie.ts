/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { CookieSerializeOptions, serialize } from 'cookie';
import { HeaderName } from '../../constants';
import { Response } from '../../type';
import { appendResponseHeaderDirective } from './header';

export function setResponseCookie(res: Response, name: string, value: string, options?: CookieSerializeOptions) {
    appendResponseHeaderDirective(res, HeaderName.COOKIE, serialize(name, value, {
        path: '/',
        ...(options || {}),
    }));
}

export function unsetResponseCookie(res: Response, name: string, options?: CookieSerializeOptions) {
    setResponseCookie(res, name, '', {
        ...(options || {}),
        maxAge: 0,
    });
}