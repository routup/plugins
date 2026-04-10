import type { GetContext } from 'ilingo';
import { Ilingo } from 'ilingo';
import type { IRoutupEvent } from 'routup';
import { PluginNotInstalledError, createError } from 'routup';
import { REQUEST_INSTANCE_SYMBOL, REQUEST_LOCALE_SYMBOL } from './constants';
import type { Translator } from './types';

export function useTranslator(event: IRoutupEvent) : Translator {
    const reqInstance = event.store[REQUEST_INSTANCE_SYMBOL];
    if (!(reqInstance instanceof Ilingo)) {
        throw new PluginNotInstalledError('@routup/i18n', 'useTranslator');
    }

    const reqLocale = event.store[REQUEST_LOCALE_SYMBOL];
    if (typeof reqLocale !== 'undefined' && typeof reqLocale !== 'string') {
        throw createError({
            statusCode: 500,
            message: 'The i18n locale must either be of type string or undefined.',
        });
    }

    return (ctx: GetContext) => {
        if (!ctx.locale) {
            ctx.locale = reqLocale;
        }

        return reqInstance.get(ctx);
    };
}
