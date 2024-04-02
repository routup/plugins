import type {
    ConfigInput, DotKey,
} from 'ilingo';
import type { Request } from 'routup';

export type LocaleReqFn = (req: Request) => Promise<string | undefined> | string | undefined;

export type Options = Omit<ConfigInput, 'locale'> & {
    locale?: string | LocaleReqFn
};

export interface Translator {
    (key: DotKey, data?: Record<string, any>, locale?: string) : Promise<string | undefined>;
    (key: DotKey, locale?: string) : Promise<string | undefined>;
}
