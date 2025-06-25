import type { PrometheusContentType, RegistryContentType } from 'prom-client';
import type { Plugin } from 'routup';
import { createHandler, registerMetrics } from './handler';
import type { Options, OptionsInput } from './type';
import { buildOptions } from './utils';

export function prometheus<
    T extends RegistryContentType = PrometheusContentType,
>(input: OptionsInput<T> = {}) : Plugin {
    const options = buildOptions({
        ...(input || {}),
    });

    return {
        name: 'prometheus',
        install: (router) => {
            registerMetrics(router, options);

            router.use(options.metricsPath, createHandler(options.registry));
        },
    };
}
