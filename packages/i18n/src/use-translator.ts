import type { DotKey } from 'ilingo';
import { Ilingo } from 'ilingo';
import type { Request } from 'routup';
import { useRequestEnv } from 'routup';
import { REQUEST_INSTANCE_SYMBOL, REQUEST_LOCALE_SYMBOL } from './constants';
import type { Translator } from './types';

export function useTranslator(req: Request) : Translator {
    const instance = useRequestEnv(req, REQUEST_INSTANCE_SYMBOL);
    if (!(instance instanceof Ilingo)) {
        throw new Error('The plugin is not installed...');
    }

    const locale = useRequestEnv(req, REQUEST_LOCALE_SYMBOL);
    if (typeof locale !== 'undefined' && typeof locale !== 'string') {
        throw new Error('The locale must either be of type string or undefined.');
    }

    return (key: DotKey, data?: Record<string, any>) => instance.get(key, data, locale);
}
