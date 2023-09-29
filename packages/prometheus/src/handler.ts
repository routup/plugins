import type { Router } from 'routup';
import {
    coreHandler,
    setResponseHeaderContentType,
    useRequestPath,
} from 'routup';
import type {
    LabelValues,
    Registry,
} from 'prom-client';
import promClient from 'prom-client';
import { buildRequestDurationMetric, buildUptimeMetric } from './metrics';
import type { Metrics, Options } from './type';
import { onResponseFinished } from './utils';

export function createHandler(input?: Registry) {
    const registry : Registry = input || promClient.register;

    return coreHandler(async (req, res, next) => {
        registry.metrics()
            .then((output) => {
                setResponseHeaderContentType(res, registry.contentType);
                res.end(output);
            })
            .catch((err) => next(err));
    });
}

export function registerMetrics(
    router: Router,
    options: Options,
): Metrics {
    /* istanbul ignore next */
    if (options.collectDefaultMetrics) {
        promClient.collectDefaultMetrics(options.collectDefaultMetrics);
    }

    const metrics : Metrics = {};

    if (options.uptime) {
        metrics.uptime = buildUptimeMetric(options);
    }

    if (options.requestDuration) {
        metrics.requestDuration = buildRequestDurationMetric(options);
    }

    router.use(coreHandler(async (req, res, next) => {
        /* istanbul ignore next */
        if (options.skip(req)) {
            next();
            return;
        }

        if (metrics.requestDuration) {
            let path = useRequestPath(req);
            if (!path.startsWith('/')) {
                path = `/${path}`;
            }

            const labels: LabelValues<string> = {};
            const timer = metrics.requestDuration.startTimer(labels);

            onResponseFinished(res, () => {
                labels.status_code = res.statusCode;
                labels.method = req.method;
                labels.path = typeof options.normalizePath === 'function' ?
                    options.normalizePath(path, req) :
                    path;

                if (options.requestDurationLabels) {
                    Object.assign(labels, options.requestDurationLabels);
                }

                if (options.requestDurationLabelTransformer) {
                    options.requestDurationLabelTransformer(labels, req, res);
                }

                timer();
            });
        }

        next();
    }));

    return metrics;
}
