import type { IRouter } from 'routup';
import {
    defineCoreHandler,
    setResponseHeaderContentType,
} from 'routup';
import type {
    LabelValues,
    PrometheusContentType,
    Registry,
    RegistryContentType,
} from 'prom-client';
import promClient from 'prom-client';
import { buildRequestDurationMetric, buildUptimeMetric } from './metrics';
import type { Metrics, Options } from './type';

export function createHandler<
    T extends RegistryContentType = PrometheusContentType,
>(input?: Registry<T>) {
    const registry: Registry<T> = input || promClient.register as Registry<T>;

    return defineCoreHandler(async (event) => {
        const output = await registry.metrics();
        setResponseHeaderContentType(event, registry.contentType);
        return output;
    });
}

export function registerMetrics<
    T extends RegistryContentType = PrometheusContentType,
>(
    router: IRouter,
    options: Options<T>,
): Metrics {
    /* istanbul ignore next */
    if (options.collectDefaultMetrics) {
        promClient.collectDefaultMetrics(options.collectDefaultMetrics);
    }

    const metrics: Metrics = {};

    if (options.uptime) {
        metrics.uptime = buildUptimeMetric(options);
    }

    if (options.requestDuration) {
        metrics.requestDuration = buildRequestDurationMetric(options);
    }

    router.use(defineCoreHandler(async (event) => {
        /* istanbul ignore next */
        if (options.skip(event)) {
            return event.next();
        }

        if (metrics.requestDuration) {
            let { path } = event;
            if (!path.startsWith('/')) {
                path = `/${path}`;
            }

            const labels: LabelValues<string> = {};
            const timer = metrics.requestDuration.startTimer(labels);

            let response: Response | undefined;
            try {
                response = await event.next();
                return response;
            } finally {
                labels.status_code = response?.status ?? 200;
                labels.method = event.method;
                labels.path = typeof options.normalizePath === 'function' ?
                    options.normalizePath(path, event) :
                    path;

                if (options.requestDurationLabels) {
                    Object.assign(labels, options.requestDurationLabels);
                }

                if (options.requestDurationLabelTransformer) {
                    options.requestDurationLabelTransformer(labels, event);
                }

                timer();
            }
        }

        return event.next();
    }));

    return metrics;
}
