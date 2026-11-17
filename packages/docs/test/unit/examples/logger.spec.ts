import { once } from 'node:events';
import { readFileSync, rmSync } from 'node:fs';
import {
    afterAll,
    afterEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';
import type { IAppEvent } from 'routup';
import { App, defineCoreHandler, defineErrorHandler } from 'routup';
import {
    compile,
    createHandler,
    logger,
    resolveFormat,
} from '@routup/logger';
import type { Options } from '@routup/logger';
import { app as compileSample } from '../../../examples/logger/compile';
import { app as customFormat } from '../../../examples/logger/custom-format';
import { app as extendDev } from '../../../examples/logger/extend-dev';
import { accessLog, app as fileStream } from '../../../examples/logger/file-stream';
import { app as jsonLines } from '../../../examples/logger/json-lines';
import { app as quickStart } from '../../../examples/logger/quick-start';
import { app as skip } from '../../../examples/logger/skip';

// file-stream.ts opens its file on import: point it to a temporary file.
// Hoisted above the imports, so it reaches node:fs and node:path as builtins.
const { logDir, logFile } = vi.hoisted(() => {
    const fs = process.getBuiltinModule('node:fs');
    const os = process.getBuiltinModule('node:os');
    const nodePath = process.getBuiltinModule('node:path');
    const dir = fs.mkdtempSync(nodePath.join(os.tmpdir(), 'routup-logger-'));
    const file = nodePath.join(dir, 'access.log');

    process.env.ACCESS_LOG = file;

    return { logDir: dir, logFile: file };
});

function get(app: App, url: string, headers: Record<string, string> = {}): Promise<Response> {
    return app.fetch(new Request(`http://localhost${url}`, { headers }));
}

// samples on the default sink write with console.log, which is what they document
function captureConsole(): string[] {
    const lines: string[] = [];

    vi.spyOn(console, 'log').mockImplementation((line: string) => {
        lines.push(line);
    });

    return lines;
}

function create(options: Options, setup?: (app: App) => void): { app: App, lines: string[] } {
    const lines: string[] = [];
    const app = new App();

    app.use(logger({
        ...options,
        write: (line) => {
            lines.push(line);
        },
    }));
    setup?.(app);

    return { app, lines };
}

afterEach(() => {
    vi.restoreAllMocks();
});

afterAll(() => {
    rmSync(logDir, { recursive: true, force: true });
    delete process.env.ACCESS_LOG;
});

describe('quick-start', () => {
    it('writes one tiny line per request to console.log', async () => {
        const lines = captureConsole();

        await get(quickStart, '/');

        expect(lines).toHaveLength(1);
        expect(lines[0]).toMatch(/^GET \/ 200 - - \d+\.\d{3} ms$/);
    });
});

describe('custom-format', () => {
    it('renders the custom token and the request header', async () => {
        const lines = captureConsole();

        await get(customFormat, '/', { authorization: 'Bearer ada-token', 'x-request-id': 'r-1' });
        await get(customFormat, '/');

        expect(lines[0]).toMatch(/^GET \/ 200 \d+ ms user=ada id=r-1$/);
        expect(lines[1]).toMatch(/^GET \/ 200 \d+ ms user=- id=-$/);
    });
});

describe('skip', () => {
    it('logs only failed requests other than the health check', async () => {
        const lines = captureConsole();

        await get(skip, '/health');
        await get(skip, '/');
        await get(skip, '/admin');

        expect(lines).toHaveLength(1);
        expect(lines[0]).toMatch(/^GET \/admin 403 - - \d+\.\d{3} ms$/);
    });
});

describe('json-lines', () => {
    it('writes one JSON object per request', async () => {
        const lines = captureConsole();

        await get(jsonLines, '/');

        expect(JSON.parse(lines[0]!)).toEqual({
            method: 'GET',
            url: '/',
            status: 200,
            ms: expect.any(Number),
        });
    });
});

describe('extend-dev', () => {
    it('appends the process id to the dev line', async () => {
        const lines = captureConsole();

        await get(extendDev, '/');

        expect(lines[0]).toMatch(new RegExp(`^GET / \\x1b\\[32m200\\x1b\\[0m \\d+\\.\\d{3} ms - - pid=${process.pid}$`));
    });
});

describe('file-stream', () => {
    it('appends combined lines to the file', async () => {
        await get(fileStream, '/?page=2', {
            authorization: `Basic ${btoa('ada:secret')}`,
            referer: 'https://example.com/',
            'user-agent': 'curl/8.7.1',
        });

        accessLog.end();
        await once(accessLog, 'finish');

        const content = readFileSync(logFile, 'utf8');

        expect(content).toMatch(/^- - ada \[\d{2}\/[A-Z][a-z]{2}\/\d{4}:\d{2}:\d{2}:\d{2} \+0000\] "GET \/\?page=2 HTTP\/1\.1" 200 - "https:\/\/example\.com\/" "curl\/8\.7\.1"\n$/);
    });
});

describe('behaviour stated on the pages', () => {
    it('writes the line after the routes resolved the response, before its body is read', async () => {
        const events: string[] = [];
        const app = new App();

        app.use(logger({
            write: () => {
                events.push('line');
            },
        }));
        app.get('/', defineCoreHandler(() => {
            events.push('route');

            return new ReadableStream({
                pull(controller) {
                    events.push('body');
                    controller.enqueue(new TextEncoder().encode('x'));
                    controller.close();
                },
            }, { highWaterMark: 0 });
        }));

        const response = await get(app, '/');

        expect(events).toEqual(['route', 'line']);

        await response.text();

        expect(events).toEqual(['route', 'line', 'body']);
    });

    it('writes the line before the routes run with immediate, without status', async () => {
        const events: string[] = [];
        const lines: string[] = [];
        const app = new App();

        app.use(logger(':method :url :status :res[content-type]', {
            immediate: true,
            write: (line) => {
                events.push('line');
                lines.push(line);
            },
        }));
        app.get('/', defineCoreHandler(() => {
            events.push('route');

            return 'ok';
        }));

        await get(app, '/');

        expect(events).toEqual(['line', 'route']);
        expect(lines).toEqual(['GET / - -']);
    });

    it('logs - as status for an error and an unmatched path, the real status with an error handler', async () => {
        const { app, lines } = create({ format: ':url :status' }, (target) => {
            target.get('/fail', defineCoreHandler(() => {
                throw new Error('boom');
            }));
        });

        await get(app, '/fail');
        await get(app, '/missing');

        app.use(defineErrorHandler((_error, event) => {
            event.response.status = 503;

            return 'unavailable';
        }));

        await get(app, '/fail');

        expect(lines).toEqual(['/fail -', '/missing -', '/fail 503']);
    });

    it('logs the status of a returned Response and a status set on event.response', async () => {
        const { app, lines } = create({ format: ':url :status :res[content-length]' }, (target) => {
            target.get('/raw', defineCoreHandler(() => new Response('raw', {
                status: 201,
                headers: { 'content-length': '3' },
            })));
            target.get('/accepted', defineCoreHandler((event) => {
                event.response.status = 202;

                return { queued: true };
            }));
        });

        await get(app, '/raw');
        await get(app, '/accepted');

        expect(lines).toEqual(['/raw 201 3', '/accepted 202 -']);
    });

    it('does not log a request a handler before the logger answered', async () => {
        const lines: string[] = [];
        const app = new App();

        app.get('/early', defineCoreHandler(() => 'early'));
        app.use(logger({
            write: (line) => {
                lines.push(line);
            },
        }));
        app.get('/late', defineCoreHandler(() => 'late'));

        await get(app, '/early');
        await get(app, '/late');

        expect(lines).toHaveLength(1);
        expect(lines[0]).toMatch(/^GET \/late /);
    });

    it('renders - for an unknown token and copies other text', async () => {
        const { app, lines } = create({ format: '[:nope] :method :x' }, (target) => {
            target.get('/', defineCoreHandler(() => 'ok'));
        });

        await get(app, '/');

        expect(lines).toEqual(['[-] GET :x']);
    });

    it('renders the date formats and the remote user', async () => {
        const { app, lines } = create({ format: ':date|:date[iso]|:date[clf]|:remote-user|:http-version|:pid' }, (target) => {
            target.get('/', defineCoreHandler(() => 'ok'));
        });

        await get(app, '/', { authorization: `Basic ${btoa('ada:pw')}` });

        const [web, iso, clf, user, version, pid] = lines[0]!.split('|');

        expect(web).toMatch(/^[A-Z][a-z]{2}, \d{2} [A-Z][a-z]{2} \d{4} \d{2}:\d{2}:\d{2} GMT$/);
        expect(iso).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
        expect(clf).toMatch(/^\d{2}\/[A-Z][a-z]{2}\/\d{4}:\d{2}:\d{2}:\d{2} \+0000$/);
        expect(user).toBe('ada');
        expect(version).toBe('1.1');
        expect(pid).toBe(String(process.pid));
    });

    it('renders response-time with the given number of decimals', async () => {
        const { app, lines } = create({ format: ':response-time[0] :response-time :total-time[1]' }, (target) => {
            target.get('/', defineCoreHandler(() => 'ok'));
        });

        await get(app, '/');

        expect(lines[0]).toMatch(/^\d+ \d+\.\d{3} \d+\.\d$/);
    });

    it('replaces a built-in token with one of the same name', async () => {
        const { app, lines } = create({
            format: ':method :url',
            tokens: { method: (event: IAppEvent) => event.method.toLowerCase() },
        }, (target) => {
            target.get('/', defineCoreHandler(() => 'ok'));
        });

        await get(app, '/');

        expect(lines).toEqual(['get /']);
    });

    it('writes nothing when the formatter returns undefined', async () => {
        const { app, lines } = create({ format: () => undefined }, (target) => {
            target.get('/', defineCoreHandler(() => 'ok'));
        });

        await get(app, '/');

        expect(lines).toEqual([]);
    });

    it('lets the format argument win over options.format', async () => {
        const lines: string[] = [];
        const app = new App();

        app.use(logger(':url', {
            format: ':method',
            write: (line) => {
                lines.push(line);
            },
        }));
        app.get('/', defineCoreHandler(() => 'ok'));

        await get(app, '/');

        expect(lines).toEqual(['/']);
    });

    it('swallows an error thrown by write, but not one thrown by skip', async () => {
        const failingWrite = new App();

        failingWrite.use(logger({
            write: () => {
                throw new Error('sink down');
            },
        }));
        failingWrite.get('/', defineCoreHandler(() => 'ok'));

        const failingSkip = new App();

        failingSkip.use(logger({
            skip: () => {
                throw new Error('skip failed');
            },
            write: () => undefined,
        }));
        failingSkip.get('/', defineCoreHandler(() => 'ok'));

        expect((await get(failingWrite, '/')).status).toBe(200);
        expect((await get(failingSkip, '/')).status).toBe(500);
    });

    it('colours the dev status by range', async () => {
        const { app, lines } = create({ format: 'dev' }, (target) => {
            target.get('/:status', defineCoreHandler((event) => {
                event.response.status = Number(event.params.status);

                return null;
            }));
        });

        for (const status of [200, 302, 404, 500]) {
            await get(app, `/${status}`);
        }

        expect(lines.map((line) => line.slice(line.indexOf('\x1b'), line.indexOf('m') + 1)))
            .toEqual(['\x1b[32m', '\x1b[36m', '\x1b[33m', '\x1b[31m']);
    });
});

describe('helpers stated on the pages', () => {
    it('returns a function format as is, a formatter for undefined, and compile throws on a non-string', () => {
        const fn = () => 'x';

        expect(resolveFormat(fn)).toBe(fn);
        expect(resolveFormat(undefined)).toBeTypeOf('function');
        expect(() => compile(42 as unknown as string)).toThrow(TypeError);
    });

    it('compiles a derived preset that runs outside logger(), with the response time', async () => {
        const lines = captureConsole();

        await get(compileSample, '/');

        expect(lines).toHaveLength(1);
        expect(lines[0]).toMatch(/^GET \/ 200 - - \d+\.\d{3} ms alice$/);
    });

    it('builds the same handler with createHandler', async () => {
        const lines: string[] = [];
        const app = new App();

        app.use(createHandler({
            format: ':method :url',
            write: (value) => {
                lines.push(value);
            },
        }));
        app.get('/', defineCoreHandler(() => 'ok'));

        await get(app, '/');

        expect(lines).toEqual(['GET /']);
    });
});
