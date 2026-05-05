export type {
    Metadata,
    MetadataGenerateOptions,
    Preset,
    TsCompilerOptions,
    TsConfig,
} from '@trapi/metadata';

export type {
    OutputForVersion,
    SpecV2,
    SpecV3,
    SwaggerGenerateData,
    SwaggerGenerateOptions,
    SwaggerSaveOptions,
} from '@trapi/swagger';

export {
    Version,
    saveSwagger,
} from '@trapi/swagger';

export * from './generate-swagger';
