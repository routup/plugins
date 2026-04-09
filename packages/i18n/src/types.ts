import type {
    ConfigInput,
    GetContext,
} from 'ilingo';
import type { IRoutupEvent } from 'routup';

export type LocaleReqFn = (event: IRoutupEvent) => Promise<string | undefined> | string | undefined;

export type Options = Omit<ConfigInput, 'locale'> & {
    locale?: string | LocaleReqFn
};

export type Translator = (ctx: GetContext) => Promise<string | undefined>;
