type LanguageEntry = {
    lang: string;
    quality: number;
};

function parseAcceptLanguage(header: string) : LanguageEntry[] {
    const entries : LanguageEntry[] = [];

    for (const part of header.split(',')) {
        const trimmed = part.trim();
        if (!trimmed) {
            continue;
        }

        const segments = trimmed.split(';');
        const lang = (segments[0] ?? '').trim();
        let quality = 1;

        for (const segment of segments.slice(1)) {
            const param = segment.trim();
            if (param.startsWith('q=')) {
                quality = Number.parseFloat(param.substring(2));
                if (Number.isNaN(quality)) {
                    quality = 0;
                }
            }
        }

        if (lang) {
            entries.push({ lang, quality });
        }
    }

    entries.sort((a, b) => b.quality - a.quality);

    return entries;
}

export function negotiateLanguage(
    header: string | null,
    available: string[],
) : string | undefined {
    if (!header || available.length === 0) {
        return undefined;
    }

    const entries = parseAcceptLanguage(header);

    for (const entry of entries) {
        const requested = entry.lang.toLowerCase();

        // exact match
        const exact = available.find((a) => a.toLowerCase() === requested);
        if (exact) {
            return exact;
        }

        // base language match (e.g. "de-CH" matches "de")
        const base = requested.split('-')[0] ?? requested;
        const baseMatch = available.find((a) => a.toLowerCase() === base);
        if (baseMatch) {
            return baseMatch;
        }
    }

    return undefined;
}
