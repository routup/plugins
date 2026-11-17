import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const docsRoot = fileURLToPath(new URL('../..', import.meta.url));
const srcRoot = path.join(docsRoot, 'src');
const repoRoot = path.resolve(docsRoot, '..', '..');
const packagesRoot = path.join(repoRoot, 'packages');

/**
 * Packages of this repository. release-please rewrites the ranges between
 * them in every release commit, so no page or README states one.
 */
const WORKSPACE_SCOPE = '@routup/';

const GETTING_STARTED = 'guide/getting-started.md';

type Manifest = {
    name: string;
    private?: boolean;
    dependencies?: Record<string, string>;
    peerDependencies?: Record<string, string>;
};

function readManifests(): Map<string, Manifest> {
    const output = new Map<string, Manifest>();

    for (const folder of readdirSync(packagesRoot)) {
        const manifest = JSON.parse(readFileSync(path.join(packagesRoot, folder, 'package.json'), 'utf8')) as Manifest;

        if (!manifest.private) {
            output.set(folder, manifest);
        }
    }

    return output;
}

/**
 * The peers of a package as the Requirements table lists them: a
 * workspace package by name, any other with its range.
 */
function formatPeer(name: string, range: string): string {
    return name.startsWith(WORKSPACE_SCOPE) ? name : `${name}@${range}`;
}

/**
 * Rows of the Requirements table: package, routup range, other peers.
 * A peer is a backticked name, optionally followed by a backticked range.
 */
function readRequirementRows(markdown: string): Map<string, { routup: string; peers: string[] }> {
    const section = /^## Requirements\r?\n([\s\S]*?)(?=^## )/m.exec(markdown)?.[1] ?? '';
    const rows = new Map<string, { routup: string; peers: string[] }>();

    for (const line of section.split(/\r?\n/)) {
        const cells = line.split('|').slice(1, -1).map((cell) => cell.trim());

        if (cells.length !== 3 || !cells[0]?.includes(`\`${WORKSPACE_SCOPE}`)) {
            continue;
        }

        const name = /`([^`]+)`/.exec(cells[0])?.[1] ?? '';
        const routup = /`([^`]+)`/.exec(cells[1] ?? '')?.[1] ?? '';
        const peers = (cells[2] ?? '').split(',')
            .map((item) => item.matchAll(/`([^`]+)`/g).toArray().map((match) => match[1]!))
            .filter((spans) => spans.length > 0)
            .map(([peer, range]) => (range ? `${peer}@${range}` : peer!))
            .sort();

        rows.set(name, { routup, peers });
    }

    return rows;
}

type RangeStatement = {
    name: string;
    range: string;
};

const PACKAGE_NAME = String.raw`(?:@[a-z0-9-]+\/)?[a-z0-9][a-z0-9._-]*`;
const RANGE = String.raw`[\^~<>=\d][^\s\`,;)]*`;

/**
 * Version ranges a text states for a package: `` `name` `range` `` or
 * `` `name@range` ``, in code spans and in fenced code alike.
 */
function readRangeStatements(text: string): RangeStatement[] {
    const pattern = new RegExp(String.raw`\`(${PACKAGE_NAME})\`\s+\`(${RANGE})\`|\`(${PACKAGE_NAME})@(${RANGE})\``, 'g');

    return text.matchAll(pattern).toArray().map((match) => ({
        name: (match[1] ?? match[3])!,
        range: (match[2] ?? match[4])!,
    }));
}

/**
 * The docs pages (relative to src/), every package README and the root
 * README, each with the plugin folder it belongs to.
 */
function readDocuments(): {
    file: string; 
    text: string; 
    plugin?: string 
}[] {
    const pages = (readdirSync(srcRoot, { recursive: true }) as string[])
        .map((file) => file.split(path.sep).join('/'))
        .filter((file) => file.endsWith('.md') && !file.startsWith('.vitepress'))
        .map((file) => ({
            file: `packages/docs/src/${file}`,
            text: readFileSync(path.join(srcRoot, file), 'utf8'),
            plugin: file.includes('/') ? file.split('/')[0] : undefined,
        }));
    const readmes = readdirSync(packagesRoot)
        .filter((folder) => folder !== 'docs')
        .map((folder) => ({
            file: `packages/${folder}/README.md`,
            text: readFileSync(path.join(packagesRoot, folder, 'README.md'), 'utf8'),
            plugin: folder,
        }));

    return [
        ...pages,
        ...readmes,
        { file: 'README.md', text: readFileSync(path.join(repoRoot, 'README.md'), 'utf8') },
    ];
}

describe('readRangeStatements', () => {
    it('reads both forms', () => {
        expect(readRangeStatements('- `routup` `^6.3.0` (peer), `prom-client@>=15.0.0` and `ioredis@^6`.')).toEqual([
            { name: 'routup', range: '^6.3.0' },
            { name: 'prom-client', range: '>=15.0.0' },
            { name: 'ioredis', range: '^6' },
        ]);
        expect(readRangeStatements('`@routup/rate-limit` `^4.0.3`, `@routup/assets@^6.0.0`')).toEqual([
            { name: '@routup/rate-limit', range: '^4.0.3' },
            { name: '@routup/assets', range: '^6.0.0' },
        ]);
    });

    it('ignores a name without a range', () => {
        expect(readRangeStatements('`@routup/rate-limit` (peer dependency), `routup` and `>=24`')).toEqual([]);
    });
});

describe('requirements', () => {
    const manifests = readManifests();

    it('lists in Getting Started the routup range and the peer dependencies of every plugin', () => {
        const rows = readRequirementRows(readFileSync(path.join(srcRoot, GETTING_STARTED), 'utf8'));
        const expected = new Map<string, { routup: string; peers: string[] }>();

        for (const manifest of manifests.values()) {
            const { routup = '', ...peers } = manifest.peerDependencies ?? {};

            expected.set(manifest.name, {
                routup,
                peers: Object.entries(peers).map(([name, range]) => formatPeer(name, range)).sort(),
            });
        }

        expect(expected.size).toBe(13);
        expect(Object.fromEntries(rows)).toEqual(Object.fromEntries(expected));
    });

    it('states no version range for a package of this repository', () => {
        const errors = readDocuments().flatMap(({ file, text }) => readRangeStatements(text)
            .filter((statement) => statement.name.startsWith(WORKSPACE_SCOPE))
            .map((statement) => `${file}: \`${statement.name}\` \`${statement.range}\``));

        expect(errors).toEqual([]);
    });

    it('states the ranges of a plugin as its package.json declares them', () => {
        const errors: string[] = [];
        let checked = 0;

        for (const {
            file, 
            text, 
            plugin, 
        } of readDocuments()) {
            if (file.endsWith(GETTING_STARTED)) {
                continue;
            }

            const manifest = plugin ? manifests.get(plugin) : undefined;
            const declared = {
                ...manifest?.dependencies,
                ...manifest?.peerDependencies,
            };

            for (const { name, range } of readRangeStatements(text)) {
                if (name.startsWith(WORKSPACE_SCOPE)) {
                    continue;
                }

                if (!manifest) {
                    if (name === 'routup') {
                        errors.push(`${file}: \`routup\` \`${range}\` outside a plugin; link to /guide/getting-started#requirements`);
                    }

                    continue;
                }

                if (name in declared) {
                    checked++;

                    if (declared[name] !== range) {
                        errors.push(`${file}: \`${name}\` \`${range}\`, package.json has \`${declared[name]}\``);
                    }
                } else if (name === 'routup') {
                    errors.push(`${file}: \`routup\` \`${range}\`, but routup is not a dependency of ${manifest.name}`);
                }
            }
        }

        // every overview and every README states the routup range
        expect(checked).toBeGreaterThanOrEqual(26);
        expect(errors).toEqual([]);
    });
});
