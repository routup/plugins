/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import type { OptionsUrlencoded } from 'body-parser';
import { urlencoded } from 'body-parser';
import type { Handler } from 'routup';

export function createRequestUrlEncodedHandler(options?: OptionsUrlencoded) : Handler {
    return urlencoded(options);
}
