import type { Options as BodyOptions } from '@routup/body';
import type { Options as CookieOptions } from '@routup/cookie';
import type { Options as QueryOptions } from '@routup/query';

export type Options = {
    body?: BodyOptions | boolean,
    cookie?: CookieOptions | boolean,
    query?: QueryOptions | boolean
};
