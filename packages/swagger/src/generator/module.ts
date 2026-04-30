import path from 'node:path';
import process from 'node:process';
import { isMetadata } from '@trapi/metadata';
import { Version, generateSwagger } from '@trapi/swagger';
import { createMerger } from 'smob';
import type { GeneratorContext, GeneratorOptionsInput, GeneratorOutput } from './type';

const DEFAULT_DATA = {
    name: 'API Documentation',
    description: 'Explore the REST Endpoints of the API.',
    consumes: ['application/json'],
    produces: ['application/json'],
};

export async function generate<V extends `${Version}`>(
    context: GeneratorContext<V>,
): Promise<GeneratorOutput<V>> {
    const merge = createMerger({ array: true, arrayDistinct: true });
    const options = merge({}, DEFAULT_DATA, context.options || {}) as GeneratorOptionsInput;

    let { metadata } = options;
    if (!metadata) {
        metadata = {
            ignore: ['**/node_modules/**'],
            preset: '@routup/swagger-preset',
            entryPoint: [
                { pattern: '**/*.ts', cwd: path.join(process.cwd(), 'src') },
            ],
        };
    }

    if (!isMetadata(metadata)) {
        if (!metadata.entryPoint) {
            metadata.entryPoint = [
                { pattern: '**/*.ts', cwd: path.join(process.cwd(), 'src') },
            ];
        }
        if (!metadata.preset) {
            metadata.preset = '@routup/swagger-preset';
        }
        if (context.tsconfig && !metadata.tsconfig) {
            metadata.tsconfig = context.tsconfig;
        }
    }

    // Strip metadata from `data` so it isn't fed back as a spec extension.
    const { metadata: _omit, ...data } = options;

    return await generateSwagger({
        version: context.version || Version.V3,
        metadata,
        data,
    }) as GeneratorOutput<V>;
}
