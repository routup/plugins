import { describe, expect, it } from 'vitest';
import {
    Router,
    defineCoreHandler,
} from 'routup';
import { Registry } from 'prom-client';
import type { OptionsInput } from '../../src';
import {
    MetricName,
    prometheus,
} from '../../src';

function createTestRequest(url: string, options?: RequestInit): Request {
    const fullUrl = url.startsWith('http') ? url : `http://localhost${url}`;
    return new Request(fullUrl, options);
}

function createRouterWithHandlers(options?: OptionsInput): Router {
    options = options || {};

    if (!options.registry) {
        options.registry = new Registry();
    }

    const router = new Router();
    router.use(prometheus(options));

    router.get('/', defineCoreHandler(() => 'Hello, World!'));

    return router;
}

describe('src/module', () => {
    it('should serve metrics', async () => {
        const router = createRouterWithHandlers();

        let response = await router.fetch(createTestRequest('/'));

        expect(response.status).toEqual(200);

        response = await router.fetch(createTestRequest('/metrics'));

        expect(response.status).toEqual(200);
        const text = await response.text();
        expect(text.includes(`TYPE ${MetricName.REQUEST_DURATION} histogram`)).toBeTruthy();
        expect(text.includes(`TYPE ${MetricName.REQUEST_DURATION} summary`)).toBeFalsy();
        expect(text.includes(`TYPE ${MetricName.UPTIME} gauge`)).toBeTruthy();
    });

    it('should server request summary duration metric', async () => {
        const router = createRouterWithHandlers({ requestDurationType: 'summary' });

        const response = await router.fetch(createTestRequest('/metrics'));

        expect(response.status).toEqual(200);
        const text = await response.text();
        expect(text.includes(`TYPE ${MetricName.REQUEST_DURATION} histogram`)).toBeFalsy();
        expect(text.includes(`TYPE ${MetricName.REQUEST_DURATION} summary`)).toBeTruthy();
    });

    it('should not serve request duration metric', async () => {
        const router = createRouterWithHandlers({ requestDuration: false });

        const response = await router.fetch(createTestRequest('/metrics'));

        expect(response.status).toEqual(200);
        const text = await response.text();
        expect(text.includes(`TYPE ${MetricName.REQUEST_DURATION} histogram`)).toBeFalsy();
        expect(text.includes(`TYPE ${MetricName.REQUEST_DURATION} summary`)).toBeFalsy();
    });

    it('should not serve uptime metric', async () => {
        const router = createRouterWithHandlers({ uptime: false });

        const response = await router.fetch(createTestRequest('/metrics'));

        expect(response.status).toEqual(200);
        const text = await response.text();
        expect(text.includes(`TYPE ${MetricName.UPTIME} gauge`)).toBeFalsy();
    });
});
