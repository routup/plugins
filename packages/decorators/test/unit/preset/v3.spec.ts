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

function generateFixture(name: string) {
    return generateMetadata({
        cache: false,
        preset: buildPreset(),
        entryPoint: {
            cwd: path.resolve(process.cwd(), 'test', 'fixtures', name),
            pattern: '**/*.ts',
        },
    });
}

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
        expect(operation.responses['202']!.description).toEqual('Accepted');
        expect(operation.responses['202']!.content!['application/json']!.schema)
            .toEqual({ $ref: '#/components/schemas/StatusAcceptedResponse' });
    });

    it('should read @DStatus regardless of decorator order', async () => {
        const operation = spec.paths['/status/created']!.get!;

        expect(Object.keys(operation.responses)).toEqual(['201']);
        expect(operation.responses['201']!.description).toEqual('Created');
        expect(operation.responses['201']!.content!['application/json']!.schema).toEqual({ type: 'string' });
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
        expect(operation.responses['200']!.description).toEqual('Ok');
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
            expect(operation.responses['201']!.description).toEqual('Created');
            expect(operation.responses['201']!.content).toEqual({ 'image/png': { schema: { type: 'string', format: 'binary' } } });
        }
    });

    it('should merge a @DProduces response into a @DReturns response regardless of decorator order', async () => {
        for (const order of ['spr', 'srp', 'psr', 'prs', 'rsp', 'rps']) {
            const operation = spec.paths[`/produces/returns-${order}`]!.post!;

            expect(Object.keys(operation.responses), order).toEqual(['201']);
            expect(operation.responses['201']!.description, order).toEqual('Created');
            expect(operation.responses['201']!.content, order).toEqual({ 'application/pdf': { schema: { type: 'string', format: 'binary' } } });
        }
    });

    it('should place @DProduces on the @DStatus response next to a @DReturns(200) regardless of decorator order', async () => {
        for (const order of ['spr', 'srp', 'psr', 'prs', 'rsp', 'rps']) {
            const operation = spec.paths[`/produces/explicit-ok-${order}`]!.post!;

            expect(Object.keys(operation.responses).sort(), order).toEqual(['200', '201']);
            expect(operation.responses['200']!.description, order).toEqual('Explicit 200');
            expect(operation.responses['200']!.content, order).toEqual({ 'application/json': { schema: { $ref: '#/components/schemas/ExplicitOk' } } });
            expect(operation.responses['201']!.description, order).toEqual('Created');
            expect(operation.responses['201']!.content, order).toEqual({ 'application/pdf': { schema: { type: 'string', format: 'binary' } } });
        }
    });

    it('should keep a @DReturns schema when merging a @DProduces response', async () => {
        for (const order of ['prs', 'srp']) {
            const operation = spec.paths[`/produces/returns-typed-${order}`]!.post!;

            expect(Object.keys(operation.responses), order).toEqual(['201']);
            expect(operation.responses['201']!.description, order).toEqual('Created');
            expect(operation.responses['201']!.content, order).toEqual({ 'application/pdf': { schema: { $ref: '#/components/schemas/ProducedFile' } } });
        }
    });

    it('should keep the return type for other @DProduces types', async () => {
        const operation = spec.paths['/produces/json']!.get!;
        const content = operation.responses['200']!.content!;

        expect(Object.keys(content)).toEqual(['application/xml']);
        expect((content['application/xml']!.schema as Record<string, any>).type).toEqual('object');
    });

    it('should apply a class-level @DProduces to its methods', async () => {
        const operation = spec.paths['/produces-class']!.get!;

        expect(Object.keys(operation.responses['200']!.content!)).toEqual(['text/html']);
    });

    it('should let a method-level @DProduces replace the class-level one', async () => {
        const operation = spec.paths['/produces-class/method']!.get!;

        expect(Object.keys(operation.responses['200']!.content!)).toEqual(['text/plain']);
    });

    it('should apply a class-level @DProduces to the success response only', async () => {
        const operation = spec.paths['/produces-class/with-error']!.get!;

        expect(Object.keys(operation.responses['200']!.content!)).toEqual(['text/html']);
        expect(Object.keys(operation.responses['404']!.content!)).toEqual(['application/json']);
    });

    it('should apply other @DProduces types to the success response only', async () => {
        const operation = spec.paths['/produces/xml-with-error']!.get!;

        expect(Object.keys(operation.responses['200']!.content!)).toEqual(['application/xml']);
        expect(Object.keys(operation.responses['404']!.content!)).toEqual(['application/json']);
    });

    it('should document no body for a @DStatus(204)', async () => {
        const operation = spec.paths['/status/empty']!.get!;

        expect(operation.responses).toEqual({ 204: { description: 'No content' } });
    });

    it('should document a binary @DProduces type for a method without a return value', async () => {
        const operation = spec.paths['/status/next']!.get!;

        expect(Object.keys(operation.responses)).toEqual(['201']);
        expect(operation.responses['201']!.content).toEqual({ 'application/pdf': { schema: { type: 'string', format: 'binary' } } });
    });

    it('should apply @DProduces media types to the success response only', async () => {
        const operation = spec.paths['/produces/with-error']!.get!;

        expect(Object.keys(operation.responses['200']!.content!)).toEqual(['application/octet-stream']);
        expect(Object.keys(operation.responses['404']!.content!)).toEqual(['application/json']);
    });

    describe('DReturns', () => {
        const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });

        it('should add error responses next to the success response', async () => {
            const { responses } = spec.paths['/returns']!.post!;

            expect(Object.keys(responses).sort()).toEqual(['200', '400', '401', '409']);
            expect(responses['409']!.description).toEqual('User exists');
            expect(responses['400']!.description).toEqual('Bad Request');
            expect(responses['409']!.content!['application/json']!.schema).toEqual(ref('ConflictPayload'));
            expect(responses['400']!.content!['application/json']!.schema).toEqual(ref('ValidationPayload'));
            expect(responses['200']!.content!['application/json']!.schema).toEqual(ref('UserPayload'));
        });

        it('should describe the @DStatus response and add another success response', async () => {
            const { responses } = spec.paths['/returns/{name}']!.put!;

            expect(responses['201']).toBeDefined();
            expect(responses['202']).toBeDefined();
            expect(responses['200']).toBeUndefined();
            expect(responses['201']!.description).toEqual('Created');
            expect(responses['202']!.description).toEqual('Accepted');
            expect(responses['201']!.content!['application/json']!.schema).toEqual(ref('UserPayload'));
            expect(responses['202']!.content!['application/json']!.schema).toEqual(ref('UserPayload'));
        });

        it('should default the description to the reason phrase', async () => {
            const { responses } = spec.paths['/returns/{name}']!.delete!;

            expect(responses['204']!.description).toEqual('No content');
            expect(responses['204']!.content).toBeUndefined();
            expect(responses['200']).toBeUndefined();
        });

        it('should keep the return type for a @DReturns(200) without a type', async () => {
            const { responses } = spec.paths['/returns/{name}']!.patch!;

            expect(responses['200']!.description).toEqual('Patched');
            expect(responses['200']!.content!['application/json']!.schema).toEqual(ref('UserPayload'));
        });

        it('should resolve a constant or enum member as status', async () => {
            const metadata = await generateFixture('returns-status-constant');
            const document = await generateSwagger({ version: Version.V3, metadata });
            const { get, post } = document.paths['/constant']!;

            expect(Object.keys(get!.responses).sort()).toEqual(['200', '404', '409']);
            expect(get!.responses['409']!.description).toEqual('Conflict');
            expect(get!.responses['409']!.content!['application/json']!.schema).toEqual(ref('ConflictPayload'));
            expect(get!.responses['404']!.description).toEqual('Not Found');
            expect(get!.responses['200']!.content!['application/json']!.schema).toEqual(ref('UserPayload'));

            expect(Object.keys(post!.responses)).toEqual(['201']);
            expect(post!.responses['201']!.content!['application/json']!.schema).toEqual(ref('UserPayload'));
        });

        it('should reject a status that cannot be resolved', async () => {
            await expect(generateFixture('returns-status-unresolvable'))
                .rejects.toThrow(/DReturns/);
            await expect(generateFixture('status-unresolvable'))
                .rejects.toThrow(/DStatus/);
        });

        it('should accept a string status', async () => {
            const { responses } = spec.paths['/returns/{name}']!.get!;

            expect(responses['404']!.description).toEqual('Missing');
            expect(responses['404']!.content!['application/json']!.schema).toEqual(ref('NotFoundPayload'));
        });

        it('should add a class-level response to every operation', async () => {
            const operations = spec.paths['/returns']!;
            const itemOperations = spec.paths['/returns/{name}']!;

            for (const operation of [operations.post!, itemOperations.put!, itemOperations.delete!, itemOperations.get!]) {
                expect(operation.responses['401']!.description).toEqual('Unauthorized');
                expect(operation.responses['401']!.content!['application/json']!.schema).toEqual(ref('UnauthorizedPayload'));
            }
        });

        it('should let a method-level response win over a class-level one at the same status', async () => {
            const post = spec.paths['/returns']!.post!;
            const put = spec.paths['/returns/{name}']!.put!;

            expect(post.responses['400']!.description).toEqual('Bad Request');
            expect(post.responses['400']!.content!['application/json']!.schema).toEqual(ref('ValidationPayload'));
            expect(put.responses['400']!.description).toEqual('Class level');
            expect(put.responses['400']!.content!['application/json']!.schema).toEqual(ref('ValidationPayload'));
        });
    });
});
