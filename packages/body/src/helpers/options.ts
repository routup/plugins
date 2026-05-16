import type { IAppEvent } from 'routup';
import { OptionsSymbol } from '../constants';
import type { Options } from '../types';

export function setBodyOptions(event: IAppEvent, options: Options): void {
    event.store[OptionsSymbol] = options;
}

export function getBodyOptions(event: IAppEvent): Options {
    return (event.store[OptionsSymbol] as Options) ?? {};
}
