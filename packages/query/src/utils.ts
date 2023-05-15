import type {
    Request,
} from 'routup';
import { parse } from 'qs';

import type { ParseOptions } from './type';

export function parseRequestQuery(req: Request, options?: ParseOptions) {
    /* istanbul ignore if  */
    if (typeof req.url === 'undefined') {
        return {};
    }

    const url = new URL(req.url, 'http://localhost/');

    let { search } = url;
    if (search.substring(0, 1) === '?') {
        search = search.substring(1);
    }

    return parse(search, options);
}
