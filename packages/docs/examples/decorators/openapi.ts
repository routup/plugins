import { buildPreset } from '@routup/decorators/preset';
import { generateMetadata } from '@trapi/metadata';
import { Version, generateSwagger } from '@trapi/swagger';

// reads the controllers in the *.ts files below `cwd`; nothing is executed
export async function generateDocument(cwd: string) {
    const metadata = await generateMetadata({
        preset: buildPreset(),
        entryPoint: { cwd, pattern: '**/*.ts' },
        ignore: ['**/node_modules/**'],
    });

    return generateSwagger({
        version: Version.V3_2,
        metadata,
        data: {
            name: 'My API',
            servers: ['http://localhost:3000/'],
        },
    });
}
