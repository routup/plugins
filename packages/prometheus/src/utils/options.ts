import promClient from 'prom-client';
import { MetricName, MetricTypeName } from '../constants';
import type { Options, OptionsInput } from '../type';

export function buildHandlerOptions(input?: OptionsInput) : Options {
    input = input || {};

    return {
        uptime: true,
        uptimeName: MetricName.UPTIME,

        requestDuration: true,
        requestDurationName: MetricName.REQUEST_DURATION,
        requestDurationType: MetricTypeName.HISTOGRAM,

        skip: (req) => false,
        registry: promClient.register,

        ...input,

        requestDurationHistogram: input.requestDurationHistogram || {},
        requestDurationSummary: input.requestDurationSummary || {},
    };
}
