import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';
import {
    Router,
    defineCoreHandler,
} from 'routup';
import {
    compile,
    devFormatter,
    formatStrings,
    logger,
    resolveFormat,
} from '../../src';

function createTestRequest(url: string, options?: RequestInit): Request {
    const fullUrl = url.startsWith('http') ? url : `http://localhost${url}`;
    return new Request(fullUrl, options);
}

describe('plugin', () => {
    let lines: string[];
    let write: (line: string) => void;

    beforeEach(() => {
        lines = [];
        write = (line) => lines.push(line);
    });

    it('should log default tiny format after response', async () => {
        const router = new Router();
        router.use(logger({ write }));
        router.get('/items', defineCoreHandler(() => 'ok'));

        const response = await router.fetch(createTestRequest('/items'));
        expect(response.status).toEqual(200);

        expect(lines).toHaveLength(1);
        expect(lines[0]).toMatch(/^GET \/items 200 .* - [\d.]+ ms$/);
    });

    it('should accept a custom format string', async () => {
        const router = new Router();
        router.use(logger(':method :status', { write }));
        router.post('/x', defineCoreHandler(() => new Response('made', { status: 201 })));

        await router.fetch(createTestRequest('/x', { method: 'POST' }));

        expect(lines).toEqual(['POST 201']);
    });

    it('should accept a custom formatter function', async () => {
        const router = new Router();
        router.use(logger(
            (_tokens, event, response) => `[${event.method}] ${response?.status ?? '-'}`,
            { write },
        ));
        router.get('/', defineCoreHandler(() => 'ok'));

        await router.fetch(createTestRequest('/'));

        expect(lines).toEqual(['[GET] 200']);
    });

    it('should support skip predicate', async () => {
        const router = new Router();
        router.use(logger({
            write,
            skip: (event) => event.path === '/health',
        }));
        router.get('/health', defineCoreHandler(() => 'pong'));
        router.get('/api', defineCoreHandler(() => 'data'));

        await router.fetch(createTestRequest('/health'));
        await router.fetch(createTestRequest('/api'));

        expect(lines).toHaveLength(1);
        expect(lines[0]).toMatch(/^GET \/api/);
    });

    it('should support custom tokens', async () => {
        const router = new Router();
        router.use(logger(':who', {
            write,
            tokens: { who: () => 'agent-007' },
        }));
        router.get('/', defineCoreHandler(() => 'ok'));

        await router.fetch(createTestRequest('/'));

        expect(lines).toEqual(['agent-007']);
    });

    it('should log immediately when immediate=true', async () => {
        const router = new Router();
        router.use(logger(':method :status', { write, immediate: true }));
        router.get('/', defineCoreHandler(() => 'ok'));

        await router.fetch(createTestRequest('/'));

        expect(lines).toEqual(['GET -']);
    });

    it('should use console.log when no write fn given', async () => {
        const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);

        const router = new Router();
        router.use(logger());
        router.get('/', defineCoreHandler(() => 'ok'));

        await router.fetch(createTestRequest('/'));

        expect(log).toHaveBeenCalledTimes(1);
        log.mockRestore();
    });
});

describe('resolveFormat / formatStrings', () => {
    it('should expose tiny / short / common / combined preset strings', () => {
        expect(formatStrings.tiny).toContain(':method');
        expect(formatStrings.combined).toContain(':referrer');
    });

    it('should treat string as preset name when matched', () => {
        const fn = resolveFormat('tiny');
        expect(typeof fn).toEqual('function');
    });

    it('should treat unknown string as raw format', () => {
        const fn = resolveFormat(':method ::raw');
        expect(typeof fn).toEqual('function');
    });

    it('should pass through formatter functions', () => {
        const fmt = () => 'static';
        expect(resolveFormat(fmt)).toBe(fmt);
    });

    it('should default to tiny when given non-string non-fn', () => {
        const fn = resolveFormat(undefined);
        expect(typeof fn).toEqual('function');
    });

    it('should colorize dev format by status', () => {
        const out200 = devFormatter(
            {
                method: () => 'GET', 
                url: () => '/', 
                status: () => '200', 
            },
            { method: 'GET' } as any,
            { status: 200, headers: new Headers() } as any,
        );
        const out500 = devFormatter(
            {
                method: () => 'GET', 
                url: () => '/', 
                status: () => '500', 
            },
            { method: 'GET' } as any,
            { status: 500, headers: new Headers() } as any,
        );

        expect(out200).toContain('\x1b[32m');
        expect(out500).toContain('\x1b[31m');
    });
});

describe('compile', () => {
    it('should replace tokens in order', () => {
        const fn = compile(':method | :url');
        const out = fn(
            { method: () => 'POST', url: () => '/x' },
            {} as any,
            undefined,
        );
        expect(out).toEqual('POST | /x');
    });

    it('should support [arg] tokens', () => {
        const fn = compile(':res[content-length]');
        const out = fn(
            { res: (_e, _r, field) => (field === 'content-length' ? '42' : undefined) },
            {} as any,
            undefined,
        );
        expect(out).toEqual('42');
    });

    it('should fall back to "-" when token returns undefined', () => {
        const fn = compile(':missing :method');
        const out = fn(
            { method: () => 'GET' },
            {} as any,
            undefined,
        );
        expect(out).toEqual('- GET');
    });

    it('should throw on non-string format', () => {
        expect(() => compile(123 as unknown as string)).toThrow(TypeError);
    });
});

describe('built-in tokens', () => {
    let lines: string[];
    let write: (line: string) => void;

    beforeEach(() => {
        lines = [];
        write = (line) => lines.push(line);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it(':url renders pathname + search', async () => {
        const router = new Router();
        router.use(logger(':url', { write }));
        router.get('/x', defineCoreHandler(() => 'ok'));

        await router.fetch(createTestRequest('/x?foo=bar'));

        expect(lines).toEqual(['/x?foo=bar']);
    });

    it(':status renders the response status', async () => {
        const router = new Router();
        router.use(logger(':status', { write }));
        router.get('/', defineCoreHandler(() => new Response('!', { status: 418 })));

        await router.fetch(createTestRequest('/'));

        expect(lines).toEqual(['418']);
    });

    it(':response-time produces a numeric ms value', async () => {
        const router = new Router();
        router.use(logger(':response-time', { write }));
        router.get('/', defineCoreHandler(() => 'ok'));

        await router.fetch(createTestRequest('/'));

        expect(lines).toHaveLength(1);
        expect(lines[0]).toMatch(/^\d+\.\d{3}$/);
    });

    it(':req[name] renders a request header', async () => {
        const router = new Router();
        router.use(logger(':req[x-trace]', { write }));
        router.get('/', defineCoreHandler(() => 'ok'));

        await router.fetch(createTestRequest('/', { headers: { 'x-trace': 'abc' } }));

        expect(lines).toEqual(['abc']);
    });

    it(':res[name] renders a response header', async () => {
        const router = new Router();
        router.use(logger(':res[x-foo]', { write }));
        router.get('/', defineCoreHandler(() => new Response('ok', { headers: { 'x-foo': 'bar' } })));

        await router.fetch(createTestRequest('/'));

        expect(lines).toEqual(['bar']);
    });

    it(':user-agent renders the request user-agent', async () => {
        const router = new Router();
        router.use(logger(':user-agent', { write }));
        router.get('/', defineCoreHandler(() => 'ok'));

        await router.fetch(createTestRequest('/', { headers: { 'user-agent': 'curl/8' } }));

        expect(lines).toEqual(['curl/8']);
    });

    it(':remote-user decodes basic auth', async () => {
        const router = new Router();
        router.use(logger(':remote-user', { write }));
        router.get('/', defineCoreHandler(() => 'ok'));

        const auth = `Basic ${btoa('alice:secret')}`;
        await router.fetch(createTestRequest('/', { headers: { authorization: auth } }));

        expect(lines).toEqual(['alice']);
    });

    it(':date renders an ISO timestamp when format=iso', async () => {
        const router = new Router();
        router.use(logger(':date[iso]', { write }));
        router.get('/', defineCoreHandler(() => 'ok'));

        await router.fetch(createTestRequest('/'));

        expect(lines).toHaveLength(1);
        expect(lines[0]).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it(':date[clf] renders the CLF format', async () => {
        const router = new Router();
        router.use(logger(':date[clf]', { write }));
        router.get('/', defineCoreHandler(() => 'ok'));

        await router.fetch(createTestRequest('/'));

        expect(lines).toHaveLength(1);
        expect(lines[0]).toMatch(/^\d{2}\/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\/\d{4}:/);
    });
});
