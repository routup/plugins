import type { OptionsJson } from 'body-parser';
import { json } from 'body-parser';
import type { Handler } from 'routup';

export function createJsonHandler(options?: OptionsJson) : Handler {
    return json(options);
}
