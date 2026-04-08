import { describe, expect, it } from 'vitest';
import { query, useRequestQuery } from '@routup/query';
import { Router } from 'routup';
import { decorators } from '../../src';
import { QueryController } from '../data/query';

function createTestRequest(url: string, options?: RequestInit): Request {
    const fullUrl = url.startsWith('http') ? url : `http://localhost${url}`;
    return new Request(fullUrl, options);
}

describe('src/decorator', () => {
    it('should handle query decorator', async () => {
        const router = new Router();

        router.use(query());
        router.use(decorators({
            controllers: [QueryController],
            parameter: {
                query: (context, name) => {
                    if (name) {
                        return useRequestQuery(context.event, name);
                    }

                    return useRequestQuery(context.event);
                },
            },
        }));

        let response = await router.fetch(createTestRequest('/query/many?foo=bar'));

        expect(response.status).toEqual(200);
        expect(await response.json()).toEqual({ foo: 'bar' });

        response = await router.fetch(createTestRequest('/query/single?foo=bar'));

        expect(response.status).toEqual(200);
        expect(await response.text()).toEqual('bar');
    });
});
