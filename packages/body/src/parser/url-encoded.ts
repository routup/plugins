import type { OptionsUrlencoded } from 'body-parser';
import { urlencoded } from 'body-parser';
import type { Handler } from 'routup';

export function createUrlEncodedHandler(options?: OptionsUrlencoded) : Handler {
    return urlencoded(options);
}
