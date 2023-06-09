import { performance } from 'node:perf_hooks';
import type { Gauge } from 'prom-client';
import promClient from 'prom-client';
import type { Options } from '../type';

export function buildUptimeMetric(options: Options) : Gauge {
    const starTime = performance.now();

    return new promClient.Gauge({
        name: options.uptimeName,
        help: 'duration (sec) since application is up and running.',
        collect() {
            this.set(parseInt(`${((performance.now() - starTime) / 1000)}`, 10));
        },
        registers: [
            options.registry,
        ],
    });
}
