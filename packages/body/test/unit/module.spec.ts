import {
    Router, coreHandler, createNodeDispatcher, send,
} from 'routup';
import supertest from 'supertest';
import {
    body,
    useRequestBody,
} from '../../src';

describe('src/**', () => {
    it('should handle application/json', async () => {
        const router = new Router();

        router.use(body({
            json: true,
        }));

        router.post('/', coreHandler((req, res) => {
            const foo = useRequestBody(req);

            send(res, foo);
        }));

        const server = supertest(createNodeDispatcher(router));

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

        router.use(body({
            urlEncoded: {
                extended: false,
            },
        }));

        router.post('/', coreHandler((req, res) => {
            const foo = useRequestBody(req);

            send(res, foo);
        }));

        const server = supertest(createNodeDispatcher(router));

        const response = await server
            .post('/')
            .send('foo=bar');

        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({ foo: 'bar' });
    });

    it('should handle raw to buffer', async () => {
        const router = new Router();

        router.use(body({
            raw: true,
        }));

        router.post('/', coreHandler((req, res) => {
            const foo = useRequestBody(req);

            send(res, Buffer.isBuffer(foo));
        }));

        const server = supertest(createNodeDispatcher(router));

        const response = await server
            .post('/')
            .set('Content-Type', 'application/octet-stream')
            .send('foo');

        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual(true);
    });

    it('should handle text/html to text', async () => {
        const router = new Router();

        router.use(body({
            text: {
                type: 'text/html',
            },
        }));

        router.post('/', coreHandler((req, res) => {
            const foo = useRequestBody(req);

            send(res, foo);
        }));

        const server = supertest(createNodeDispatcher(router));

        const response = await server
            .post('/')
            .set('Content-Type', 'text/html')
            .send('<div>foo</div>');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('<div>foo</div>');
    });

    it('should parse application/json & application/x-www-form-urlencoded', async () => {
        const router = new Router();

        router.use(body({
            json: true,
            urlEncoded: true,
        }));

        router.post('/multiple', coreHandler((req, res) => {
            const foo = useRequestBody(req);

            send(res, foo);
        }));

        const server = supertest(createNodeDispatcher(router));

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
