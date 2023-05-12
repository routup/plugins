/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import type { OptionsText } from 'body-parser';
import { text } from 'body-parser';
import type { Handler } from 'routup';

export function createRequestTextHandler(options?: OptionsText) : Handler {
    return text(options);
}
