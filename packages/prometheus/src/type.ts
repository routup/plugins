import type { Request, Response } from 'routup';
import type {
    DefaultMetricsCollectorConfiguration,
    Gauge,
    Histogram,
    HistogramConfiguration,
    LabelValues,
    Registry,
    Summary,
    SummaryConfiguration,
} from 'prom-client';
import type { MetricTypeName } from './constants';

export type Metrics = {
    uptime?: Gauge,
    requestDuration?: Summary | Histogram
};

export type LabelTransformer = (labels: LabelValues<string>, req: Request, res: Response) => void;

export type Options = {
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

    normalizePath?: ((path: string, req: Request) => string);
    skip: (req: Request) => boolean;

    collectDefaultMetrics?: DefaultMetricsCollectorConfiguration,
    registry: Registry;
};

export type OptionsInput = Partial<Options>;
