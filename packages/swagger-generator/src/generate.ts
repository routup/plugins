import path from 'node:path';
import process from 'node:process';
import { buildPreset } from '@routup/decorators/preset';
import { isMetadata } from '@trapi/metadata';
import {
    Version,
    generateSwagger,
} from '@trapi/swagger';
import type {
    OutputForVersion,
    SwaggerGenerateData,
    SwaggerGenerateOptions,
} from '@trapi/swagger';
import { createMerger } from 'smob';

const DEFAULT_DATA: SwaggerGenerateData = {
    name: 'API Documentation',
    description: 'Explore the REST Endpoints of the API.',
    consumes: ['application/json'],
    produces: ['application/json'],
};

export type GenerateOptions<V extends `${Version}` = `${Version}`> = Partial<Omit<SwaggerGenerateOptions, 'version'>> & { version?: V };

export async function generate<V extends `${Version}` = typeof Version.V3_2>(
    options: GenerateOptions<V> = {},
): Promise<OutputForVersion<V>> {
    const merge = createMerger({ array: true, arrayDistinct: true });
    const data = merge({}, DEFAULT_DATA, options.data || {}) as SwaggerGenerateData;

    let { metadata } = options;
    if (!metadata) {
        metadata = {
            ignore: ['**/node_modules/**'],
            preset: buildPreset(),
            entryPoint: [
                { pattern: '**/*.ts', cwd: path.join(process.cwd(), 'src') },
            ],
        };
    } else if (!isMetadata(metadata)) {
        if (!metadata.entryPoint) {
            metadata.entryPoint = [
                { pattern: '**/*.ts', cwd: path.join(process.cwd(), 'src') },
            ];
        }
        if (!metadata.preset) {
            metadata.preset = buildPreset();
        }
    }

    return generateSwagger({
        version: (options.version || Version.V3_2) as V,
        metadata,
        data,
    });
}
