export function isRegexMatch(input: string, pattern: RegExp | RegExp[]) : boolean {
    const patterns = Array.isArray(pattern) ? pattern : [pattern];

    for (let i = 0; i < patterns.length; i++) {
        if (patterns[i].test(input)) {
            return true;
        }
    }

    return false;
}
