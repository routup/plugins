import { Ilingo, useIlingo } from 'ilingo';
import type { Plugin } from 'routup';
import { coreHandler, getRequestAcceptableLanguage, setRequestEnv } from 'routup';
import { REQUEST_INSTANCE_SYMBOL, REQUEST_LOCALE_SYMBOL } from './constants';
import type { LocaleReqFn, Options } from './types';

export function i18n() : Plugin;
export function i18n(ilingo: Ilingo) : Plugin;
export function i18n(options: Options) : Plugin;
export function i18n(input?: Options | Ilingo) : Plugin {
    return {
        name: 'i18n',
        install: (router) => {
            let locale : string | LocaleReqFn | undefined;

            let instance : Ilingo;
            if (input instanceof Ilingo) {
                instance = input;
            } else if (input) {
                instance = new Ilingo({
                    data: input.data,
                    store: input.store,
                });

                if (typeof input.locale === 'string') {
                    instance.setLocale(input.locale);
                }

                locale = input.locale;
            } else {
                instance = useIlingo();
            }

            // todo: this should be async
            const locales = instance.getLocalesSync();

            router.use(coreHandler(async (req, res, next) => {
                // todo: key should be symbol
                setRequestEnv(req, REQUEST_INSTANCE_SYMBOL, instance);

                let reqLocale : string | undefined;
                if (typeof locale === 'function') {
                    reqLocale = await locale(req);
                }
                if (typeof reqLocale === 'undefined') {
                    reqLocale = getRequestAcceptableLanguage(req, locales);
                }

                // todo: key should be symbol
                setRequestEnv(req, REQUEST_LOCALE_SYMBOL, reqLocale);

                next();
            }));
        },
    };
}
