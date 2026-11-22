// eslint-disable-next-line max-classes-per-file
import { describe, expect, it } from 'vitest';
import { App, defineErrorHandler } from 'routup';
import {
    DController,
    DGet,
    DPost,
    DProduces,
    DStatus,
    decorators,
} from '../../src';

function decorate(status: number) {
    class Controller {
        @DGet('/')
        @DStatus(status)
        get() {
            return null;
        }
    }

    return Controller;
}

describe('DStatus', () => {
    it.each([100, 103, 199, 600, 1000, 201.5, NaN])('should reject %s when the class is defined', (status) => {
        expect(() => decorate(status)).toThrow(RangeError);
        expect(() => decorate(status)).toThrow(`@DStatus(${status}) of Controller.get: the status must be an integer from 200 to 599.`);
    });

    it.each([200, 204, 302, 599])('should accept %s', (status) => {
        expect(() => decorate(status)).not.toThrow();
    });
});

describe('DStatus: serialization failure', () => {
    @DController('/serialize')
    class SerializeController {
        @DPost('/')
        @DStatus(201)
        @DProduces('application/vnd.api+json')
        create() {
            return { id: 1n };
        }
    }

    it('should not pass the status and media type to the error handler', async () => {
        const app = new App();

        app.use(decorators({ controllers: [SerializeController] }));
        app.use(defineErrorHandler((error, event) => ({
            message: error.message,
            status: event.response.status,
            contentType: event.response.headers.get('content-type'),
        })));

        const response = await app.fetch(new Request('http://localhost/serialize', { method: 'POST' }));

        expect(response.status).toEqual(200);
        expect(response.headers.get('content-type')).toMatch(/^application\/json/);
        expect(await response.json()).toEqual({
            message: 'JSON serialization failed',
            status: 200,
            contentType: null,
        });
    });

    it('should answer with 500 without an error handler', async () => {
        const app = new App();

        app.use(decorators({ controllers: [SerializeController] }));

        const response = await app.fetch(new Request('http://localhost/serialize', { method: 'POST' }));

        expect(response.status).toEqual(500);
    });
});
