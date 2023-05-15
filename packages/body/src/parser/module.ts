import type { Options } from 'body-parser';
import type { Handler } from 'routup';
import { createJsonHandler } from './json';
import { createUrlEncodedHandler } from './url-encoded';

export function createHandler(options?: Options) : Handler {
    const jsonParser = createJsonHandler(options);
    const urlEncodedParser = createUrlEncodedHandler(options);

    return (req, res, next) => {
        jsonParser(req, res, (err) => {
            /* istanbul ignore next */
            if (err) {
                next(err);
            } else {
                urlEncodedParser(req, res, next);
            }
        });
    };
}
