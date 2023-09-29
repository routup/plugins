import type { OptionsUrlencoded } from 'body-parser';
import { urlencoded } from 'body-parser';
import { coreHandler } from 'routup';

export function createUrlEncodedHandler(options?: OptionsUrlencoded) {
    const handler = urlencoded(options);
    return coreHandler((req, res, next) => {
        handler(req, res, next);
    });
}
