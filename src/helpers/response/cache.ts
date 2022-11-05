/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { Response } from '../../type';

export type ResponseCacheHeadersOptions = {
    maxAge?: number,
    modifiedTime?: string | Date,
    cacheControls?: string[]
};

export function setResponseCacheHeaders(res: Response, options?: ResponseCacheHeadersOptions) {
    options = options || {};

    const cacheControls = ['public'].concat(options.cacheControls || []);

    if (options.maxAge !== undefined) {
        cacheControls.push(`max-age=${+options.maxAge}`, `s-maxage=${+options.maxAge}`);
    }

    if (options.modifiedTime) {
        const modifiedTime = typeof options.modifiedTime === 'string' ?
            new Date(options.modifiedTime) :
            options.modifiedTime;

        res.setHeader('last-modified', modifiedTime.toUTCString());
    }

    res.setHeader('cache-control', cacheControls.join(', '));
}
