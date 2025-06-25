import type { PrometheusContentType, Registry, RegistryContentType } from 'prom-client';
import promClient from 'prom-client';
import { MetricName, MetricTypeName } from '../constants';
import type { Options, OptionsInput } from '../type';

export function buildOptions<
    T extends RegistryContentType = PrometheusContentType,
>(input?: OptionsInput<T>) : Options<T> {
    input = input || {};

    return {
        uptime: true,
        uptimeName: MetricName.UPTIME,

        requestDuration: true,
        requestDurationName: MetricName.REQUEST_DURATION,
        requestDurationType: MetricTypeName.HISTOGRAM,

        skip: (req) => false,
        registry: promClient.register as Registry<T>,

        metricsPath: '/metrics',

        ...input,

        requestDurationHistogram: input.requestDurationHistogram || {},
        requestDurationSummary: input.requestDurationSummary || {},
    };
}
