import type {
    Metadata,
    MetadataOptions,
    Options,
    OptionsInput,
    SpecV2,
    SpecV3,
    TsCompilerOptions,
    TsConfig,
    Version,
} from '@trapi/swagger';

export type GeneratorOutput<V extends `${Version}`> = V extends `${Version.V2}` ? SpecV2 : SpecV3;
export type GeneratorContext<V extends `${Version}`> = {
    options: OptionsInput,
    tsconfig?: TsConfig | string,
    version: V
};

type GeneratorOptions = Options;
type GeneratorOptionsInput = OptionsInput;
type GeneratorMetadataOptions = MetadataOptions;
type GeneratorMetadata = Metadata;

export {
    GeneratorOptions,
    GeneratorOptionsInput,
    GeneratorMetadataOptions,
    GeneratorMetadata,
    SpecV2,
    SpecV3,
    TsCompilerOptions,
    TsConfig,
};
