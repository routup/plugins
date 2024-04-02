import { Ilingo, useIlingo } from 'ilingo';
import type { Plugin } from 'routup';
import { coreHandler, getRequestAcceptableLanguage, setRequestEnv } from 'routup';
import { REQUEST_INSTANCE_SYMBOL, REQUEST_LOCALE_SYMBOL } from './constants';
import type { Options } from './types';

export function i18n() : Plugin;
export function i18n(ilingo: Ilingo) : Plugin;
export function i18n(options: Options) : Plugin;
export function i18n(input?: Options | Ilingo) : Plugin {
    return {
        name: 'i18n',
        install: (router) => {
            let instance : Ilingo;
            if (input instanceof Ilingo) {
                instance = input;
            } else if (input) {
                instance = new Ilingo(input);
            } else {
                instance = useIlingo();
            }

            // todo: this should be async
            const locales = instance.getLocalesSync();

            router.use(coreHandler((req, res, next) => {
                const locale = getRequestAcceptableLanguage(req, locales);

                // todo: key should be symbol
                setRequestEnv(req, REQUEST_INSTANCE_SYMBOL, instance);

                // todo: key should be symbol
                setRequestEnv(req, REQUEST_LOCALE_SYMBOL, locale);

                next();
            }));
        },
    };
}
