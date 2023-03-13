/*
 * Copyright (c) 2023-2023.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { Response, send } from 'routup';
import {
    DController, DCookie, DCookies,
    DGet, DResponse,
} from '../../src';

@DController('/cookie')
export class CookieController {
    @DGet('many')
    getMany(
    @DResponse() res: Response,
        @DCookies() cookies: Record<string, any>,
    ) {
        send(res, cookies);
    }

    @DGet('single')
    get(
    @DResponse() res: Response,
        @DCookie('foo') foo: string,
    ) {
        send(res, foo);
    }
}
