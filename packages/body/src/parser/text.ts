import type { OptionsText } from 'body-parser';
import { text } from 'body-parser';
import type { Handler } from 'routup';

export function createTextHandler(options?: OptionsText) : Handler {
    return text(options);
}
