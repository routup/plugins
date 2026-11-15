import {
    beforeAll,
    describe,
    expect,
    it,
} from 'vitest';
import { generateMetadata } from '@trapi/metadata';
import { Version, generateSwagger } from '@trapi/swagger';
import type { SpecV3 } from '@trapi/swagger';
import jsonata from 'jsonata';
import path from 'node:path';
import process from 'node:process';
import { buildPreset } from '../../../src/preset';

const controllerDirectoryPath = path.resolve(process.cwd(), 'test', 'data');

describe('src/preset (V3)', () => {
    let spec : SpecV3;

    beforeAll(async () => {
        const metadata = await generateMetadata({
            cache: false,
            preset: buildPreset(),
            entryPoint: {
                cwd: controllerDirectoryPath,
                pattern: '**/*.ts',
            },
        });

        spec = await generateSwagger({
            version: Version.V3,
            metadata,
            data: { servers: ['http://localhost:3000/'] },
        });
    });

    it('should generate metadata', async () => {
        expect(spec).toBeDefined();
        expect(spec.paths).toBeDefined();
        expect(spec.servers).toBeDefined();
        expect(spec.openapi).toEqual('3.0.0');
    });

    it('should have controller paths', async () => {
        expect(spec.paths['/query/many']).toBeDefined();
        expect(spec.paths['/query/single']).toBeDefined();

        expect(spec.paths['/combined']).toBeDefined();
        expect(spec.paths['/combined/{id}']).toBeDefined();

        expect(spec.paths['/cookie/many']).toBeDefined();
        expect(spec.paths['/cookie/single']).toBeDefined();

        expect(spec.paths['/get/many']).toBeDefined();
        expect(spec.paths['/get/{id}']).toBeDefined();

        expect(spec.paths['/post/many']).toBeDefined();
        expect(spec.paths['/post/single']).toBeDefined();
    });

    it('should have post controller method many', async () => {
        let expression = jsonata('"/post/many".post');
        const pathContent = await expression.evaluate(spec.paths);

        expect(pathContent).toBeDefined();

        expression = jsonata('responses."200".description');
        expect(await expression.evaluate(pathContent)).toEqual('Ok');

        expression = jsonata('requestBody.content."application/json".schema.type');
        expect(await expression.evaluate(pathContent)).toEqual('object');

        expression = jsonata('requestBody.content."application/json".schema.required');
        expect(await expression.evaluate(pathContent)).toEqual(['foo']);

        expression = jsonata('requestBody.content."application/json".schema.properties.foo.type');
        expect(await expression.evaluate(pathContent)).toEqual('string');
    });

    it('should have post controller method single', async () => {
        let expression = jsonata('"/post/single".post');
        const pathContent = await expression.evaluate(spec.paths);

        expect(pathContent).toBeDefined();

        expression = jsonata('responses."200".description');
        expect(await expression.evaluate(pathContent)).toEqual('Ok');

        expression = jsonata('requestBody.content."application/json".schema.type');
        expect(await expression.evaluate(pathContent)).toEqual('object');

        expression = jsonata('requestBody.content."application/json".schema.properties.foo.type');
        expect(await expression.evaluate(pathContent)).toEqual('string');
    });

    it('should have get controller method many', async () => {
        let expression = jsonata('"/get/many".get');
        const pathContent = await expression.evaluate(spec.paths);

        expect(pathContent).toBeDefined();

        expression = jsonata('responses."200".description');
        expect(await expression.evaluate(pathContent)).toEqual('Ok');

        expression = jsonata('responses."200".content."application/json".schema."$ref"');
        expect(await expression.evaluate(pathContent)).toEqual('#/components/schemas/GetManyResponse');

        expression = jsonata('responses."200".content."application/json".examples.example1.value');
        expect(await expression.evaluate(pathContent)).toEqual({ foo: 'bar' });
    });

    it('should have get controller method param', async () => {
        let expression = jsonata('"/get/{id}".get');
        const pathContent = await expression.evaluate(spec.paths);

        expect(pathContent).toBeDefined();

        expression = jsonata('parameters[0].in');
        expect(await expression.evaluate(pathContent)).toEqual('path');

        expression = jsonata('parameters[0].name');
        expect(await expression.evaluate(pathContent)).toEqual('id');
    });

    it('should have nested get controller method param', async () => {
        let expression = jsonata('"/get/{id}/{foo}".get');
        const pathContent = await expression.evaluate(spec.paths);

        expect(pathContent).toBeDefined();

        expression = jsonata('parameters[0].in');
        expect(await expression.evaluate(pathContent)).toEqual('path');

        expression = jsonata('parameters[0].name');
        expect(await expression.evaluate(pathContent)).toEqual('foo');

        expression = jsonata('parameters[1].in');
        expect(await expression.evaluate(pathContent)).toEqual('path');

        expression = jsonata('parameters[1].name');
        expect(await expression.evaluate(pathContent)).toEqual('id');
    });

    it('should document the return type under the @DStatus code', async () => {
        const operation = spec.paths['/status/accepted']!.post!;

        expect(Object.keys(operation.responses)).toEqual(['202']);
        expect(operation.responses['202']!.content!['application/json']!.schema)
            .toEqual({ $ref: '#/components/schemas/StatusAcceptedResponse' });
    });

    it('should read @DStatus regardless of decorator order', async () => {
        const operation = spec.paths['/status/created']!.get!;

        expect(Object.keys(operation.responses)).toEqual(['201']);
    });

    it('should document a @DProduces text type as string', async () => {
        const operation = spec.paths['/produces/events']!.get!;

        expect(operation.responses['200']!.content).toEqual({ 'text/event-stream': { schema: { type: 'string' } } });
    });

    it('should document every @DProduces media type', async () => {
        const operation = spec.paths['/produces/csv']!.get!;

        expect(Object.keys(operation.responses['200']!.content!)).toEqual(['text/csv', 'text/plain']);
    });

    it('should document a binary @DProduces type as string/binary', async () => {
        const operation = spec.paths['/produces/download']!.get!;

        expect(Object.keys(operation.responses)).toEqual(['200']);
        expect(operation.responses['200']!.content).toEqual({ 'application/octet-stream': { schema: { type: 'string', format: 'binary' } } });
    });

    it('should keep a @DDescription at the same status', async () => {
        for (const url of ['/produces/described', '/produces/described-last']) {
            const operation = spec.paths[url]!.get!;

            expect(Object.keys(operation.responses)).toEqual(['200']);
            expect(operation.responses['200']!.description).toEqual('The file');
            expect(operation.responses['200']!.content).toEqual({ 'application/pdf': { schema: { type: 'string', format: 'binary' } } });
        }
    });

    it('should document a binary @DProduces type under the @DStatus code', async () => {
        for (const url of ['/produces/status-first', '/produces/status-last']) {
            const operation = spec.paths[url]!.post!;

            expect(Object.keys(operation.responses)).toEqual(['201']);
            expect(operation.responses['201']!.content).toEqual({ 'image/png': { schema: { type: 'string', format: 'binary' } } });
        }
    });

    it('should keep the return type for other @DProduces types', async () => {
        const operation = spec.paths['/produces/json']!.get!;
        const content = operation.responses['200']!.content!;

        expect(Object.keys(content)).toEqual(['application/xml']);
        expect((content['application/xml']!.schema as Record<string, any>).type).toEqual('object');
    });

    it('should apply a class-level @DProduces to its methods', async () => {
        let operation = spec.paths['/produces-class']!.get!;

        expect(Object.keys(operation.responses['200']!.content!)).toEqual(['text/html']);

        operation = spec.paths['/produces-class/method']!.get!;
        expect(Object.keys(operation.responses['200']!.content!)).toContain('text/plain');
    });
});
