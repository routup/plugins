import type {
    Metadata,
    MetadataGenerateOptions,
    TsCompilerOptions,
    TsConfig,
} from '@trapi/metadata';
import type {
    SpecV2,
    SpecV3,
    SwaggerGenerateData, 
    Version, 
} from '@trapi/swagger';

export type GeneratorOutput<V extends `${Version}`> = V extends typeof Version.V2 ? SpecV2 : SpecV3;

export type GeneratorOptionsInput = SwaggerGenerateData & {
    /**
     * Pre-built metadata or options to generate metadata from source.
     */
    metadata?: MetadataGenerateOptions | Metadata;
};

export type GeneratorContext<V extends `${Version}`> = {
    options: GeneratorOptionsInput,
    tsconfig?: TsConfig | string,
    version: V
};

type GeneratorMetadataOptions = MetadataGenerateOptions;
type GeneratorMetadata = Metadata;

export type {
    GeneratorMetadataOptions,
    GeneratorMetadata,
    SpecV2,
    SpecV3,
    TsCompilerOptions,
    TsConfig,
};
