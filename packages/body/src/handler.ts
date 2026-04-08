import { defineCoreHandler } from 'routup';
import { setBodyOptions } from './helpers';
import type { Options } from './types';

export function createHandler(options: Options) {
    return defineCoreHandler((event) => {
        setBodyOptions(event, options);
        return event.next();
    });
}
