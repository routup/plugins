import { Ilingo } from 'ilingo';
import type { Plugin } from 'routup';
import { coreHandler, getRequestAcceptableLanguage, setRequestEnv } from 'routup';
import { REQUEST_INSTANCE_SYMBOL, REQUEST_LOCALE_SYMBOL } from './constants';
import type { LocaleReqFn, Options } from './types';

export function i18n() : Plugin;
export function i18n(ilingo: Ilingo) : Plugin;
export function i18n(options: Options) : Plugin;
export function i18n(input?: Options | Ilingo) : Plugin {
    let locales : string[] | undefined;
    let resolvePromise : Promise<string[]> | undefined;
    const resolveLocales = async (instance: Ilingo) => {
        if (locales) {
            return locales;
        }

        if (resolvePromise) {
            return resolvePromise;
        }

        resolvePromise = instance.getLocales();

        locales = await resolvePromise;

        return resolvePromise;
    };

    return {
        name: 'i18n',
        install: (router) => {
            let locale : string | LocaleReqFn | undefined;

            let instance : Ilingo;
            if (input instanceof Ilingo) {
                instance = input;
            } else if (input) {
                instance = new Ilingo({
                    store: input.store,
                });

                if (typeof input.locale === 'string') {
                    instance.setLocale(input.locale);
                }

                locale = input.locale;
            } else {
                instance = new Ilingo();
            }

            router.use(coreHandler(async (req, res, next) => {
                const locales = await resolveLocales(instance);

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
