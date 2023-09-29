import type { Options } from 'body-parser';
import { raw } from 'body-parser';
import { coreHandler } from 'routup';

export function createRawHandler(options?: Options) {
    const handler = raw(options);
    return coreHandler((req, res, next) => {
        handler(req, res, next);
    });
}
