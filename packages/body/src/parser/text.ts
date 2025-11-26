import type { OptionsText } from 'body-parser';
import bodyParser from 'body-parser';
import { coreHandler } from 'routup';

export function createTextHandler(options?: OptionsText) {
    const handler = bodyParser.text(options);

    return coreHandler((req, res, next) => {
        handler(req, res, next);
    });
}
