import type { OptionsText } from 'body-parser';
import { text } from 'body-parser';
import { coreHandler } from 'routup';

export function createTextHandler(options?: OptionsText) {
    const handler = text(options);

    return coreHandler((req, res, next) => {
        handler(req, res, next);
    });
}
