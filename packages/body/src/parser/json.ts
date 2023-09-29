import type { OptionsJson } from 'body-parser';
import { json } from 'body-parser';
import { coreHandler } from 'routup';

export function createJsonHandler(options?: OptionsJson) {
    const handler = json(options);

    return coreHandler((req, res, next) => {
        handler(req, res, next);
    });
}
