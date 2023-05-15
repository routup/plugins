import type { Options } from 'body-parser';
import { raw } from 'body-parser';
import type { Handler } from 'routup';

export function createRawHandler(options?: Options) : Handler {
    return raw(options);
}
