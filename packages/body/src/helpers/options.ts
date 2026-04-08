import type { IRoutupEvent } from 'routup';
import type { Options } from '../types';

const OptionsSymbol = Symbol.for('ReqBodyOptions');

export function setBodyOptions(event: IRoutupEvent, options: Options): void {
    event.store[OptionsSymbol] = options;
}

export function getBodyOptions(event: IRoutupEvent): Options {
    return (event.store[OptionsSymbol] as Options) ?? {};
}
