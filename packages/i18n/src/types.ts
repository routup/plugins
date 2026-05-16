import type {
    ConfigInput,
    GetContext,
} from 'ilingo';
import type { IAppEvent } from 'routup';

export type LocaleReqFn = (event: IAppEvent) => Promise<string | undefined> | string | undefined;

export type Options = Omit<ConfigInput, 'locale'> & {
    locale?: string | LocaleReqFn
};

export type Translator = (ctx: GetContext) => Promise<string | undefined>;
