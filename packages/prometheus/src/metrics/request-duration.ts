import type {
    Histogram, PrometheusContentType, Registry, RegistryContentType, Summary,
} from 'prom-client';
import promClient from 'prom-client';
import { MetricTypeName } from '../constants';
import type { Options } from '../type';

export function buildRequestDurationMetric<
    T extends RegistryContentType = PrometheusContentType,
>(options: Options<T>) : Histogram | Summary {
    const labels : string[] = [
        'method',
        'path',
        'status_code',
    ];

    if (options.requestDurationLabels) {
        labels.push(...Object.keys(options.requestDurationLabels));
    }

    if (options.requestDurationType === MetricTypeName.SUMMARY) {
        return new promClient.Summary({
            name: options.requestDurationName,
            help: `duration (sec) summary of http responses labeled with: ${labels.join(', ')}`,
            labelNames: labels,
            percentiles: [0.5, 0.75, 0.95, 0.98, 0.99, 0.999],
            registers: [options.registry as Registry],
            ...options.requestDurationSummary,
        });
    }

    return new promClient.Histogram({
        name: options.requestDurationName,
        help: `duration (sec) histogram of http responses labeled with: ${labels.join(', ')}`,
        labelNames: labels,
        buckets: [0.003, 0.03, 0.1, 0.3, 1.5, 10],
        registers: [options.registry as Registry],
        ...options.requestDurationHistogram,
    });
}
