import { query, stringify, useRequestQuery } from '@routup/query';
import { Router, createNodeDispatcher } from 'routup';
import supertest from 'supertest';
import { decorators } from '../../src';
import { QueryController } from '../data/query';

describe('src/decorator', () => {
    it('should handle query decorator', async () => {
        const router = new Router();

        router.use(query());
        router.use(decorators({
            controllers: [QueryController],
            parameter: {
                query: (context, name) => {
                    if (name) {
                        return useRequestQuery(context.request, name);
                    }

                    return useRequestQuery(context.request);
                },
            },
        }));

        const server = supertest(createNodeDispatcher(router));

        const qs = {
            foo: 'bar',
        };

        let response = await server
            .get(`/query/many?${stringify(qs)}`);

        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({ foo: 'bar' });

        response = await server
            .get(`/query/single?${stringify(qs)}`);

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('bar');
    });
});
