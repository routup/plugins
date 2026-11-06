import type {
    GetContext,
    IlingoOptions,
} from 'ilingo';
import type { IAppEvent } from 'routup';

export type LocaleReqFn = (event: IAppEvent) => Promise<string | undefined> | string | undefined;

export type Options = Omit<IlingoOptions, 'locale'> & {
    locale?: string | LocaleReqFn
};

export type Translator = (ctx: GetContext) => Promise<string | undefined>;
