import type { IApp, IAppEvent } from 'routup';
import {
    MethodName,
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
import type { Metrics, Options } from './types';
import { buildPathLabel } from './utils/path';

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

/**
 * The status of the response routup builds after the pipeline when no
 * handler answered: the `Allow` response of an `OPTIONS` request, else
 * a 404. A handler error no error handler answered ends up here too
 * (routup does not expose it), so it is labelled 404 instead of 500.
 * Upstream: routup/routup#1008
 */
function buildFallbackStatus(event: IAppEvent) : number {
    if (event.method === MethodName.OPTIONS) {
        return event.response.status || 200;
    }

    return 404;
}

export function registerMetrics<
    T extends RegistryContentType = PrometheusContentType,
>(
    router: IApp,
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
                labels.status_code = response?.status ?? buildFallbackStatus(event);
                labels.method = event.method;
                // read after the handlers ran: event.route is request-wide
                labels.path = buildPathLabel(path, event, options);

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
