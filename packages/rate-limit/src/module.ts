import type { Handler } from 'routup';
import { createHandler } from './handler';
import type { OptionsInput } from './types';

export function rateLimit(options?: OptionsInput) : Handler {
    return createHandler(options);
}
