import type { RtFooterColumn, RtFooterConfig, RtFooterLink } from './types';

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toArray(value: unknown): unknown[] {
    return Array.isArray(value) ? value : [];
}

function resolveLink(value: unknown, path: string): RtFooterLink {
    const link = isRecord(value) ? value.link : undefined;

    if (typeof link !== 'string' || link.length === 0) {
        throw new Error(`${path}.link is missing`);
    }

    const text = isRecord(value) && typeof value.text === 'string' ? value.text : link;

    return { text, link };
}

/**
 * Read `themeConfig.rtFooter`. Returns `undefined` when the site sets none,
 * drops columns without links and names the entry of a link without `link`.
 */
export function resolveFooter(themeConfig: unknown): RtFooterConfig | undefined {
    if (!isRecord(themeConfig) || !isRecord(themeConfig.rtFooter)) {
        return undefined;
    }

    const footer = themeConfig.rtFooter;

    const columns: RtFooterColumn[] = toArray(footer.columns)
        .map((column, i) => {
            const record = isRecord(column) ? column : {};

            return {
                title: typeof record.title === 'string' ? record.title : '',
                links: toArray(record.links).map((link, j) => resolveLink(
                    link,
                    `themeConfig.rtFooter.columns[${i}].links[${j}]`,
                )),
            };
        })
        .filter((column) => column.links.length > 0);

    return {
        tagline: typeof footer.tagline === 'string' ? footer.tagline : '',
        columns,
        note: typeof footer.note === 'string' ? footer.note : undefined,
    };
}
