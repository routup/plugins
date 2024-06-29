import type {
    ConfigInput, GetContext,
} from 'ilingo';
import type { Request } from 'routup';

export type LocaleReqFn = (req: Request) => Promise<string | undefined> | string | undefined;

export type Options = Omit<ConfigInput, 'locale'> & {
    locale?: string | LocaleReqFn
};

export type Translator = (ctx: GetContext) => Promise<string | undefined>;
