import type { IRoutupEvent } from 'routup';
import type {
    DefaultMetricsCollectorConfiguration,
    Gauge,
    Histogram,
    HistogramConfiguration,
    LabelValues,
    PrometheusContentType,
    Registry,
    RegistryContentType,
    Summary,
    SummaryConfiguration,
} from 'prom-client';
import type { MetricTypeName } from './constants';

export type Metrics = {
    uptime?: Gauge,
    requestDuration?: Summary | Histogram
};

export type LabelTransformer = (labels: LabelValues<string>, event: IRoutupEvent) => void;

export type Options<T extends RegistryContentType = PrometheusContentType> = {
    metricsPath: string,

    requestDuration: boolean,
    requestDurationName: string,
    requestDurationLabelTransformer?: LabelTransformer,
    requestDurationLabels?: LabelValues<string>,
    requestDurationType?: `${MetricTypeName}`;
    requestDurationHistogram: Partial<HistogramConfiguration<string>>,
    requestDurationSummary: Partial<SummaryConfiguration<string>>,

    uptime: boolean;
    uptimeName: string,
    uptimeLabels?: LabelValues<string>,

    normalizePath?: ((path: string, event: IRoutupEvent) => string);
    skip: (event: IRoutupEvent) => boolean;

    collectDefaultMetrics?: DefaultMetricsCollectorConfiguration<T>,
    registry: Registry<T>;
};

export type OptionsInput<T extends RegistryContentType = PrometheusContentType> = Partial<Options<T>>;
