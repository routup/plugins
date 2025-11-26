import type { OptionsUrlencoded } from 'body-parser';
import bodyParser from 'body-parser';
import { coreHandler } from 'routup';

export function createUrlEncodedHandler(options?: OptionsUrlencoded) {
    const handler = bodyParser.urlencoded({
        extended: false,
        ...(options || {}),
    });

    return coreHandler((req, res, next) => {
        handler(req, res, next);
    });
}
