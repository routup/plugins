import type { Handler } from 'routup';
import { createHandler } from './handler';
import type { OptionsInput } from './type';

export function rateLimit(options?: OptionsInput) : Handler {
    return createHandler(options);
}
