import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';
import type * as Routup from 'routup';
import '../../../examples/readme/quick-start';

// the sample starts a server; the stub keeps the app it is given instead
const served = vi.hoisted(() => ({ apps: [] as unknown[] }));

vi.mock('routup', async (importOriginal) => ({
    ...await importOriginal<typeof Routup>(),
    serve: (app: unknown) => {
        served.apps.push(app);
    },
}));

const sampleFile = fileURLToPath(new URL('../../../examples/readme/quick-start.ts', import.meta.url));
const readmeFile = fileURLToPath(new URL('../../../../../README.md', import.meta.url));

const ORIGIN = 'https://app.example.com';

describe('root README quick start', () => {
    let lines: string[];

    beforeEach(() => {
        lines = [];
        vi.spyOn(console, 'log').mockImplementation((line: string) => {
            lines.push(line);
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('is the code of the README', () => {
        const normalize = (input: string) => input.replace(/\r\n/g, '\n').trim();

        expect(normalize(readFileSync(readmeFile, 'utf8'))).toContain(normalize(readFileSync(sampleFile, 'utf8')));
    });

    it('serves an app that logs, sets CORS and rate-limit headers, and reads the body, the cookie and the query', async () => {
        expect(served.apps).toHaveLength(1);

        const app = served.apps[0] as Routup.App;
        const response = await app.fetch(new Request('http://localhost/posts?draft=true', {
            method: 'POST',
            headers: {
                origin: ORIGIN,
                cookie: 'session=abc',
                'content-type': 'application/json',
            },
            body: JSON.stringify({ title: 'Write docs' }),
        }));

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({
            post: { title: 'Write docs' },
            session: 'abc',
            draft: 'true',
        });
        expect(response.headers.get('access-control-allow-origin')).toBe(ORIGIN);
        expect(response.headers.get('access-control-allow-credentials')).toBe('true');
        expect(response.headers.get('ratelimit-remaining')).toBe('99');
        expect(lines).toHaveLength(1);
        expect(lines[0]).toMatch(/^POST \/posts\?draft=true \S*200/);
    });
});
