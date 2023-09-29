import type { Options } from 'body-parser';
import { coreHandler } from 'routup';
import { createJsonHandler } from './json';
import { createUrlEncodedHandler } from './url-encoded';

export function createHandler(options?: Options) {
    const jsonParser = createJsonHandler(options);
    const urlEncodedParser = createUrlEncodedHandler(options);

    return coreHandler((req, res, next) => {
        jsonParser.fn(req, res, (err) => {
            /* istanbul ignore next */
            if (err) {
                next(err);
            } else {
                urlEncodedParser.fn(req, res, next);
            }
        });
    });
}
