import { HeaderName, Router, createNodeDispatcher } from 'routup';
import path from 'node:path';
import supertest from 'supertest';
import { assets } from '../../src';

const directoryPath = path.join(__dirname, '..', 'data');

describe('src/module', () => {
    it('should serve text file', async () => {
        const router = new Router();

        router.use(assets(directoryPath));

        const server = supertest(createNodeDispatcher(router));

        const response = await server
            .get('/file.txt');

        expect(response.text).toEqual('foo\n');
        expect(response.headers[HeaderName.CONTENT_TYPE]).toEqual('text/plain; charset=utf-8');
        expect(response.headers[HeaderName.CONTENT_LENGTH]).toEqual('4');
    });

    it('should serve node modules file', async () => {
        const router = new Router();

        router.use('/docs', assets(path.dirname(require.resolve('swagger-ui-dist')), {
            scan: false,
        }));

        const server = supertest(createNodeDispatcher(router));

        const response = await server
            .get('/docs/swagger-ui-bundle.js');

        expect(response.headers[HeaderName.CONTENT_TYPE]).toEqual('application/javascript; charset=utf-8');
    });

    it('should serve non preloaded text file', async () => {
        const router = new Router();

        router.use(assets(directoryPath, {
            scan: false,
        }));

        const server = supertest(createNodeDispatcher(router));

        const response = await server
            .get('/file.txt');

        expect(response.text).toEqual('foo\n');
        expect(response.headers[HeaderName.CONTENT_TYPE]).toEqual('text/plain; charset=utf-8');
        expect(response.headers[HeaderName.CONTENT_LENGTH]).toEqual('4');
    });

    it('should serve js file', async () => {
        const router = new Router();

        router.use(assets(directoryPath));

        const server = supertest(createNodeDispatcher(router));

        const response = await server
            .get('/file.js');

        expect(response.text).toEqual('console.log(\'foo\');\n');
        expect(response.headers[HeaderName.CONTENT_TYPE]).toEqual('application/javascript; charset=utf-8');
        expect(response.headers[HeaderName.CONTENT_LENGTH]).toEqual('20');
    });

    it('should not serve file', async () => {
        const router = new Router();

        router.use(assets(directoryPath));

        const server = supertest(createNodeDispatcher(router));

        const response = await server
            .get('/file.bar');

        expect(response.statusCode).toEqual(404);
        expect(response.headers[HeaderName.CONTENT_LENGTH]).toEqual('0');
    });

    it('should serve directory by index file', async () => {
        const router = new Router();

        router.use(assets(directoryPath, {
            fallback: true,
        }));

        const server = supertest(createNodeDispatcher(router));

        let response = await server
            .get('/html');

        expect(response.text).toEqual('foo\n');
        expect(response.headers[HeaderName.CONTENT_TYPE]).toEqual('text/html; charset=utf-8');
        expect(response.headers[HeaderName.CONTENT_LENGTH]).toEqual('4');

        response = await server
            .get('/html/');

        expect(response.text).toEqual('foo\n');
        expect(response.headers[HeaderName.CONTENT_TYPE]).toEqual('text/html; charset=utf-8');
        expect(response.headers[HeaderName.CONTENT_LENGTH]).toEqual('4');
    });
});
