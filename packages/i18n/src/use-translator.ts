import type { DotKey, GetContext } from 'ilingo';
import { Ilingo } from 'ilingo';
import type { Request } from 'routup';
import { useRequestEnv } from 'routup';
import { REQUEST_INSTANCE_SYMBOL, REQUEST_LOCALE_SYMBOL } from './constants';
import type { Translator } from './types';

export function useTranslator(req: Request) : Translator {
    const reqInstance = useRequestEnv(req, REQUEST_INSTANCE_SYMBOL);
    if (!(reqInstance instanceof Ilingo)) {
        throw new Error('The i18n plugin is not installed...');
    }

    const reqLocale = useRequestEnv(req, REQUEST_LOCALE_SYMBOL);
    if (typeof reqLocale !== 'undefined' && typeof reqLocale !== 'string') {
        throw new Error('The i18n locale must either be of type string or undefined.');
    }

    return (ctx: GetContext) => {
        if (!ctx.locale) {
            ctx.locale = reqLocale;
        }

        return reqInstance.get(ctx);
    };
}
