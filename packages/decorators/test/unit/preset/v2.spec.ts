import {
    beforeAll,
    describe,
    expect,
    it,
} from 'vitest';
import { generateMetadata } from '@trapi/metadata';
import { Version, generateSwagger } from '@trapi/swagger';
import type { SpecV2 } from '@trapi/swagger';
import jsonata from 'jsonata';
import path from 'node:path';
import process from 'node:process';
import { buildPreset } from '../../../src/preset';

const controllerDirectoryPath = path.resolve(process.cwd(), 'test', 'data');

describe('src/preset (V2)', () => {
    let spec : SpecV2;

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
            version: Version.V2,
            metadata,
            data: { servers: ['http://localhost:3000/'] },
        });
    });

    it('should generate metadata', async () => {
        expect(spec).toBeDefined();
        expect(spec.paths).toBeDefined();
        expect(spec.host).toBeDefined();
        expect(spec.swagger).toEqual('2.0');
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

        expression = jsonata('parameters[0].schema.type');
        expect(await expression.evaluate(pathContent)).toEqual('object');

        expression = jsonata('parameters[0].schema.required');
        expect(await expression.evaluate(pathContent)).toEqual(['foo']);

        expression = jsonata('parameters[0].schema.properties.foo.type');
        expect(await expression.evaluate(pathContent)).toEqual('string');
    });

    it('should have post controller method single', async () => {
        let expression = jsonata('"/post/single".post');
        const pathContent = await expression.evaluate(spec.paths);

        expect(pathContent).toBeDefined();

        expression = jsonata('responses."200".description');
        expect(await expression.evaluate(pathContent)).toEqual('Ok');

        expression = jsonata('parameters[0].name');
        expect(await expression.evaluate(pathContent)).toEqual('body');

        expression = jsonata('parameters[0].schema.type');
        expect(await expression.evaluate(pathContent)).toEqual('object');

        expression = jsonata('parameters[0].schema.properties.foo.type');
        expect(await expression.evaluate(pathContent)).toEqual('string');
    });

    it('should have get controller method many', async () => {
        let expression = jsonata('"/get/many".get');
        const pathContent = await expression.evaluate(spec.paths);

        expect(pathContent).toBeDefined();

        expression = jsonata('responses."200".description');
        expect(await expression.evaluate(pathContent)).toEqual('Ok');

        expression = jsonata('responses."200".schema."$ref"');
        expect(await expression.evaluate(pathContent)).toEqual('#/definitions/GetManyResponse');

        expression = jsonata('responses."200".examples."application/json"');
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
});
