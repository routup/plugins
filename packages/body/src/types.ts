import type {
    OptionsJson,
    Options as OptionsRaw,
    OptionsText,
    OptionsUrlencoded,
} from 'body-parser';

export type Options = {
    json?: OptionsJson | boolean,
    raw?: OptionsRaw | boolean,
    text?: OptionsText | boolean,
    urlEncoded?: OptionsUrlencoded | boolean
};
