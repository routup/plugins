import { describe, expect, it } from 'vitest';
import type { IAppEvent } from 'routup';
import { App, defineCoreHandler } from 'routup';
import {
    hasRequestQuery,
    query,
    setRequestQuery,
    useRequestQuery,
} from '@routup/query';
import type { Options } from '@routup/query';
import { app as defaultValue } from '../../../examples/query/default-value';
import { app as filters } from '../../../examples/query/filters';
import { app as parserOptions } from '../../../examples/query/parser-options';
import { app as quickStart } from '../../../examples/query/quick-start';
import { app as readValues } from '../../../examples/query/read-values';

async function read(app: App, path: string): Promise<unknown> {
    const response = await app.fetch(new Request(`http://localhost${path}`));

    return response.json();
}

function create(fn: (event: IAppEvent) => unknown, options?: Options | false): App {
    const app = new App();

    if (options !== false) {
        app.use(query(options));
    }

    app.get('/', defineCoreHandler(fn));

    return app;
}

describe('quick-start', () => {
    it('reads a nested key and a flat one', async () => {
        expect(await read(quickStart, '/users?page[limit]=10&page[offset]=0&sort=-name')).toEqual({
            page: { limit: '10', offset: '0' },
            sort: '-name',
        });
    });
});

describe('read-values', () => {
    it('reads all values and single ones', async () => {
        expect(await read(readValues, '/search?q=routup&limit=5&tag=http&tag=router')).toEqual({
            all: {
                q: 'routup',
                limit: '5',
                tag: ['http', 'router'],
            },
            q: 'routup',
            limit: 5,
            tags: ['http', 'router'],
        });
    });

    it('falls back for missing and invalid values', async () => {
        expect(await read(readValues, '/search?limit=abc&tag=http')).toEqual({
            all: { limit: 'abc', tag: 'http' },
            q: '',
            limit: 20,
            tags: ['http'],
        });
    });
});

describe('filters', () => {
    it('turns bracket keys into objects and arrays', async () => {
        expect(await read(filters, '/issues?filter[status]=open&filter[labels][]=bug&filter[labels][]=ui&fields[issue]=title')).toEqual({
            filter: { status: 'open', labels: ['bug', 'ui'] },
            fields: { issue: 'title' },
        });
    });
});

describe('filters, percent-encoded', () => {
    it('reads encoded brackets the same way', async () => {
        expect(await read(filters, '/issues?filter%5Bstatus%5D=open&fields%5Bissue%5D=title')).toEqual({
            filter: { status: 'open' },
            fields: { issue: 'title' },
        });
    });
});

describe('parser-options', () => {
    it('reads dots as nesting and splits on commas', async () => {
        expect(await read(parserOptions, '/issues?filter.status=open&ids=1,2,3')).toEqual({
            filter: { status: 'open' },
            ids: ['1', '2', '3'],
        });
    });

    it('keeps keys deeper than depth as a literal key', async () => {
        expect(await read(parserOptions, '/issues?a[b][c][d]=x')).toEqual({ a: { b: { c: { '[d]': 'x' } } } });
    });

    it('drops parameters beyond parameterLimit', async () => {
        const params = Array.from({ length: 60 }, (_, i) => `p${i}=${i}`).join('&');
        const output = await read(parserOptions, `/issues?${params}`) as Record<string, string>;

        expect(Object.keys(output)).toHaveLength(50);
    });
});

describe('default-value', () => {
    it('provides a default for later handlers', async () => {
        expect(await read(defaultValue, '/items')).toEqual({ limit: '20' });
        expect(await read(defaultValue, '/items?limit=5')).toEqual({ limit: '5' });
    });
});

describe('behaviour stated on the pages', () => {
    it('returns {} and undefined without the plugin', async () => {
        const app = create((event) => ({ all: useRequestQuery(event), one: useRequestQuery(event, 'a') ?? null }), false);

        expect(await read(app, '/?a=1')).toEqual({ all: {}, one: null });
    });

    it('returns {} for a URL without a query string', async () => {
        expect(await read(create((event) => useRequestQuery(event)), '/')).toEqual({});
    });

    it('ignores the fragment', async () => {
        expect(await read(create((event) => useRequestQuery(event)), '/?a=1#b=2')).toEqual({ a: '1' });
    });

    it('decodes + and percent escapes', async () => {
        expect(await read(create((event) => useRequestQuery(event)), '/?q=hello+wide%20world')).toEqual({ q: 'hello wide world' });
    });

    it('builds an object from index 20 and from 21 repeated keys', async () => {
        const app = create((event) => useRequestQuery(event));
        const twenty = Array.from({ length: 20 }, (_, i) => `t=${i}`).join('&');
        const twentyOne = Array.from({ length: 21 }, (_, i) => `t=${i}`).join('&');

        expect(await read(app, '/?a[19]=x')).toEqual({ a: ['x'] });
        expect(await read(app, '/?a[20]=x')).toEqual({ a: { 20: 'x' } });
        expect(Array.isArray(((await read(app, `/?${twenty}`)) as { t: unknown }).t)).toBe(true);
        expect(Array.isArray(((await read(app, `/?${twentyOne}`)) as { t: unknown }).t)).toBe(false);
    });

    it('stops nesting after five levels and keeps the first 1000 parameters', async () => {
        const app = create((event) => useRequestQuery(event));

        expect(await read(app, '/?a[b][c][d][e][f][g]=x')).toEqual({ a: { b: { c: { d: { e: { f: { '[g]': 'x' } } } } } } });

        const params = Array.from({ length: 1001 }, (_, i) => `p${i}=${i}`).join('&');

        expect(Object.keys(await read(app, `/?${params}`) as object)).toHaveLength(1000);
    });

    it('does not parse again when a query is stored already', async () => {
        const app = new App();

        app.use(defineCoreHandler((event) => {
            setRequestQuery(event, { fixed: 'yes' });

            return event.next();
        }));
        app.use(query());
        app.get('/', defineCoreHandler((event) => useRequestQuery(event)));

        expect(await read(app, '/?a=1')).toEqual({ fixed: 'yes' });
    });

    it('merges one key, replaces with a record and leaves the URL alone', async () => {
        const app = create((event) => {
            setRequestQuery(event, 'b', '2');

            const merged = { ...useRequestQuery(event) };

            setRequestQuery(event, { c: '3' });

            return {
                merged,
                replaced: useRequestQuery(event),
                searchParams: event.searchParams.toString(),
                url: event.request.url,
            };
        });

        expect(await read(app, '/?a=1')).toEqual({
            merged: { a: '1', b: '2' },
            replaced: { c: '3' },
            searchParams: 'a=1',
            url: 'http://localhost/?a=1',
        });
    });

    it('reports whether a query is stored', async () => {
        const app = create((event) => {
            const before = hasRequestQuery(event);

            setRequestQuery(event, { a: '1' });

            return { before, after: hasRequestQuery(event) };
        }, false);

        expect(await read(app, '/')).toEqual({ before: false, after: true });
    });

    it('throws for a too deep key only with strictDepth', async () => {
        const deep = '/?a[b][c][d]=x';
        const loose = create(() => 'ok', { parse: { depth: 2, throwOnLimitExceeded: true } });
        const strict = create(() => 'ok', { parse: { depth: 2, strictDepth: true } });

        expect((await loose.fetch(new Request(`http://localhost${deep}`))).status).toBe(200);
        expect((await strict.fetch(new Request(`http://localhost${deep}`))).status).toBe(500);
    });

    it('answers 500 when throwOnLimitExceeded meets too many parameters', async () => {
        // the route does not read the query
        const app = create(() => 'ok', { parse: { parameterLimit: 1, throwOnLimitExceeded: true } });

        expect((await app.fetch(new Request('http://localhost/?a=1&b=2'))).status).toBe(500);
        expect((await app.fetch(new Request('http://localhost/?a[25]=x'))).status).toBe(500);
        expect((await app.fetch(new Request('http://localhost/?a=1'))).status).toBe(200);
    });

    it('answers 500 when throwOnLimitExceeded meets more than arrayLimit repeated keys', async () => {
        const app = create(() => 'ok', { parse: { throwOnLimitExceeded: true } });
        const repeat = (count: number, pair: (index: number) => string) => Array.from({ length: count }, (_, index) => pair(index)).join('&');

        expect((await app.fetch(new Request(`http://localhost/?${repeat(21, (index) => `a=${index}`)}`))).status).toBe(500);
        expect((await app.fetch(new Request(`http://localhost/?${repeat(21, () => 'a[]=x')}`))).status).toBe(500);
        expect((await app.fetch(new Request(`http://localhost/?${repeat(20, (index) => `a=${index}`)}`))).status).toBe(200);
    });
});
