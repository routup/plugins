import type {
    ConfigInput, DotKey,
} from 'ilingo';

export type Options = ConfigInput;

// todo: Options type should have property: locale(req) => Promise<string | undefined>;

export interface Translator {
    (key: DotKey, data?: Record<string, any>, locale?: string) : Promise<string | undefined>;
    (key: DotKey, locale?: string) : Promise<string | undefined>;
}
