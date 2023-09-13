import { Router, createNodeListener, send } from 'routup';
import supertest from 'supertest';
import {
    createHandler,
    createJsonHandler,
    createRawHandler,
    createTextHandler,
    createUrlEncodedHandler,
    useRequestBody,
} from '../../src';

describe('src/**', () => {
    it('should handle application/json', async () => {
        const router = new Router();

        router.use(createJsonHandler());

        router.post('/', (req, res) => {
            const foo = useRequestBody(req);

            send(res, foo);
        });

        const server = supertest(createNodeListener(router));

        const response = await server
            .post('/')
            .send({
                foo: 'bar',
            });

        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({ foo: 'bar' });
    });

    it('should handle application/x-www-form-urlencoded', async () => {
        const router = new Router();

        router.use(createUrlEncodedHandler({ extended: false }));

        router.post('/', (req, res) => {
            const foo = useRequestBody(req);

            send(res, foo);
        });

        const server = supertest(createNodeListener(router));

        const response = await server
            .post('/')
            .send('foo=bar');

        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({ foo: 'bar' });
    });

    it('should handle raw to buffer', async () => {
        const router = new Router();

        router.use(createRawHandler());

        router.post('/', (req, res) => {
            const foo = useRequestBody(req);

            send(res, Buffer.isBuffer(foo));
        });

        const server = supertest(createNodeListener(router));

        const response = await server
            .post('/')
            .set('Content-Type', 'application/octet-stream')
            .send('foo');

        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual(true);
    });

    it('should handle text/html to text', async () => {
        const router = new Router();

        router.use(createTextHandler({ type: 'text/html' }));

        router.post('/', (req, res) => {
            const foo = useRequestBody(req);

            send(res, foo);
        });

        const server = supertest(createNodeListener(router));

        const response = await server
            .post('/')
            .set('Content-Type', 'text/html')
            .send('<div>foo</div>');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('<div>foo</div>');
    });

    it('should parse application/json & application/x-www-form-urlencoded', async () => {
        const router = new Router();

        router.use(createHandler());

        router.post('/multiple', (req, res) => {
            const foo = useRequestBody(req);

            send(res, foo);
        });

        const server = supertest(createNodeListener(router));

        let response = await server
            .post('/multiple')
            .send({
                foo: 'bar',
            });

        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({ foo: 'bar' });

        response = await server
            .post('/multiple')
            .send('foo=bar');

        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({ foo: 'bar' });
    });
});
