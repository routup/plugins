export function isRegexMatch(input: string, pattern: RegExp | RegExp[]) : boolean {
    const patterns = Array.isArray(pattern) ? pattern : [pattern];

    for (const pattern_ of patterns) {
        if (pattern_.test(input)) {
            return true;
        }
    }

    return false;
}
