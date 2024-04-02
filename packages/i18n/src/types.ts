import type {
    ConfigInput, DotKey,
} from 'ilingo';

export type Options = ConfigInput;

// todo: Options type should have property: getLocale(req) => Promise<string | undefined>;

export type Translator = (key: DotKey, data?: Record<string, any>) => Promise<string | undefined>;
