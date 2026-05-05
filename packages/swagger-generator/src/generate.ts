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

export type GenerateOptions = Partial<SwaggerGenerateOptions>;

export function generate(): Promise<OutputForVersion<typeof Version.V3_2>>;
export function generate(
    options: Omit<GenerateOptions, 'version'>,
): Promise<OutputForVersion<typeof Version.V3_2>>;
export function generate<V extends `${Version}`>(
    options: Omit<GenerateOptions, 'version'> & { version: V },
): Promise<OutputForVersion<V>>;
export async function generate(
    options: GenerateOptions = {},
): Promise<OutputForVersion<`${Version}`>> {
    const merge = createMerger({ array: false, priority: 'right' });
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
        version: options.version || Version.V3_2,
        metadata,
        data,
    });
}
